import React from 'react';

export default function SupportPage() {
  const cardStyle = {
    background: '#fff',
    borderRadius: 20,
    padding: '24px',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
    textDecoration: 'none',
    color: 'inherit'
  };

  const faqStyle = {
    background: '#f8fafc',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 16
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 60 }}>
      {/* Blue Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
        borderRadius: '0 0 40px 40px',
        padding: '60px 24px',
        textAlign: 'center',
        color: '#fff',
        marginBottom: 32,
        boxShadow: '0 10px 30px rgba(37,99,235,0.2)'
      }}>
        <div style={{ 
          background: '#ef4444', 
          width: 60, 
          height: 60, 
          borderRadius: 12, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 20px',
          fontSize: 24,
          fontWeight: 800,
          boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
        }}>SOS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>How can we help?</h1>
        <p style={{ fontSize: 16, opacity: 0.9 }}>Our support team is available 24/7</p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Contact Methods */}
        <a href="https://wa.me/919534038515" style={cardStyle}>
          <div style={{ background: '#22c55e', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            💬
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, letterSpacing: 0.5 }}>WHATSAPP SUPPORT</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>+91 9534038515</div>
          </div>
        </a>

        <a href="mailto:rahulsingh.11gts@gmail.com" style={cardStyle}>
          <div style={{ background: '#3b82f6', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            ✉️
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700, letterSpacing: 0.5 }}>EMAIL SUPPORT</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', wordBreak: 'break-all' }}>rahulsingh.11gts@gmail.com</div>
          </div>
        </a>

        {/* FAQ Section */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>Frequently Asked Questions</h2>
          
          <div style={faqStyle}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 8 }}>How do I track my bus?</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              You can track your bus in real-time from the "Home" page or your "My Bookings" section once the journey starts.
            </div>
          </div>

          <div style={faqStyle}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 8 }}>Can I change my seat?</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              Seats cannot be changed once the booking is confirmed. Please ensure you select your preferred seat during the booking process.
            </div>
          </div>
        </div>

        {/* Emergency Card */}
        <div style={{
          marginTop: 40,
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderRadius: 24,
          padding: '30px 20px',
          textAlign: 'center',
          border: '1.5px solid #bfdbfe'
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', letterSpacing: 0.5, marginBottom: 12 }}>FOR EMERGENCY DURING JOURNEY</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1e3a8a' }}>+91 9534038515</div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40, paddingBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>© 2026 Where Is My Bus. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
}
