import { useState } from 'react';
import { getApiUrl } from '../apiConfig';
import BusList from './BusList';
import SearchSection from './SearchSection';
import SeatLayout from './SeatLayout';
import PaymentPage from './PaymentPage';
import BookingConfirmed from './BookingConfirmed';


// ── Main BookingPage ─────────────────────────────────────────────
export default function BookingPage({ user, onRequestLogin }) {
  const [stage, setStage] = useState('search');  // search | results | seats | payment | confirmed
  const [results, setResults] = useState([]);
  const [searchInfo, setSearchInfo] = useState({});
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [confirmedData, setConfirmedData] = useState(null);
  const [confirmedSeats, setConfirmedSeats] = useState([]);
  const [confirmedPassengers, setConfirmedPassengers] = useState([]);
  const [paymentSeats, setPaymentSeats] = useState([]);
  const [paymentPassengers, setPaymentPassengers] = useState([]);
  const [bookingError, setBookingError] = useState('');

  if (!user && (stage === 'search' || stage === 'results' || stage === 'seats')) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>🔐</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>Authentication Required</div>
        <div style={{ color: '#64748b', marginBottom: 24 }}>You must be logged in to search and book tickets.</div>
        <button onClick={onRequestLogin} style={{ padding: '14px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.2)' }}>
          Login / Register
        </button>
      </div>
    );
  }

  const handleResults = (data, info) => {
    setResults(data); setSearchInfo(info); setStage('results');
  };

  const handleSelect = (trip) => {
    setSelectedTrip(trip); setStage('seats');
  };

  // Called from SeatLayout after passenger validation
  const handleGoToPayment = (seats, passengers) => {
    setPaymentSeats(seats);
    setPaymentPassengers(passengers);
    setStage('payment');
  };

  // Called after payment succeeds \u2014 now actually book via API
  const handlePaymentSuccess = async () => {
    setBookingError('');
    const refs = [];
    try {
      for (const p of paymentPassengers) {
        const res = await fetch(getApiUrl('/api/booking/book'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: selectedTrip.tripId,
            seatNo: p.seatNo,
            passengerName: p.name,
            passengerAge: p.age || null,
            passengerGender: p.gender,
            passengerPhone: p.phone,
            passengerEmail: p.email,
            fromStop: searchInfo.from,
            toStop: searchInfo.to,
            amount: (paymentSeats.find(s => typeof s === 'object' && s.seatNo === p.seatNo) || {}).price || selectedTrip.price,
            travelDate: searchInfo.date || '',
            userId: user ? user.id : null
          }),
        });
        const data = await res.json();
        if (data.error) {
          setBookingError(`Seat ${p.seatNo}: ${data.error}`);
          setStage('seats');
          return;
        }
        refs.push(data.bookingRef);
      }
      setConfirmedData({ bookingRefs: refs, count: paymentPassengers.length, trip: selectedTrip });
      setConfirmedSeats(paymentSeats);
      setConfirmedPassengers(paymentPassengers);
      setStage('confirmed');
    } catch {
      setBookingError('Booking failed after payment. Contact support.');
      setStage('seats');
    }
  };

  const handleBooked = (data, trip, seats, passengers) => {
    setConfirmedData({ ...data, trip });
    setConfirmedSeats(seats);
    setConfirmedPassengers(passengers);
    setStage('confirmed');
  };

  const handleBookMore = () => {
    setStage('seats');
    setConfirmedData(null); setConfirmedSeats([]); setConfirmedPassengers([]);
  };

  const reset = () => {
    setStage('search'); setResults([]); setSelectedTrip(null);
    setConfirmedData(null); setConfirmedSeats([]); setConfirmedPassengers([]);
    setPaymentSeats([]); setPaymentPassengers([]); setBookingError('');
  };

  return (
    <div style={{ padding: '32px 16px', minHeight: '80vh', background: '#f8fafc' }}>

      {/* Back navigation */}
      {stage !== 'search' && stage !== 'confirmed' && stage !== 'payment' && (
        <button onClick={() => setStage(stage === 'seats' ? 'results' : 'search')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb',
            fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'block'
          }}>
          {'\u2190'} Back
        </button>
      )}

      {/* Booking error from payment */}
      {bookingError && (
        <div style={{
          maxWidth: 600, margin: '0 auto 16px', padding: '12px 18px',
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          color: '#ef4444', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
        }}>
          {'\u26a0'} {bookingError}
          <button onClick={() => setBookingError('')}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: '#ef4444', cursor: 'pointer', fontSize: 16
            }}>{'\u2715'}</button>
        </div>
      )}

      {stage === 'search' && <SearchSection onResults={handleResults} />}
      {stage === 'results' && <BusList results={results} searchInfo={searchInfo} onSelect={handleSelect} />}
      {stage === 'seats' && (
        <SeatLayout
          trip={selectedTrip}
          searchInfo={searchInfo}
          user={user}
          onSeatBooked={handleBooked}
          onGoToPayment={handleGoToPayment}
        />
      )}
      {stage === 'payment' && (
        <PaymentPage
          trip={selectedTrip}
          searchInfo={searchInfo}
          seats={paymentSeats}
          passengers={paymentPassengers}
          onPaymentSuccess={handlePaymentSuccess}
          onBack={() => setStage('seats')}
        />
      )}
      {stage === 'confirmed' && (
        <BookingConfirmed
          bookingData={confirmedData}
          trip={selectedTrip}
          seats={confirmedSeats}
          passengers={confirmedPassengers}
          onDone={reset}
          onBookMore={handleBookMore}
          searchInfo={searchInfo}
        />
      )}
    </div>
  );
}