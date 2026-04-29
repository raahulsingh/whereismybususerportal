import React from "react";
import { fmtDate, fmt } from "../utils/bookingUtils";

// ── Step 4: Booking Confirmed ────────────────────────────────────
export default function BookingConfirmed({ bookingData, trip, seats, passengers, onDone, onBookMore, searchInfo }) {
  const totalAmount = Array.isArray(seats) && seats.length > 0 && typeof seats[0] === 'object'
    ? seats.reduce((sum, s) => sum + (s.price || Number(trip.price)), 0)
    : seats.length * Number(trip.price);
  const printRef = React.useRef(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWin = window.open('', '_blank', 'width=600,height=800');
    printWin.document.write(`
      <html><head><title>Bus Ticket</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1e293b; }
        .ticket { border: 2px dashed #86efac; border-radius: 12px; padding: 20px; margin-bottom: 16px; background: #f0fdf4; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h2 { color: #16a34a; margin: 0; }
        .header p { color: #64748b; margin: 4px 0 0; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .label { color: #64748b; }
        .value { font-weight: 700; }
        .ref { font-size: 18px; font-weight: 800; color: #2563eb; letter-spacing: 1px; }
        .seat-badge { background: #2563eb; color: #fff; padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; }
        .total { background: #eff6ff; padding: 12px 18px; border-radius: 10px; display: flex; justify-content: space-between; font-weight: 700; margin-top: 20px; }
        .total .amt { color: #2563eb; font-size: 18px; }
        .company { text-align: center; font-size: 20px; font-weight: 800; margin-bottom: 8px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="company">🚌 Where is my Bus</div>
      <div class="header"><h2>Booking Confirmed ✅</h2><p>${fmtDate(searchInfo?.date)} · ${trip.routeName}</p></div>
      ${passengers.map((p, i) => `
        <div class="ticket">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div><div style="font-size:11px;color:#64748b">BOOKING REF</div><div class="ref">${bookingData.bookingRefs?.[i] || '—'}</div></div>
            <span class="seat-badge">Seat ${p.seatNo}</span>
          </div>
          <div class="row"><span class="label">Passenger</span><span class="value">${p.name}</span></div>
          ${p.age ? `<div class="row"><span class="label">Age</span><span class="value">${p.age}</span></div>` : ''}
          <div class="row"><span class="label">Bus</span><span class="value">${trip.busName || trip.busCode} ${trip.busPlate ? '(' + trip.busPlate + ')' : ''}</span></div>
          <div class="row"><span class="label">Route</span><span class="value">${trip.fromStopName} → ${trip.toStopName}</span></div>
          <div class="row"><span class="label">Departure</span><span class="value">${fmt(trip.fromTime)}</span></div>
          <div class="row"><span class="label">Amount</span><span class="value" style="color:#16a34a">₹${(Array.isArray(seats) && seats[i] && typeof seats[i] === 'object') ? seats[i].price.toFixed(0) : Number(trip.price).toFixed(0)}</span></div>
        </div>
      `).join('')}
      <div class="total"><span>Total Paid</span><span class="amt">₹${totalAmount.toFixed(0)}</span></div>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>
    `);
    printWin.document.close();
  };

  const handleShareWhatsapp = () => {
    const phoneNumber = passengers[0]?.phone || '';
    if (!phoneNumber) {
      alert("No phone number found to share via WhatsApp.");
      return;
    }
    let formattedPhone = phoneNumber.replace(/\\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    let message = `🚌 *Where is my Bus - Ticket Confirmed* ✅\n\n`;
    message += `*Route:* ${trip.fromStopName} \u2794 ${trip.toStopName}\n`;
    message += `*Bus:* ${trip.busName || trip.busCode} ${trip.busPlate ? '(' + trip.busPlate + ')' : ''}\n`;
    message += `*Date:* ${fmtDate(searchInfo?.date)}\n`;
    message += `*Time:* ${fmt(trip.fromTime)}\n\n`;

    passengers.forEach((p, i) => {
      message += `🎟️ *Seat ${p.seatNo}*\n`;
      message += `*Name:* ${p.name}\n`;
      message += `*Ref:* ${bookingData.bookingRefs?.[i] || '—'}\n\n`;
    });

    message += `*Total Paid:* ₹${totalAmount.toFixed(0)}\n\n`;
    message += `Thank you for booking with us!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div ref={printRef} style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginBottom: 4 }}>Booking Confirmed!</div>
        <div style={{ color: '#64748b', marginBottom: 20 }}>
          {seats.length} seat{seats.length > 1 ? 's' : ''} booked successfully
        </div>

        {/* Per-seat tickets */}
        {passengers.map((p, i) => (
          <div key={i} style={{ background: '#f0fdf4', border: '2px dashed #86efac', borderRadius: 12, padding: 18, textAlign: 'left', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>BOOKING REF</div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1, color: '#2563eb' }}>
                  {bookingData.bookingRefs?.[i] || '—'}
                </div>
              </div>
              <div style={{ background: (Array.isArray(seats) && seats[i] && typeof seats[i] === 'object' && seats[i].type === 'sleeper') ? '#7c3aed' : '#2563eb', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
                {(Array.isArray(seats) && seats[i] && typeof seats[i] === 'object' && seats[i].type === 'sleeper') ? '🛏️ Sleeper' : '💺 Seat'} {p.seatNo}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Passenger</span><strong>{p.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bus</span><strong>{trip.busName || trip.busCode} {trip.busPlate ? `(${trip.busPlate})` : ''}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Route</span>
                <strong>{trip.fromStopName} → {trip.toStopName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Date</span>
                <strong>{fmtDate(searchInfo?.date)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Departure</span><strong>{fmt(trip.fromTime)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount</span>
                <strong style={{ color: '#16a34a' }}>₹{(Array.isArray(seats) && seats[i] && typeof seats[i] === 'object') ? seats[i].price.toFixed(0) : Number(trip.price).toFixed(0)}</strong>
              </div>
            </div>
          </div>
        ))}

        <div style={{
          background: '#eff6ff', borderRadius: 10, padding: '12px 18px',
          display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontWeight: 700
        }}>
          <span>Total Paid</span>
          <span style={{ color: '#2563eb', fontSize: 18 }}>₹{totalAmount.toFixed(0)}</span>
        </div>

        {/* Action Buttons */}
        <div className="mobile-col" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button onClick={handlePrint} style={{
            flex: 1, padding: 14, background: '#f8fafc', color: '#475569',
            border: '1.5px solid #e2e8f0', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            🖨️ Print Ticket
          </button>

          <button onClick={handleShareWhatsapp} style={{
            flex: 1, padding: 14, background: '#16a34a', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
          }}>
            💬 WhatsApp
          </button>
        </div>

        <div className="mobile-col" style={{ display: 'flex', gap: 10 }}>
          {onBookMore && (
            <button onClick={onBookMore} style={{
              flex: 1, padding: 14, background: '#f0fdf4', color: '#16a34a',
              border: '2px solid #86efac', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>+ Book More Seats<br /><span style={{ fontSize: 11, fontWeight: 400 }}>Same bus/trip</span></button>
          )}
          <button onClick={onDone} style={{
            flex: 1, padding: 14, background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 15,
          }}>Book Another Ticket</button>
        </div>
      </div>
    </div>
  );
}