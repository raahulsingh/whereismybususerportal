import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../apiConfig';
import TripMap from './TripMap';

function fmt(t) {
  if (!t) return '—';
  const d = new Date(t);
  if (isNaN(d)) return t;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(ts) {
  if (!ts) return '';
  const mins = Math.round((Date.now() - new Date(ts)) / 60000);
  if (mins <= 1) return 'Updated just now';
  if (mins < 60) return `Updated ${mins}m ago`;
  return `Updated ${Math.round(mins / 60)}h ago`;
}

// Returns delay info for a stop based on its scheduled arrival vs NOW
function getDelayInfo(arrivalTime) {
  if (!arrivalTime) return null;
  const scheduled = new Date(arrivalTime);
  if (isNaN(scheduled)) return null;
  const diffMin = Math.floor((Date.now() - scheduled) / 60000);
  if (diffMin > 0) return { type: 'late', min: diffMin };
  if (diffMin < 0) return { type: 'early', min: Math.abs(diffMin) };
  return { type: 'ontime', min: 0 };
}

function formatDelay(totalMin) {
  if (totalMin == null) return null;
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

function getTripStatus(tripStartTime) {
  if (!tripStartTime) return 'active';
  const start = new Date(tripStartTime);
  if (isNaN(start)) return 'active';
  const now = new Date();

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = start.getHours() * 60 + start.getMinutes();

  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (startDateOnly < todayDateOnly) {
    if (nowMins < startMins) return 'not_started';
    const diffMin = nowMins - startMins;
    if (diffMin > 24 * 60) return 'expired';
    return 'active';
  }

  if (now < start) return 'not_started';
  const diffMin = Math.floor((now - start) / 60000);
  if (diffMin > 24 * 60) return 'expired';
  return 'active';
}

const REFRESH_SEC = 30;

export default function TripDetails({ details: initialDetails, travelDate }) {
  if (!initialDetails) return null;

  const tripId = initialDetails?.tripId;

  const [details, setDetails] = useState(initialDetails);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(REFRESH_SEC);
  const [refreshing, setRefreshing] = useState(false);
  const [fallbackBusLoc, setFallbackBusLoc] = useState(null); // last known location from other trip
  const countdownRef = useRef(null);
  const fetchRef = useRef(null);

  useEffect(() => {
    setDetails(initialDetails);
    setCountdown(REFRESH_SEC);
    setLastRefresh(new Date());
    setFallbackBusLoc(null);
  }, [initialDetails]);

  const todayStr = (() => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  })();
  const isToday = !travelDate || travelDate === todayStr;

  const isActiveDay = (() => {
    if (isToday) return true;
    const firstStop = details?.stops?.[0];
    const lastStop = details?.stops?.[details?.stops?.length - 1];
    if (!firstStop?.departureTime || !lastStop?.arrivalTime) return isToday;
    const start = new Date(firstStop.departureTime);
    const end = new Date(lastStop.arrivalTime);
    const now = new Date();
    return now >= start && now <= new Date(end.getTime() + 4 * 3600 * 1000);
  })();

  // Fetch last known bus location ONLY for active days — when busState is null but bus has location from other trip
  useEffect(() => {
    if (!isActiveDay) { setFallbackBusLoc(null); return; }
    if (details?.busState || !details?.hasBusStateForOtherTrip || !details?.busId) return;
    fetch(getApiUrl('/api/admin/bus-state'))
      .then(r => r.json())
      .then(states => {
        const match = (Array.isArray(states) ? states : []).find(
          s => Number(s.busId) === Number(details.busId)
        );
        if (match && match.lat && match.lng) {
          setFallbackBusLoc({ lat: Number(match.lat), lng: Number(match.lng), lastPingAt: match.lastPingAt, nearestStopName: match.nearestStopName });
        }
      })
      .catch(() => { });
  }, [isActiveDay, details?.busState, details?.hasBusStateForOtherTrip, details?.busId]);

  const fetchLatest = async (id) => {
    if (!id) return;
    setRefreshing(true);
    try {
      const res = await fetch(getApiUrl(`/api/trips/${id}/details`));
      const data = await res.json();
      setDetails(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.warn('Auto-refresh failed:', e);
    } finally {
      setRefreshing(false);
      setCountdown(REFRESH_SEC);
    }
  };

  useEffect(() => {
    if (!tripId) return;
    fetchRef.current = setInterval(() => fetchLatest(tripId), REFRESH_SEC * 1000);
    return () => clearInterval(fetchRef.current);
  }, [tripId]);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? REFRESH_SEC : prev - 1));
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  const { busCode, routeName, stops = [], busState, currentStop } = details;

  // When using fallback location, override currentStop with fallback's nearest stop
  // Backend's currentStop in this case is just a time-based guess, not GPS-based
  const effectiveCurrentStop = (() => {
    if (busState) return currentStop; // Real bus state — trust backend's currentStop
    if (fallbackBusLoc?.nearestStopName) {
      // Find the stop in the route that matches the fallback nearest stop name
      const matchedStop = stops.find(s => s.stopName === fallbackBusLoc.nearestStopName);
      if (matchedStop) return { seq: matchedStop.seq, stopId: matchedStop.stopId, stopName: matchedStop.stopName };
    }
    return currentStop; // fallback to backend's time-based guess
  })();

  const currentSeq = effectiveCurrentStop?.seq;
  const currentName = effectiveCurrentStop?.stopName || stops[0]?.stopName || '';

  const firstStop = stops[0];
  const scheduledTripStatus = getTripStatus(firstStop?.departureTime);

  const busLat = Number(
    details?.currentLat ?? details?.busLat ?? details?.lat ??
    busState?.lat ?? busState?.latitude ?? busState?.currentLat ??
    fallbackBusLoc?.lat ?? null
  ) || null;

  const busLng = Number(
    details?.currentLng ?? details?.busLng ?? details?.lng ??
    busState?.lng ?? busState?.longitude ?? busState?.currentLng ??
    fallbackBusLoc?.lng ?? null
  ) || null;

  const isUsingFallbackLoc = !busState && !!fallbackBusLoc && !!busLat;

  // If backend returns busState for THIS trip, bus is active.
  // If not, follow scheduled departure window. 
  // We do NOT let fallback GPS for other trips force this trip into 'active' status.
  const tripStatus = (busState) ? 'active' : scheduledTripStatus;

  return (
    <div className="trip-details-card">

      {/* Header */}
      <div className="trip-details-header">
        <div>
          <div className="trip-bus-code">{busCode}</div>
          <div className="trip-route-name">{routeName}</div>
        </div>
        <div className="trip-bus-location">
          {!isActiveDay ? (
            <>
              <div className="trip-near-label">Scheduled departure</div>
              <div className="trip-near-stop">{fmt(firstStop?.departureTime)}</div>
            </>
          ) : ((busState || isUsingFallbackLoc) && tripStatus === 'active') ? (
            <>
              <div className="trip-near-label">Bus is near</div>
              <div className="trip-near-stop">{currentName}</div>
              {(busState?.lastPingAt || fallbackBusLoc?.lastPingAt) && (
                <div className="trip-updated">{timeAgo(busState?.lastPingAt || fallbackBusLoc?.lastPingAt)}</div>
              )}
            </>
          ) : tripStatus === 'not_started' ? (
            <>
              <div className="trip-near-label">Trip starts at</div>
              <div className="trip-near-stop">{fmt(firstStop?.departureTime)}</div>
            </>
          ) : (
            <>
              <div className="trip-near-label">Bus is near</div>
              <div className="trip-near-stop">{currentName}</div>
            </>
          )}
          {isActiveDay && busState?.lastPingAt && tripStatus === 'active' && (
            <div className="trip-updated">{timeAgo(busState.lastPingAt)}</div>
          )}
        </div>
      </div>

      {/* Auto-refresh bar — only for today */}
      {isActiveDay && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px', background: '#f0f4ff', border: '1px solid #c7d7ff',
          borderRadius: 8, fontSize: 12, color: '#3a56b0', marginBottom: 10, fontWeight: 500,
        }}>
          <span>
            {refreshing ? '🔄 Refreshing...' : `🕐 Auto-refresh in ${countdown}s`}
          </span>
          <button
            onClick={() => fetchLatest(tripId)}
            disabled={refreshing}
            style={{
              background: '#3a56b0', color: '#fff', border: 'none', borderRadius: 6,
              padding: '3px 10px', fontSize: 11, cursor: refreshing ? 'not-allowed' : 'pointer',
              fontWeight: 600, opacity: refreshing ? 0.6 : 1,
            }}
          >
            Refresh Now
          </button>
        </div>
      )}

      {/* Not started banner */}
      {isActiveDay && tripStatus === 'not_started' && (
        <div style={{
          margin: '8px 0', padding: '10px 14px', background: '#e8f4fd',
          border: '1px solid #90caf9', borderRadius: 8, fontSize: 13,
          color: '#1565c0', fontWeight: 500,
        }}>
          🕐 Trip has not started yet. Scheduled departure: <strong>{fmt(firstStop?.departureTime)}</strong>
        </div>
      )}

      {/* Timeline */}
      <div className="timeline">
        {stops.map((s, i) => {
          const isCurrent = currentSeq != null && s.seq === currentSeq;
          const isPassed = currentSeq != null && s.seq < currentSeq;
          const stateClass = isCurrent ? 'is-current' : isPassed ? 'is-passed' : 'is-future';

          const firstUnpassedIdx = stops.findIndex(stop => (currentSeq == null || stop.seq >= currentSeq));

          let badge = null;
          let dayDivider = null;

          const currentStopDateStr = (s.departureTime || s.arrivalTime)?.substring(0, 10);
          const prevStopDateStr = i > 0 ? (stops[i - 1].departureTime || stops[i - 1].arrivalTime)?.substring(0, 10) : null;
          if (currentStopDateStr && currentStopDateStr !== prevStopDateStr) {
            const firstStopDateStr = (stops[0].departureTime || stops[0].arrivalTime)?.substring(0, 10);
            const firstDate = new Date(firstStopDateStr);
            const currDate = new Date(currentStopDateStr);
            const dayDiff = Math.round((currDate - firstDate) / (24 * 3600 * 1000)) + 1;
            const dateFmt = currDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
            dayDivider = (
              <div style={{
                padding: '6px 0',
                margin: '10px 0 16px 24px',
                borderBottom: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
              }}>
                Day {dayDiff} — {dateFmt}
              </div>
            );
          }

          if (isActiveDay && !isPassed) {
            const delayInfo = getDelayInfo(s.departureTime || s.arrivalTime);

            if (busState) {
              // ✅ Bus location confirmed (live active trip) — show actual delay
              if (delayInfo?.type === 'late') {
                badge = (
                  <div style={{
                    marginTop: 3, display: 'inline-block',
                    background: '#fff3cd', color: '#856404',
                    border: '1px solid #ffc107', borderRadius: 6,
                    padding: '2px 8px', fontSize: 11, fontWeight: 600,
                  }}>
                    ⚠ Delayed by {formatDelay(delayInfo.min)}
                  </div>
                );
              } else if (delayInfo?.type === 'early') {
                badge = (
                  <div style={{
                    marginTop: 3, display: 'inline-block',
                    background: '#f0fdf4', color: '#166534',
                    border: '1px solid #86efac', borderRadius: 6,
                    padding: '2px 8px', fontSize: 11, fontWeight: 600,
                  }}>
                    🟢 Early by {formatDelay(delayInfo.min)}
                  </div>
                );
              }
            } else if (i === firstUnpassedIdx || firstUnpassedIdx === -1) {
              // ✅ No live bus state for this trip — show "Waiting for update" ONLY on the first un-passed stop
              if (delayInfo?.type === 'late') {
                badge = (
                  <div style={{
                    marginTop: 3, display: 'inline-block',
                    background: '#f8fafc', color: '#64748b',
                    border: '1px solid #e2e8f0', borderRadius: 6,
                    padding: '2px 8px', fontSize: 11, fontWeight: 600,
                  }}>
                    ⏳ Waiting for update · {formatDelay(delayInfo.min)} late as per schedule
                  </div>
                );
              } else if (delayInfo?.type === 'ontime' || delayInfo?.type === 'early') {
                badge = (
                  <div style={{
                    marginTop: 3, display: 'inline-block',
                    background: '#f8fafc', color: '#64748b',
                    border: '1px solid #e2e8f0', borderRadius: 6,
                    padding: '2px 8px', fontSize: 11, fontWeight: 600,
                  }}>
                    ⏳ Waiting for update
                  </div>
                );
              }
            }
          }

          return (
            <React.Fragment key={s.seq ?? i}>
              {dayDivider}
              <div className={`timeline-item ${stateClass}`}>
                <div className="timeline-dot" />
                {i < stops.length - 1 && <div className="timeline-line" />}
                <div className="timeline-stop-name">
                  {s.stopName}
                  {isCurrent && isActiveDay && <span className="here-badge">Bus here</span>}
                </div>
                <div className="timeline-stop-times">
                  {s.arrivalTime && <span>🟢 Arr {fmt(s.arrivalTime)}</span>}
                  {s.departureTime && <span>🔵 Dep {fmt(s.departureTime)}</span>}
                </div>
                {badge}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Map */}
      {isActiveDay && busLat && busLng && tripStatus === 'active' ? (
        <>
          {isUsingFallbackLoc && (
            <div style={{
              margin: '10px 0 0', padding: '8px 14px', background: '#fefce8',
              border: '1px solid #fde047', borderRadius: 8, fontSize: 12,
              color: '#854d0e', fontWeight: 500,
            }}>
              📍 Last known location{fallbackBusLoc?.nearestStopName ? ` (near ${fallbackBusLoc.nearestStopName})` : ''}
              {(busState?.lastPingAt || fallbackBusLoc?.lastPingAt) && (
                <span style={{ marginLeft: 8, color: '#a16207' }}> · {timeAgo(busState?.lastPingAt || fallbackBusLoc?.lastPingAt)}</span>
              )}
            </div>
          )}
          <div className="map-wrapper">
            <TripMap currentLat={busLat} currentLng={busLng} />
          </div>
        </>
      ) : isActiveDay && tripStatus === 'active' ? (
        <div className="map-unavailable">
          📍 Live location not available
        </div>
      ) : null}
    </div>
  );
}