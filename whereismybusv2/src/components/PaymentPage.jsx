import { useState } from "react";
import { duration, fmt, fmtDate } from "../utils/bookingUtils";
import { getApiUrl } from "../apiConfig";


// ── Step 3.5: Payment Gateway (Razorpay) ─────────────────────────
export default function PaymentPage({ trip, searchInfo, seats, passengers, onPaymentSuccess, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStage, setPaymentStage] = useState('summary'); // 'summary' | 'processing' | 'success' | 'failed'
  const [paymentId, setPaymentId] = useState('');

  // Calculate from individual seat prices if available (seat vs sleeper may differ)
  const baseAmount = Array.isArray(seats) && seats.length > 0 && typeof seats[0] === 'object'
    ? seats.reduce((sum, s) => sum + (s.price || Number(trip.price)), 0)
    : seats.length * Number(trip.price);
  const gstRate = 0.05;
  const gstAmount = Math.round(baseAmount * gstRate * 100) / 100;
  const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;

  const initiatePayment = async () => {
    setLoading(true);
    setError('');
    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await fetch(getApiUrl('/api/payment/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          seats: seats.length,
          receipt: `bus_${trip.tripId}_${Date.now()}`,
        }),
      });
      const orderData = await orderRes.json();
      if (orderData.error) {
        setError(orderData.error);
        setLoading(false);
        return;
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // Razorpay amount is in Paise
        currency: orderData.currency,
        name: 'Where is my Bus',
        description: `${seats.length} Seat${seats.length > 1 ? 's' : ''} — ${searchInfo.from} \u2192 ${searchInfo.to}`,
        order_id: orderData.orderId,
        prefill: {
          name: passengers[0]?.name || '',
          contact: passengers[0]?.phone || '',
          email: passengers[0]?.email || '',
        },
        notes: {
          tripId: trip.tripId,
          seats: (Array.isArray(seats) && seats.length > 0 && typeof seats[0] === 'object') ? seats.map(s => s.seatNo).join(',') : seats.join(','),
          route: `${searchInfo.from} \u2192 ${searchInfo.to}`,
          date: searchInfo.date,
        },
        theme: {
          color: '#e65100',
        },
        send_sms_hash: true,
        // IMPORTANT: Use arrow function for better 'this' binding in Android
        handler: async (response) => {
          // Step 3: Verify payment on backend
          setPaymentStage('processing');
          try {
            const verifyRes = await fetch(getApiUrl('/api/payment/verify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              setPaymentId(response.razorpay_payment_id);
              setPaymentStage('success');
              // Auto-trigger booking after short delay
              setTimeout(() => onPaymentSuccess(), 2000);
            } else {
              setPaymentStage('failed');
              setError('Payment verification failed. Please contact support.');
            }
          } catch {
            setPaymentStage('failed');
            setError('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentStage('summary');
          },
          // Force it to open in a more compatible way for WebView
          backdropclose: false,
          escape: false,
          handleback: true
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        // Razorpay internal config for mobile performance
        config: {
          display: {
            blocks: {
              utib: {
                name: 'Pay using UPI',
                instruments: [{ method: 'upi' }]
              }
            },
            sequence: ['block.utib', 'card', 'netbanking'],
            preferences: { show_default_blocks: true }
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setPaymentStage('failed');
        setError(response.error?.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      console.error('Payment Error:', err);
      setError('An error occurred while initiating payment.');
      setLoading(false);
    }
  };

  // PROCESSING SCREEN
  if (paymentStage === 'processing') {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '60px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto 24px', position: 'relative' }}>
            <div style={{
              width: 80, height: 80, border: '4px solid #e2e8f0', borderTopColor: '#e65100',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 28 }}>{'\ud83d\udcb3'}</div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Verifying Payment...</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Please wait while we confirm your payment</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#e65100', marginTop: 16 }}>{'\u20b9'}{totalAmount.toFixed(2)}</div>
        </div>
      </div>
    );
  }

  // SUCCESS SCREEN
  if (paymentStage === 'success') {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '60px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 64, marginBottom: 16, animation: 'pop 0.4s ease' }}>{'\u2705'}</div>
          <style>{`@keyframes pop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }`}</style>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>Payment Successful!</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>{'\u20b9'}{totalAmount.toFixed(2)} paid successfully</div>
          {paymentId && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Payment ID: {paymentId}</div>}
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Confirming your booking...</div>
        </div>
      </div>
    );
  }

  // FAILED SCREEN
  if (paymentStage === 'failed') {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '60px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{'\u274c'}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444', marginBottom: 8 }}>Payment Failed</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>{error || 'Something went wrong'}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={onBack}
              style={{
                padding: '12px 24px', background: '#f1f5f9', border: 'none', borderRadius: 10,
                fontWeight: 600, cursor: 'pointer', fontSize: 14, color: '#475569'
              }}>
              {'\u2190'} Back
            </button>
            <button onClick={() => { setPaymentStage('summary'); setError(''); }}
              style={{
                padding: '12px 24px', background: '#e65100', color: '#fff', border: 'none',
                borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14
              }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT SUMMARY (main view)
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{
        background: '#e65100', color: '#fff', borderRadius: '16px 16px 0 0',
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{'\ud83d\udcb3'} Payment {'\u2014'} {'\u20b9'}{totalAmount.toFixed(2)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.9 }}>
          <span>{'\ud83d\udd12'} Secured by Razorpay</span>
        </div>
      </div>

      {/* Trust badges */}
      <div style={{
        background: '#fff', padding: '12px 24px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', gap: 24, alignItems: 'center', fontSize: 12, color: '#64748b',
      }}>
        <span>{'\ud83d\udd12'} Secure Payment</span>
        <span>{'\u26a1'} Instant Confirmation</span>
        <span>{'\ud83d\udee1\ufe0f'} 100% Safe</span>
        <span>{'\ud83d\udcb0'} Easy Refunds</span>
      </div>

      <div className="mobile-grid-col" style={{
        display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 0, background: '#f8fafc',
        borderRadius: '0 0 16px 16px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
      }}>

        {/* LEFT: Payment Info */}
        <div style={{ padding: '28px', background: '#fff' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
              Available Payment Methods
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: '\ud83d\udcf1', name: 'UPI', desc: 'GPay, PhonePe, Paytm' },
                { icon: '\ud83d\udcb3', name: 'Cards', desc: 'Visa, MasterCard, RuPay' },
                { icon: '\ud83c\udfdb\ufe0f', name: 'Net Banking', desc: 'All major banks' },
                { icon: '\ud83d\udc5b', name: 'Wallets', desc: 'All major wallets' },
              ].map(m => (
                <div key={m.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  border: '1.5px solid #f1f5f9', borderRadius: 12, background: '#fafafa',
                }}>
                  <span style={{ fontSize: 24 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div style={{
            background: '#f8fafc', borderRadius: 12, padding: 18, marginBottom: 24,
            border: '1px solid #f1f5f9',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#475569', marginBottom: 12 }}>
              How it works
            </div>
            {[
              { step: '1', text: 'Click "Pay Now" button below' },
              { step: '2', text: 'Razorpay popup will open with all payment options' },
              { step: '3', text: 'Choose UPI, Card, Netbanking, or Wallet' },
              { step: '4', text: 'Complete payment \u2014 ticket confirmed instantly!' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: '#e65100',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>{s.step}</div>
                <span style={{ fontSize: 13, color: '#475569' }}>{s.text}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, color: '#ef4444', fontSize: 13, marginBottom: 16,
            }}>
              {'\u26a0'} {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onBack}
              style={{
                padding: '14px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10,
                fontWeight: 600, cursor: 'pointer', fontSize: 14, color: '#475569'
              }}>
              {'\u2190'} Back
            </button>
            <button onClick={initiatePayment} disabled={loading}
              style={{
                flex: 1, padding: '16px', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #e65100, #ff8f00)',
                color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer', fontSize: 17, letterSpacing: 0.3,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(230,81,0,0.3)',
                transition: 'transform 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(230,81,0,0.4)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(230,81,0,0.3)'; }}>
              {loading ? 'Please wait...' : `Pay ${String.fromCharCode(0x20b9)}${totalAmount.toFixed(2)}`}
            </button>
          </div>

          {/* Powered by Razorpay badge */}
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#94a3b8' }}>
            Powered by <strong style={{ color: '#2563eb' }}>Razorpay</strong> {'\u00b7'} PCI DSS Compliant {'\u00b7'} 256-bit Encrypted
          </div>
        </div>

        {/* RIGHT: Fare Breakup + Trip Summary */}
        <div style={{ background: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Fare Breakup */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>Fare Breakup</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{seats.length} Seat{seats.length > 1 ? 's' : ''}</div>

            {/* Per-type breakdown */}
            {(() => {
              const seatItems = Array.isArray(seats) && seats.length > 0 && typeof seats[0] === 'object' ? seats : [];
              const seatTypeSeats = seatItems.filter(s => s.type === 'seat');
              const sleeperSeats = seatItems.filter(s => s.type === 'sleeper');
              return seatItems.length > 0 ? (
                <div style={{ marginBottom: 8 }}>
                  {seatTypeSeats.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#475569' }}>{'\ud83d\udcba'} Seat \u00d7 {seatTypeSeats.length}</span>
                      <span style={{ fontWeight: 600 }}>{'\u20b9'}{(seatTypeSeats.reduce((s, x) => s + x.price, 0)).toFixed(0)}</span>
                    </div>
                  )}
                  {sleeperSeats.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#7c3aed' }}>{'\ud83d\udecf\ufe0f'} Sleeper \u00d7 {sleeperSeats.length}</span>
                      <span style={{ fontWeight: 600, color: '#7c3aed' }}>{'\u20b9'}{(sleeperSeats.reduce((s, x) => s + x.price, 0)).toFixed(0)}</span>
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: '#475569' }}>Base Fare</span>
              <span style={{ fontWeight: 600 }}>{'\u20b9'}{baseAmount.toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12 }}>
              <span style={{ color: '#475569' }}>GST (5%)</span>
              <span style={{ fontWeight: 600 }}>{'\u20b9'}{gstAmount.toFixed(2)}</span>
            </div>
            <div style={{
              borderTop: '2px solid #f1f5f9', paddingTop: 12, display: 'flex',
              justifyContent: 'space-between', fontSize: 18, fontWeight: 800
            }}>
              <span>Total</span>
              <span style={{ color: '#e65100' }}>{'\u20b9'}{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Trip Summary */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>{trip.busCode}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
              {seats.length} Seat{seats.length > 1 ? 's' : ''} {'\u00b7'} {trip.routeName}
            </div>

            {/* Route timeline */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1e293b', marginTop: 2 }} />
                <div style={{ flex: 1, width: 2, background: '#e2e8f0', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    fontSize: 10, color: '#94a3b8', background: '#fff', padding: '2px 0', whiteSpace: 'nowrap',
                    writingMode: 'vertical-lr', letterSpacing: 1
                  }}>
                    {duration(trip.fromTime, trip.toTime)}
                  </div>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1e293b' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(trip.fromTime)}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(searchInfo.date)}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{searchInfo.from}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{fmt(trip.toTime)}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(searchInfo.date)}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{searchInfo.to}</div>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Passengers</div>
              {passengers.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.gender} {p.age ? `${p.age} years` : ''}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>Seat {p.seatNo}</div>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Your ticket will be sent to</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{passengers[0]?.phone || '\u2014'}</div>
              {passengers[0]?.email && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{passengers[0].email}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}