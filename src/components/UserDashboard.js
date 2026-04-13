import React, { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function UserDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reference for the hidden ticket template to capture as PDF
  const ticketRef = useRef(null);
  const [downloadingRef, setDownloadingRef] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = localStorage.getItem('bus_token');
    if (!token) { setError("No user logged in."); setLoading(false); return; }
    try {
      const res = await fetch('/api/booking/user/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch bookings. Session may be expired.");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (bk) => {
    setDownloadingRef(bk);
    // Simple slight delay to allow React to render the hidden ticket via downloadingRef
    setTimeout(async () => {
      if (!ticketRef.current) return;
      try {
        const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [160, 80] });
        pdf.addImage(imgData, 'PNG', 0, 0, 160, 80);
        pdf.save(`Ticket_${bk.booking_ref}.pdf`);
      } catch (err) {
        console.error("PDF gen failed:", err);
        alert("Failed to generate PDF. Please try checking your popup blockers.");
      }
      setDownloadingRef(null);
    }, 100);
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading your bookings...</div>;
  if (error) return <div style={{ padding: 60, textAlign: 'center', color: '#ef4444' }}>⚠ {error}</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>
        🧾 My Bookings
      </div>
      
      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎒</div>
          <div>You haven't booked any bus tickets yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map((bk, i) => {
            const dt = new Date(bk.dep_time);
            const dateStr = isNaN(dt) ? bk.travel_date : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = isNaN(dt) ? "—" : dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return (
              <div key={i} style={{ display: 'flex', background: '#fff', borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ width: 140, background: '#2563eb', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>{dateStr}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{timeStr}</div>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 10, fontSize: 12, marginTop: 12, fontWeight: 600 }}>{bk.bus_code}</div>
                </div>
                <div style={{ flex: 1, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>REF: {bk.booking_ref}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                      {bk.from_stop_name} → {bk.to_stop_name}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 14, color: '#475569', display: 'flex', gap: 16 }}>
                      <span>👤 {bk.passenger_name} ({bk.passenger_age || '-'})</span>
                      <span>💺 Seat: <strong>{bk.seat_no}</strong></span>
                      <span style={{ color: bk.status === 'confirmed' ? '#16a34a' : '#ef4444', fontWeight: 600 }}>• {bk.status.toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <button onClick={() => handleDownloadTicket(bk)} style={{ padding: '10px 16px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>
                      ⬇ Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden print template for PDF generation */}
      {downloadingRef && (
        <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          <div ref={ticketRef} style={{ width: '160mm', height: '80mm', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', fontFamily: 'sans-serif' }}>
             <div style={{ background: '#e65100', width: '50mm', color: '#fff', padding: '10mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <h1 style={{ margin: 0, fontSize: '18pt' }}>Where is my Bus</h1>
               <div style={{ marginTop: '10mm', fontSize: '10pt', opacity: 0.9 }}>TICKET NO</div>
               <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{downloadingRef.booking_ref}</div>
               <div style={{ marginTop: '5mm', fontSize: '10pt', opacity: 0.9 }}>BUS / PLATE</div>
               <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{downloadingRef.bus_code}</div>
               {downloadingRef.bus_plate && <div style={{ fontSize: '10pt' }}>{downloadingRef.bus_plate}</div>}
             </div>
             <div style={{ flex: 1, padding: '10mm 15mm', boxSizing: 'border-box' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6mm' }}>
                 <div>
                    <div style={{ fontSize: '10pt', color: '#64748b' }}>PASSENGER</div>
                    <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1e293b' }}>{downloadingRef.passenger_name}</div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10pt', color: '#64748b' }}>SEAT</div>
                    <div style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e293b' }}>{downloadingRef.seat_no}</div>
                 </div>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6mm', background: '#f8fafc', padding: '4mm 6mm', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: '10pt', color: '#64748b' }}>DATE OF JOURNEY</div>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#1e293b' }}>
                      {isNaN(new Date(downloadingRef.dep_time)) 
                         ? downloadingRef.travel_date 
                         : new Date(downloadingRef.dep_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10pt', color: '#64748b' }}>DEPARTURE TIME</div>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#1e293b' }}>
                      {isNaN(new Date(downloadingRef.dep_time)) 
                         ? "—" 
                         : new Date(downloadingRef.dep_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '10pt', color: '#64748b' }}>FROM</div>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#1e293b' }}>{downloadingRef.from_stop_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10pt', color: '#64748b' }}>TO</div>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#1e293b' }}>{downloadingRef.to_stop_name}</div>
                  </div>
               </div>
               <div style={{ marginTop: '5mm', fontSize: '10pt', color: '#16a34a', fontWeight: 'bold' }}>
                  PAID: ₹{Number(downloadingRef.amount).toFixed(2)} ✔
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
