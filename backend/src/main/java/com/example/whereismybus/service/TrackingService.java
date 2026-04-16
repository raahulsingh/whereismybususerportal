package com.example.whereismybus.service;

import com.example.whereismybus.dto.*;
import com.example.whereismybus.entity.*;
import com.example.whereismybus.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TrackingService {

    private final RouteRepo routeRepo;
    private final StopRepo stopRepo;
    private final BusRepo busRepo;
    private final BusLocationRepo locRepo;
    private final BusStateRepo stateRepo;

    // tuning
    private static final double DEFAULT_SPEED_KMPH = 18.0;
    private static final int LIVE_WITHIN_MIN = 10;
    private static final int JUST_DEPARTED_WITHIN_MIN = 7;

    // stop radius to consider "at stop" (km). ~0.12 km = 120 m
    private static final double STOP_RADIUS_KM = 0.12;

    public TrackingService(RouteRepo routeRepo,
                           StopRepo stopRepo,
                           BusRepo busRepo,
                           BusLocationRepo locRepo,
                           BusStateRepo stateRepo) {
        this.routeRepo = routeRepo;
        this.stopRepo = stopRepo;
        this.busRepo = busRepo;
        this.locRepo = locRepo;
        this.stateRepo = stateRepo;
    }

    /* ---------------- Driver / simulator updates ---------------- */

    public void recordLocation(BusLocationUpdateDto req) {
        if (req == null || req.getBusId() == null) return;

        Bus bus = busRepo.findById(req.getBusId()).orElse(null);
        if (bus == null) return;

        // 1. History table: bus_locations
        BusLocation loc = new BusLocation();
        loc.setBus(bus);
        loc.setLat(req.getLat());
        loc.setLng(req.getLng());
        loc.setSpeedKmph(req.getSpeedKmph());
        loc.setHeadingDeg(req.getHeadingDeg());
        loc.setCreatedAt(Instant.now());
        locRepo.save(loc);

        // 2. Latest state table: bus_state (one row per bus)
        BusState st = stateRepo.findById(bus.getId()).orElseGet(() -> {
            BusState s = new BusState();
            s.setId(bus.getId());
            s.setBus(bus);
            return s;
        });

        st.setRoute(bus.getRoute());
        st.setLat(loc.getLat());
        st.setLng(loc.getLng());
        st.setSpeedKmph(loc.getSpeedKmph());
        st.setHeadingDeg(loc.getHeadingDeg());
        st.setLastPingAt(Instant.now());
        st.setUpdatedAt(Instant.now());

        // 3. Nearest stop + atStop flag
        if (bus.getRoute() != null && req.getLat() != null && req.getLng() != null) {
            List<Stop> stops = stopRepo.findByRouteIdOrderBySeqAsc(bus.getRoute().getId());
            Stop nearest = null;
            double best = Double.MAX_VALUE;

            double busLat = req.getLat().doubleValue();
            double busLng = req.getLng().doubleValue();

            for (Stop stop : stops) {
                double stopLat = stop.getLat().doubleValue();
                double stopLng = stop.getLng().doubleValue();
                double d = haversine(busLat, busLng, stopLat, stopLng);
                if (d < best) {
                    best = d;
                    nearest = stop;
                }
            }

            if (nearest != null) {
                st.setNearestStopId(nearest.getId());
                st.setAtStop(best <= STOP_RADIUS_KM);
            }
        }

        stateRepo.save(st);
    }

    /* ---------------- Live buses (for frontend) ---------------- */

    /**
     * Bug 3 fix: load all BusState rows in one query, build a Map — eliminates
     * the N+1 pattern where each bus triggered a separate stateRepo.findById() call.
     */
    public List<LiveBusDTO> getLiveBuses(Long routeId) {
        List<Bus> buses = busRepo.findAll();

        // Single bulk fetch instead of one query per bus
        List<BusState> allStates = stateRepo.findAll();
        Map<Long, BusState> stateMap = allStates.stream()
                .collect(Collectors.toMap(BusState::getId, s -> s));

        List<LiveBusDTO> result = new ArrayList<>();
        Instant now = Instant.now();

        for (Bus bus : buses) {
            if (routeId != null) {
                Route r = bus.getRoute();
                if (r == null || !Objects.equals(r.getId(), routeId)) continue;
            }

            BusState s = stateMap.get(bus.getId());
            if (s == null) continue;
            if (s.getLastPingAt() == null) continue;

            long minutes = Duration.between(s.getLastPingAt(), now).toMinutes();
            if (minutes > LIVE_WITHIN_MIN) continue;

            Long nearestStopId = s.getNearestStopId();
            boolean atStop = Boolean.TRUE.equals(s.getAtStop());
            Double nearestDistKm = null;

            if (nearestStopId != null && s.getLat() != null && s.getLng() != null) {
                Stop stop = stopRepo.findById(nearestStopId).orElse(null);
                if (stop != null) {
                    nearestDistKm = haversine(
                            bd(s.getLat()), bd(s.getLng()),
                            bd(stop.getLat()), bd(stop.getLng())
                    );
                }
            }

            LiveBusDTO dto = new LiveBusDTO();
            dto.setBusId(bus.getId());
            dto.setBusCode(bus.getCode());
            dto.setRouteName(bus.getRoute() != null ? bus.getRoute().getName() : null);
            dto.setLat(s.getLat());
            dto.setLng(s.getLng());
            dto.setSpeedKmph(s.getSpeedKmph());
            dto.setLastPingAt(s.getLastPingAt());
            dto.setNearestStopId(nearestStopId);
            dto.setAtStop(atStop);
            dto.set_nearestDistanceKm(nearestDistKm);

            result.add(dto);
        }

        return result;
    }

    /* ---------------- ETA / planner helpers ---------------- */

    public EtaResp estimateEta(Long busId, Long stopId) {
        BusState st = stateRepo.findById(busId).orElseThrow();
        Stop stop = stopRepo.findById(stopId).orElseThrow();

        double distKm = haversine(
                bd(st.getLat()), bd(st.getLng()),
                bd(stop.getLat()), bd(stop.getLng())
        );

        double speed = safeSpeedKmph(st.getSpeedKmph());
        long seconds = Math.round((distKm / speed) * 3600.0);
        return new EtaResp(busId, stopId, Math.max(30, seconds));
    }

    public PlanResponse plan(Long srcStopId, Long dstStopId) {
        Stop src = stopRepo.findById(srcStopId).orElseThrow();
        Stop dst = stopRepo.findById(dstStopId).orElseThrow();

        if (!Objects.equals(src.getRoute().getId(), dst.getRoute().getId())) return new PlanResponse(List.of());
        if (src.getSeq() >= dst.getSeq()) return new PlanResponse(List.of());

        Long routeId = src.getRoute().getId();
        String routeName = src.getRoute().getName();

        Instant since = Instant.now().minus(Duration.ofMinutes(LIVE_WITHIN_MIN));
        List<BusState> live = stateRepo.liveSince(routeId, since);

        List<NextBus> next = live.stream()
                .map(b -> projectToNextBus(b, src))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(NextBus::getEtaMinToSource))
                .limit(5)
                .collect(Collectors.toList());

        StopLite srcLite = new StopLite(src.getId(), src.getName(), src.getSeq(), src.getLat(), src.getLng());
        StopLite dstLite = new StopLite(dst.getId(), dst.getName(), dst.getSeq(), dst.getLat(), dst.getLng());

        RouteOption option = new RouteOption(routeId, routeName, srcLite, dstLite, next);
        return new PlanResponse(List.of(option));
    }

    public DepartedResponse departed(Long srcStopId, Long dstStopId) {
        Stop src = stopRepo.findById(srcStopId).orElseThrow();
        Stop dst = stopRepo.findById(dstStopId).orElseThrow();

        if (!Objects.equals(src.getRoute().getId(), dst.getRoute().getId()) || src.getSeq() >= dst.getSeq()) {
            return new DepartedResponse(List.of());
        }

        Instant since = Instant.now().minus(Duration.ofMinutes(JUST_DEPARTED_WITHIN_MIN));
        List<BusState> live = stateRepo.liveSince(src.getRoute().getId(), since);

        List<DepartedBus> out = new ArrayList<>();
        for (BusState b : live) {
            if (!isAfterStop(b, src)) continue;

            int minutesAgo = (int) Math.max(0, Duration.between(b.getLastPingAt(), Instant.now()).toMinutes());
            int etaToDst = estimateSegmentEtaMin(b, dst);
            out.add(new DepartedBus(
                    b.getBus().getId(),
                    b.getBus().getCode(),
                    b.getRoute().getId(),
                    b.getLastPingAt(),
                    minutesAgo,
                    etaToDst
            ));
        }

        out.sort(Comparator.comparingInt(DepartedBus::getMinutesAgo));
        return new DepartedResponse(out);
    }

    /* ---------------- small helpers ---------------- */

    private NextBus projectToNextBus(BusState b, Stop source) {
        if (b.getRoute() == null || source.getRoute() == null) return null;
        if (!Objects.equals(b.getRoute().getId(), source.getRoute().getId())) return null;
        if (isAfterStop(b, source)) return null;

        double distKm = haversine(
                bd(b.getLat()), bd(b.getLng()),
                bd(source.getLat()), bd(source.getLng())
        );
        double speed = safeSpeedKmph(b.getSpeedKmph());
        int etaMin = (int) Math.ceil((distKm / speed) * 60.0);

        return new NextBus(
                b.getBus().getId(),
                b.getBus().getCode(),
                b.getRoute().getId(),
                distKm,
                etaMin,
                b.getLastPingAt()
        );
    }

    private boolean isAfterStop(BusState b, Stop source) {
        if (b.getRoute() == null) return false;
        List<Stop> stops = stopRepo.findByRouteIdOrderBySeqAsc(b.getRoute().getId());
        Stop nearest = null;
        double best = Double.MAX_VALUE;
        double lat = bd(b.getLat()), lng = bd(b.getLng());
        for (Stop s : stops) {
            double d = haversine(lat, lng, bd(s.getLat()), bd(s.getLng()));
            if (d < best) { best = d; nearest = s; }
        }
        return nearest != null && nearest.getSeq() >= source.getSeq();
    }

    private int estimateSegmentEtaMin(BusState b, Stop dst) {
        double speed = safeSpeedKmph(b.getSpeedKmph());
        double distKm = haversine(bd(b.getLat()), bd(b.getLng()), bd(dst.getLat()), bd(dst.getLng()));
        return (int) Math.ceil(distKm / speed * 60.0);
    }

    private static double safeSpeedKmph(BigDecimal speedKmph) {
        if (speedKmph == null) return DEFAULT_SPEED_KMPH;
        double val = speedKmph.doubleValue();
        if (val <= 1.0) return DEFAULT_SPEED_KMPH;
        return val;
    }

    private static double bd(BigDecimal v) {
        return v == null ? 0.0 : v.doubleValue();
    }

    /**
     * Haversine formula — returns distance in km.
     *
     * Bug 2 fix: was `Math.toRadians(lat2 - lon1)` (copy-paste typo).
     * Correct formula uses lon2 - lon1 for the longitude delta.
     */
    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0088;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1); // FIX: was lat2 - lon1
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}