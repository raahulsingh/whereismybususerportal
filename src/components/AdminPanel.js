import { useEffect, useState } from "react";

// ── Password Gate ──────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/booking/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        onLogin();
      } else {
        setErr("Wrong password. Try again.");
      }
    } catch {
      setErr("Server error. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 320, gap: 16,
    }}>
      <div style={{ fontSize: 36 }}>🔐</div>
      <div style={{ fontSize: 20, fontWeight: 500 }}>Admin Login</div>
      <input
        type="password"
        placeholder="Enter admin password"
        value={pw}
        onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        style={{ padding: "10px 16px", fontSize: 15, borderRadius: 8,
                 border: "1px solid #ccc", width: 260, outline: "none" }}
        autoFocus
      />
      {err && <div style={{ color: "#c0392b", fontSize: 13 }}>{err}</div>}
      <button
        onClick={submit}
        disabled={loading}
        style={{ padding: "10px 32px", background: "#2563eb", color: "#fff",
                 border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer" }}
      >
        {loading ? "Checking…" : "Enter Admin Panel"}
      </button>
    </div>
  );
}

// ── Shared section header ──────────────────────────────────────
function SectionHeader({ children }) {
  return (
    <h3 style={{ marginTop: 28, marginBottom: 10, fontSize: 16,
                 fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0",
                 paddingBottom: 6 }}>
      {children}
    </h3>
  );
}

// ── Stop Times Modal ───────────────────────────────────────────
function StopTimesModal({ tripId, tripInfo, onClose }) {
  const [stopTimes, setStopTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/trips/${tripId}/stop-times`)
      .then(r => r.json())
      .then(d => setStopTimes(Array.isArray(d) ? d : []))
      .catch(() => setStopTimes([]))
      .finally(() => setLoading(false));
  }, [tripId]);

  const fmt = dt => {
    if (!dt) return "—";
    const d = new Date(dt);
    return isNaN(d) ? dt : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "24px 28px",
        minWidth: 420, maxWidth: 560, maxHeight: "80vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              🗓 Trip #{tripId} — Stop Times
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {tripInfo?.busCode} · Departure: {tripInfo?.departureTime ? new Date(tripInfo.departureTime).toLocaleString() : "—"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 22,
            cursor: "pointer", color: "#94a3b8", lineHeight: 1,
          }}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>Loading stop times…</div>
        ) : stopTimes.length === 0 ? (
          <div style={{ color: "#ef4444", fontSize: 14, padding: "12px 0" }}>
            ⚠️ No stop times found. Please check backend.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stopTimes.map((st, i) => (
              <div key={st.stopId ?? i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", background: "#f8fafc",
                border: "1px solid #e2e8f0", borderRadius: 8,
              }}>
                {/* Timeline dot */}
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: i === 0 ? "#22c55e" : i === stopTimes.length - 1 ? "#ef4444" : "#3b82f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 11, fontWeight: 700,
                }}>
                  {st.seq ?? i + 1}
                </div>
                {/* Stop name */}
                <div style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>
                  {st.stopName || `Stop #${st.stopId}`}
                </div>
                {/* Times */}
                <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>ARRIVAL</div>
                    <div style={{
                      fontWeight: 600, color: "#16a34a",
                      background: "#f0fdf4", padding: "3px 8px", borderRadius: 5,
                    }}>
                      🟢 {fmt(st.arrivalDatetime || st.arrival_datetime)}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>DEPARTURE</div>
                    <div style={{
                      fontWeight: 600, color: "#2563eb",
                      background: "#eff6ff", padding: "3px 8px", borderRadius: 5,
                    }}>
                      🔵 {fmt(st.departureDatetime || st.departure_datetime)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Panel ───────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);

  const [routes, setRoutes]               = useState([]);
  const [newRoute, setNewRoute]           = useState("");
  const [selectedRoute, setSelectedRoute] = useState(null);

  const [stops, setStops]           = useState([]);
  const [editingStop, setEditingStop] = useState(null);
  // ✅ ADDED: offsetMin field to stop form
  const [stopForm, setStopForm]     = useState({ name: "", lat: "", lng: "", seq: "", offsetMin: "", priceOffset: "" });

  const [buses, setBuses]   = useState([]);
  const [busForm, setBusForm] = useState({ code: "", plate: "", driver: { id: "" } });

  const [drivers, setDrivers]         = useState([]);
  const [driverForm, setDriverForm]   = useState({ name: "", phone: "" });

  const [trips, setTrips]     = useState([]);
  const [tripForm, setTripForm] = useState({ busId: "", departureTime: "" });

  const [busStates, setBusStates] = useState([]);
  const [bsForm, setBsForm] = useState({ busId: "", tripId: "", lat: "", lng: "", speedKmph: "", headingDeg: "" });
  const [allStopsForBs, setAllStopsForBs] = useState([]);
  const [tripsForBus, setTripsForBus] = useState([]); // trips for selected bus
  // ✅ Trip date filter for bus-state tab — default: today
  const toLocalISODate = (dt) => {
    const d = dt ? new Date(dt) : new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
  };
  const [tripDateFilter, setTripDateFilter] = useState(toLocalISODate());

  const [activeTab, setActiveTab] = useState("routes");

  // ✅ ADDED: Stop times modal state
  const [stopTimesModal, setStopTimesModal] = useState(null); // { tripId, tripInfo }

  // ── loaders ──
  const loadRoutes  = () => fetch("/api/admin/routes").then(r => r.json()).then(d => setRoutes(Array.isArray(d) ? d : []));
  const loadDrivers = () => fetch("/api/admin/drivers").then(r => r.json()).then(d => setDrivers(Array.isArray(d) ? d : []));
  const loadStops   = id => fetch(`/api/admin/routes/${id}/stops`).then(r => r.json()).then(d => setStops(Array.isArray(d) ? d : []));
  const loadBuses   = id => fetch(`/api/admin/routes/${id}/buses`).then(r => r.json()).then(d => setBuses(Array.isArray(d) ? d : []));
  const loadTrips   = id => fetch(`/api/admin/routes/${id}/trips`).then(r => r.json()).then(d => setTrips(Array.isArray(d) ? d : []));
  const loadBusStates = () => fetch("/api/admin/bus-state").then(r => r.json()).then(d => setBusStates(Array.isArray(d) ? d : []));

  useEffect(() => {
    if (authed) { loadRoutes(); loadDrivers(); loadBusStates(); }
  }, [authed]);

  const selectRoute = r => {
    setSelectedRoute(r.id);
    loadStops(r.id);
    loadBuses(r.id);
    loadTrips(r.id);
    // ✅ Load stops for bus-state dropdown too
    fetch(`/api/admin/routes/${r.id}/stops`)
      .then(res => res.json())
      .then(d => setAllStopsForBs(Array.isArray(d) ? d : []));
  };

  // ── Routes ──
  const addRoute = async () => {
    if (!newRoute.trim()) return;
    await fetch("/api/admin/routes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newRoute }) });
    setNewRoute(""); loadRoutes();
  };
  const deleteRoute = async id => {
    await fetch(`/api/admin/routes/${id}`, { method: "DELETE" });
    setSelectedRoute(null); setStops([]); setBuses([]); setTrips([]); loadRoutes();
  };

  // ── Stops ──
  // ✅ UPDATED: now sends offsetMin to backend
  const addStop = async () => {
    if (!selectedRoute) return;
    if (!stopForm.offsetMin && stopForm.offsetMin !== 0) {
      alert("Offset minutes daalna zaroori hai — trip create hone par arrival/departure time isi se calculate hoga.");
      return;
    }
    await fetch(`/api/admin/routes/${selectedRoute}/stops`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: stopForm.name,
        lat: Number(stopForm.lat),
        lng: Number(stopForm.lng),
        seq: Number(stopForm.seq),
        offsetMin: Number(stopForm.offsetMin),
        priceOffset: Number(stopForm.priceOffset || 0),
      }),
    });
    setStopForm({ name: "", lat: "", lng: "", seq: "", offsetMin: "", priceOffset: "" });
    loadStops(selectedRoute);
  };

  const updateStop = async () => {
    await fetch(`/api/admin/stops/${editingStop}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...stopForm,
        lat: Number(stopForm.lat),
        lng: Number(stopForm.lng),
        seq: Number(stopForm.seq),
        offsetMin: Number(stopForm.offsetMin),
        priceOffset: Number(stopForm.priceOffset || 0),
      }),
    });
    setEditingStop(null);
    setStopForm({ name: "", lat: "", lng: "", seq: "", offsetMin: "", priceOffset: "" });
    loadStops(selectedRoute);
  };

  const deleteStop = async id => { await fetch(`/api/admin/stops/${id}`, { method: "DELETE" }); loadStops(selectedRoute); };

  // ── Drivers ──
  const addDriver = async () => {
    if (!driverForm.name.trim()) return;
    await fetch("/api/admin/drivers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(driverForm) });
    setDriverForm({ name: "", phone: "" }); loadDrivers();
  };
  const deleteDriver = async id => { await fetch(`/api/admin/drivers/${id}`, { method: "DELETE" }); loadDrivers(); };

  // ── Buses ──
  const addBus = async () => {
    if (!selectedRoute || !busForm.code || !busForm.plate || !busForm.driver.id) { alert("Fill all fields and select a route."); return; }
    await fetch(`/api/admin/routes/${selectedRoute}/buses`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: busForm.code, plate: busForm.plate, driver: { id: Number(busForm.driver.id) } }),
    });
    setBusForm({ code: "", plate: "", driver: { id: "" } }); loadBuses(selectedRoute);
  };
  const deleteBus = async id => { await fetch(`/api/admin/buses/${id}`, { method: "DELETE" }); loadBuses(selectedRoute); };

  // ── Trips ──
  const addTrip = async () => {
    if (!selectedRoute || !tripForm.busId || !tripForm.departureTime) { alert("Please select both bus and departure time."); return; }
    const res = await fetch(`/api/admin/routes/${selectedRoute}/trips`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busId: Number(tripForm.busId), departureTime: tripForm.departureTime }),
    });
    const data = await res.json();
    if (data.error) { alert("Error: " + data.error); return; }
    alert(`Trip created! ID: ${data.tripId} | ${data.stopTimesCreated} stop times generated.`);
    setTripForm({ busId: "", departureTime: "" }); loadTrips(selectedRoute);
  };
  const deleteTrip = async id => { await fetch(`/api/admin/trips/${id}`, { method: "DELETE" }); loadTrips(selectedRoute); };

  // ── Bus State ──
  const saveBusState = async () => {
    if (!bsForm.busId || !bsForm.lat || !bsForm.lng) { alert("Bus ID, lat aur lng required hai."); return; }
    if (!bsForm.tripId) { alert("Please select a trip — bus state must be trip-specific."); return; }
    const res = await fetch("/api/admin/bus-state", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        busId: Number(bsForm.busId),
        tripId: Number(bsForm.tripId),
        stopId: bsForm._stopId ? Number(bsForm._stopId) : null,
        lat: Number(bsForm.lat),
        lng: Number(bsForm.lng),
        speedKmph: Number(bsForm.speedKmph || 0),
        headingDeg: Number(bsForm.headingDeg || 0),
      }),
    });
    const data = await res.json();
    if (data.error) { alert("Error: " + data.error); return; }
    alert("Bus state updated for Trip #" + bsForm.tripId + "!"); loadBusStates();
  };

  // Load trips when bus is selected in bus-state form
  const loadTripsForBus = async (busId) => {
    if (!busId) { setTripsForBus([]); return; }
    try {
      const data = await fetch(`/api/admin/buses/${busId}/trips`).then(r => r.json());
      setTripsForBus(Array.isArray(data) ? data : []);
    } catch { setTripsForBus([]); }
  };

  const fmtTripDate = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Today's date string for highlighting
  const todayStr = toLocalISODate();

  // ── styles ──
  const inp = { padding: "8px 12px", fontSize: 14, borderRadius: 7, border: "1px solid #cbd5e1", outline: "none", background: "#fff" };
  const btn = (variant = "primary") => ({
    padding: "8px 18px", fontSize: 13, borderRadius: 7, cursor: "pointer", border: "none",
    background: variant === "danger" ? "#ef4444" : variant === "secondary" ? "#e2e8f0" : variant === "info" ? "#0ea5e9" : "#2563eb",
    color: variant === "secondary" ? "#334155" : "#fff",
  });
  const tab = active => ({
    padding: "8px 18px", fontSize: 14, borderRadius: 7, cursor: "pointer",
    border: "none", fontWeight: active ? 600 : 400,
    background: active ? "#2563eb" : "#f1f5f9", color: active ? "#fff" : "#475569",
  });

  const selectedRouteName = routes.find(r => r.id === selectedRoute)?.name;

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />;

  return (
    <div className="admin-panel" style={{ maxWidth: 860, margin: "0 auto", padding: "1rem 1.5rem" }}>

      {/* Stop Times Modal */}
      {stopTimesModal && (
        <StopTimesModal
          tripId={stopTimesModal.tripId}
          tripInfo={stopTimesModal.tripInfo}
          onClose={() => setStopTimesModal(null)}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>🛠 Admin Panel</h2>
        <button style={{ ...btn("secondary"), fontSize: 12 }} onClick={() => setAuthed(false)}>Logout</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["routes", "drivers", "bus-state"].map(t => (
          <button key={t} style={tab(activeTab === t)} onClick={() => setActiveTab(t)}>
            {{ routes: "🛣 Routes & Trips", drivers: "👤 Drivers", "bus-state": "📡 Bus State" }[t]}
          </button>
        ))}
      </div>

      {/* ══ ROUTES TAB ══ */}
      {activeTab === "routes" && (
        <>
          <SectionHeader>Routes</SectionHeader>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input style={{ ...inp, flex: 1 }} placeholder="Route name (e.g. Dehradun - Rishikesh)"
              value={newRoute} onChange={e => setNewRoute(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addRoute()} />
            <button style={btn()} onClick={addRoute}>+ Add Route</button>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px" }}>
            {routes.map(r => (
              <li key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: selectedRoute === r.id ? "#eff6ff" : "#f8fafc",
                border: `1px solid ${selectedRoute === r.id ? "#93c5fd" : "#e2e8f0"}`,
                borderRadius: 8, marginBottom: 6 }}>
                <span>🛣 {r.name}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={btn("secondary")} onClick={() => selectRoute(r)}>
                    {selectedRoute === r.id ? "✓ Selected" : "Select"}
                  </button>
                  <button style={btn("danger")} onClick={() => deleteRoute(r.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>

          {selectedRoute && (
            <>
              {/* ── Stops ── */}
              <SectionHeader>📍 Stops — {selectedRouteName}</SectionHeader>

              {/* ✅ UPDATED: Added Offset (min) field with tooltip */}
              <div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 8, padding: "8px 14px", marginBottom: 10, fontSize: 13, color: "#854d0e" }}>
                💡 <strong>Offset (min)</strong> = Minutes after departure when bus arrives here. First stop = 0, second = 10 means it arrives 10 mins later.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <input style={{ ...inp, flex: 2, minWidth: 120 }} placeholder="Stop name"
                  value={stopForm.name} onChange={e => setStopForm({ ...stopForm, name: e.target.value })} />
                <input style={{ ...inp, width: 110 }} placeholder="Latitude"
                  value={stopForm.lat} onChange={e => setStopForm({ ...stopForm, lat: e.target.value })} />
                <input style={{ ...inp, width: 110 }} placeholder="Longitude"
                  value={stopForm.lng} onChange={e => setStopForm({ ...stopForm, lng: e.target.value })} />
                <input style={{ ...inp, width: 80 }} placeholder="Seq #"
                  value={stopForm.seq} onChange={e => setStopForm({ ...stopForm, seq: e.target.value })} />
                {/* ⏱ Offset */}
                <input
                  style={{ ...inp, width: 110, borderColor: "#fbbf24", background: "#fffbeb" }}
                  placeholder="⏱ Offset (min)"
                  type="number"
                  min="0"
                  title="Minutes after departure time when the bus reaches this stop"
                  value={stopForm.offsetMin}
                  onChange={e => setStopForm({ ...stopForm, offsetMin: e.target.value })}
                />
                {/* 💰 Price Offset */}
                <input
                  style={{ ...inp, width: 120, borderColor: "#86efac", background: "#f0fdf4" }}
                  placeholder="💰 Price +/- (₹)"
                  type="number"
                  title="Additional cost to reach this stop. e.g. Ara=0, Aurangabad=+50 means ₹50 extra added to base fare."
                  value={stopForm.priceOffset}
                  onChange={e => setStopForm({ ...stopForm, priceOffset: e.target.value })}
                />
                {editingStop ? (
                  <>
                    <button style={btn()} onClick={updateStop}>Update</button>
                    <button style={btn("secondary")} onClick={() => { setEditingStop(null); setStopForm({ name: "", lat: "", lng: "", seq: "", offsetMin: "", priceOffset: "" }); }}>Cancel</button>
                  </>
                ) : (
                  <button style={btn()} onClick={addStop}>+ Add Stop</button>
                )}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px" }}>
                {stops.map(s => (
                  <li key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 5 }}>
                    <span>
                      #{s.seq} — {s.name}
                      <span style={{ fontSize: 11, color: "#94a3b8" }}> ({s.lat}, {s.lng})</span>
                      {/* ✅ Show offset if available */}
                      {s.offsetMin != null && (
                        <span style={{ fontSize: 11, marginLeft: 8, background: "#fef9c3", color: "#92400e",
                          padding: "1px 7px", borderRadius: 10, border: "1px solid #fde047" }}>
                          ⏱ +{s.offsetMin} min
                        </span>
                      )}
                      {s.priceOffset != null && s.priceOffset !== 0 && (
                        <span style={{ fontSize: 11, marginLeft: 6, background: "#f0fdf4", color: "#15803d",
                          padding: "1px 7px", borderRadius: 10, border: "1px solid #86efac" }}>
                          💰 {s.priceOffset > 0 ? "+" : ""}{s.priceOffset} ₹
                        </span>
                      )}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={btn("secondary")} onClick={() => {
                        setEditingStop(s.id);
                        setStopForm({ name: s.name, lat: s.lat, lng: s.lng, seq: s.seq, offsetMin: s.offsetMin ?? "", priceOffset: s.priceOffset ?? "" });
                      }}>Edit</button>
                      <button style={btn("danger")} onClick={() => deleteStop(s.id)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* ── Buses ── */}
              <SectionHeader>🚌 Buses — {selectedRouteName}</SectionHeader>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <input style={{ ...inp, width: 130 }} placeholder="Bus code (B10A)" value={busForm.code}  onChange={e => setBusForm({ ...busForm, code: e.target.value })} />
                <input style={{ ...inp, width: 150 }} placeholder="Plate number"    value={busForm.plate} onChange={e => setBusForm({ ...busForm, plate: e.target.value })} />
                <select style={{ ...inp, width: 180 }} value={busForm.driver.id} onChange={e => setBusForm({ ...busForm, driver: { id: e.target.value } })}>
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>)}
                </select>
                <button style={btn()} onClick={addBus}>+ Add Bus</button>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px" }}>
                {buses.map(b => (
                  <li key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 5 }}>
                    <div>
                      <strong>{b.code}</strong> · {b.plate}
                      <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>Driver: {b.driver?.name}</span>
                    </div>
                    <button style={btn("danger")} onClick={() => deleteBus(b.id)}>Delete</button>
                  </li>
                ))}
              </ul>

              {/* ── Trips ── */}
              <SectionHeader>🗓 Trips — {selectedRouteName}</SectionHeader>
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#0369a1" }}>
                ℹ️ Creating a trip <strong>automatically generates stop_times</strong> — populating arrival and departure times for each stop on the route. View them using the <strong>👁 View Times</strong> button.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <select style={{ ...inp, width: 200 }} value={tripForm.busId} onChange={e => setTripForm({ ...tripForm, busId: e.target.value })}>
                  <option value="">Select Bus</option>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.code} ({b.plate})</option>)}
                </select>
                <input style={{ ...inp, width: 220 }} type="datetime-local" value={tripForm.departureTime}
                  onChange={e => setTripForm({ ...tripForm, departureTime: e.target.value })} />
                <button style={btn()} onClick={addTrip}>+ Create Trip</button>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {trips.map(t => (
                  <li key={t.tripId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 5 }}>
                    <div>
                      <strong>Trip #{t.tripId}</strong> · {t.busCode}
                      <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>
                        {t.departureTime ? new Date(t.departureTime).toLocaleString() : "—"}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>[{t.status}]</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {/* ✅ NEW: View Stop Times button */}
                      <button
                        style={btn("info")}
                        onClick={() => setStopTimesModal({ tripId: t.tripId, tripInfo: t })}
                      >
                        👁 View Times
                      </button>
                      <button style={btn("danger")} onClick={() => deleteTrip(t.tripId)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* ══ DRIVERS TAB ══ */}
      {activeTab === "drivers" && (
        <>
          <SectionHeader>👤 Drivers</SectionHeader>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input style={{ ...inp, flex: 1 }} placeholder="Driver name" value={driverForm.name} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} />
            <input style={{ ...inp, width: 160 }} placeholder="Phone number" value={driverForm.phone} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} />
            <button style={btn()} onClick={addDriver}>+ Add Driver</button>
          </div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {drivers.map(d => (
              <li key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 6 }}>
                <div>
                  <strong>{d.name}</strong>
                  <span style={{ fontSize: 13, color: "#64748b", marginLeft: 10 }}>📞 {d.phone || "—"}</span>
                </div>
                <button style={btn("danger")} onClick={() => deleteDriver(d.id)}>Delete</button>
              </li>
            ))}
            {drivers.length === 0 && <li style={{ color: "#94a3b8", fontSize: 14 }}>No drivers found.</li>}
          </ul>
        </>
      )}

      {/* ══ BUS STATE TAB ══ */}
      {activeTab === "bus-state" && (
        <>
          <SectionHeader>📡 Bus State — Manual Override</SectionHeader>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px", marginBottom: 14 }}>

            {/* Row 1: Bus + Date Filter + Trip */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "flex-end" }}>
              {/* Bus Select */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>BUS</div>
                <select style={{ ...inp, width: 160 }} value={bsForm.busId}
                  onChange={e => {
                    const busId = e.target.value;
                    setBsForm({ ...bsForm, busId, tripId: "", _stopId: "", lat: "", lng: "" });
                    loadTripsForBus(busId);
                  }}>
                  <option value="">Select Bus</option>
                  {routes.flatMap(() => buses).length === 0
                    ? <option disabled>Select a route from Routes tab first</option>
                    : buses.map(b => <option key={b.id} value={b.id}>{b.code}</option>)
                  }
                </select>
              </div>

              {/* ✅ Trip Date Filter — default: today */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                  TRIP DATE FILTER
                  <span style={{ fontWeight: 400, marginLeft: 6, color: "#94a3b8" }}>(filters trips)</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="date"
                    style={{ ...inp, width: 160, borderColor: tripDateFilter === todayStr ? "#2563eb" : "#cbd5e1" }}
                    value={tripDateFilter}
                    onChange={e => {
                      setTripDateFilter(e.target.value);
                      setBsForm(f => ({ ...f, tripId: "" })); // reset trip on date change
                    }}
                  />
                  {tripDateFilter !== todayStr && (
                    <button
                      type="button"
                      style={{ ...btn("secondary"), fontSize: 11, padding: "6px 10px" }}
                      onClick={() => { setTripDateFilter(todayStr); setBsForm(f => ({ ...f, tripId: "" })); }}
                    >
                      Today
                    </button>
                  )}
                  {tripDateFilter === todayStr && (
                    <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>✅ Today</span>
                  )}
                </div>
              </div>

              {/* Trip Select — filtered by date */}
              {bsForm.busId && (
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                    TRIP <span style={{ color: "#ef4444" }}>*</span>
                    <span style={{ fontWeight: 400, marginLeft: 6 }}>(bus state will only be saved for this trip)</span>
                  </div>
                  {(() => {
                    const filtered = tripsForBus.filter(t => {
                      if (!tripDateFilter) return true;
                      return toLocalISODate(t.departureTime) === tripDateFilter;
                    });
                    return (
                      <select style={{ ...inp, width: "100%" }} value={bsForm.tripId}
                        onChange={e => setBsForm({ ...bsForm, tripId: e.target.value })}>
                        <option value="">
                          {filtered.length === 0
                            ? `No trips found on ${tripDateFilter}`
                            : `Select Trip (${filtered.length} available)`}
                        </option>
                        {filtered.map(t => {
                          const dateStr = toLocalISODate(t.departureTime);
                          const isTodayTrip = dateStr === todayStr;
                          return (
                            <option key={t.tripId} value={t.tripId}>
                              {isTodayTrip ? "✅ " : "📅 "}
                              Trip #{t.tripId} — {fmtTripDate(t.departureTime)}
                              {isTodayTrip ? " (Today)" : ""}
                              [{t.status}]
                            </option>
                          );
                        })}
                      </select>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Row 2: Stop + Lat/Lng + Speed */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>STOP (auto lat/lng)</div>
                <select style={{ ...inp, width: 220 }} value={bsForm._stopId || ""}
                  onChange={e => {
                    const stopId = e.target.value;
                    const stop = allStopsForBs.find(s => String(s.id) === String(stopId));
                    setBsForm({ ...bsForm, _stopId: stopId,
                      lat: stop ? String(stop.lat) : "",
                      lng: stop ? String(stop.lng) : "",
                    });
                  }}>
                  <option value="">Select Stop</option>
                  {allStopsForBs.map(s => (
                    <option key={s.id} value={s.id}>#{s.seq} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>LAT</div>
                <input style={{ ...inp, width: 120, background: "#f1f5f9", color: "#64748b" }}
                  placeholder="Auto-fill" value={bsForm.lat}
                  onChange={e => setBsForm({ ...bsForm, lat: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>LNG</div>
                <input style={{ ...inp, width: 120, background: "#f1f5f9", color: "#64748b" }}
                  placeholder="Auto-fill" value={bsForm.lng}
                  onChange={e => setBsForm({ ...bsForm, lng: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>SPEED (kmph)</div>
                <input style={{ ...inp, width: 100 }} placeholder="0"
                  value={bsForm.speedKmph} onChange={e => setBsForm({ ...bsForm, speedKmph: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>HEADING °</div>
                <input style={{ ...inp, width: 90 }} placeholder="0"
                  value={bsForm.headingDeg} onChange={e => setBsForm({ ...bsForm, headingDeg: e.target.value })} />
              </div>
              <button style={{ ...btn(), padding: "10px 22px", fontWeight: 700 }} onClick={saveBusState}>
                💾 Save State
              </button>
              <button style={btn("secondary")} onClick={loadBusStates}>↻ Refresh</button>
            </div>

            {/* Hint */}
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
              💡 First select a route from the <strong>Routes</strong> tab → This populates the Bus and Stop dropdowns.<br/>
              Select a Trip → the bus state will be saved <strong>only for that trip</strong>, leaving other trips unaffected.
            </div>
          </div>

          <SectionHeader>Current Bus States</SectionHeader>
          {busStates.length === 0
            ? <div style={{ color: "#94a3b8", fontSize: 14 }}>NO Live Buses Found</div>
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      {["Bus", "Route", "Lat", "Lng", "Speed", "Nearest Stop", "Last Ping"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {busStates.map((s, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 10px" }}><strong>{s.busCode}</strong></td>
                        <td style={{ padding: "8px 10px", color: "#475569" }}>{s.routeName || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>{Number(s.lat).toFixed(5)}</td>
                        <td style={{ padding: "8px 10px" }}>{Number(s.lng).toFixed(5)}</td>
                        <td style={{ padding: "8px 10px" }}>{s.speedKmph ? `${s.speedKmph} km/h` : "—"}</td>
                        <td style={{ padding: "8px 10px" }}>{s.nearestStopName || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontSize: 12 }}>
                          {s.lastPingAt ? new Date(s.lastPingAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </>
      )}
    </div>
  );
}