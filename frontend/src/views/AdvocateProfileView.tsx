import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Star, ShieldCheck, MapPin, Globe, Phone, FileText, Calendar, CheckCircle2 } from 'lucide-react';

interface AdvocateProfileViewProps {
  setView: (view: string) => void;
  advocateId: number;
}

export const AdvocateProfileView: React.FC<AdvocateProfileViewProps> = ({ setView, advocateId }) => {
  const { t, language } = useLanguage();
  const { fetchAdvocateDetails, bookConsultation, fetchAdvocateSlots } = useData();

  const [advocate, setAdvocate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState<number | undefined>(undefined);
  const [consultNotes, setConsultNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Loaded from backend; fallback to hardcoded demo slots
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  // Hardcoded demo slots shown when backend has none
  const demoSlots = [
    { id: undefined, label: "Tomorrow, 10:30 AM", value: "Tomorrow, 10:30 AM" },
    { id: undefined, label: "Tomorrow, 02:00 PM", value: "Tomorrow, 02:00 PM" },
    { id: undefined, label: "Monday, 09:30 AM", value: "Monday, 09:30 AM" },
    { id: undefined, label: "Monday, 11:30 AM", value: "Monday, 11:30 AM" },
    { id: undefined, label: "Tuesday, 04:00 PM", value: "Tuesday, 04:00 PM" },
  ];

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      try {
        const details = await fetchAdvocateDetails(advocateId);
        setAdvocate(details);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    async function loadSlots() {
      setSlotsLoading(true);
      try {
        const slots = await fetchAdvocateSlots(advocateId);
        setAvailableSlots(slots);
      } catch (e) {
        console.warn('Could not fetch advocate slots', e);
      } finally {
        setSlotsLoading(false);
      }
    }
    loadDetails();
    loadSlots();
  }, [advocateId]);

  const slotsToShow = availableSlots.length > 0 ? availableSlots : demoSlots;

  const handleBooking = async () => {
    if (!selectedSlot) return;

    setBookingLoading(true);
    try {
      await bookConsultation(advocateId, selectedSlot, consultNotes, selectedSlotId);
      setBookingSuccess(true);
    } catch (e) {
      alert('Failed to book consultation');
    } finally {
      setBookingLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="main-content">

        <div className="skeleton skeleton-rect" style={{ height: '350px' }} />
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="welcome-card glass-card-no-hover" style={{ maxWidth: '480px', padding: '3rem' }}>
          <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <CheckCircle2 size={64} className="voice-recording-pulse" />
          </div>
          <h2 style={{ marginBottom: '0.75rem' }}>Consultation Request Sent!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Your request has been sent to <strong>{advocate.name}</strong>.
          </p>
          <p style={{ color: '#92400e', fontSize: '0.85rem', background: '#fef3c7', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            ⏳ <strong>Pending advocate approval.</strong> You will be notified as soon as the advocate accepts or proposes a new slot.
          </p>
          <button className="btn-primary" onClick={() => setView('client_dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="main-content">


      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Left Column: Details & Reviews */}
        <div>
          <div className="glass-card-no-hover" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', boxShadow: 'var(--shadow-sm)' }}>
              <img src={advocate.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} alt={advocate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {advocate.is_verified ? (
                  <span className="badge-verified"><ShieldCheck size={14} /> Verified Advocate</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#fffbeb', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>Pending Verification</span>
                )}
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>BAR Registration: {advocate.bar_registration}</span>
              </div>
              
              <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>{advocate.name}</h2>
              <span style={{ fontSize: '1rem', color: '#4f46e5', fontWeight: '600', display: 'block', marginBottom: '1rem' }}>
                {advocate.specialization_name}
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Experience</span>
                  <strong style={{ fontSize: '0.95rem' }}>{advocate.experience_years} Years</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Rating</span>
                  <strong style={{ fontSize: '0.95rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                    ★ {advocate.rating}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Consultation Fee</span>
                  <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>₹{parseInt(advocate.consultation_fee)} / call</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="glass-card-no-hover" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>{t.biography}</h3>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>{advocate.biography}</p>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.85rem', color: '#475569' }}>
              <span>📍 <strong>Location:</strong> {advocate.location}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>🗣️ <strong>Languages:</strong>
                {(() => {
                  let langs: string[] = [];
                  try { langs = typeof advocate.languages === 'string' ? JSON.parse(advocate.languages) : (advocate.languages || []); } catch { langs = [advocate.languages]; }
                  return langs.map((l: string) => <span key={l} className="lang-chip">{l}</span>);
                })()}
              </span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="glass-card-no-hover" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>{t.reviews} ({advocate.reviews?.length || 0})</h3>
            
            {advocate.reviews?.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No reviews recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {advocate.reviews?.map((rev: any) => (
                  <div key={rev.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{rev.client_name}</strong>
                      <span style={{ color: '#d97706', fontSize: '0.85rem' }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking panel */}
        <div>
          <div className="glass-card-no-hover" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} style={{ color: '#4f46e5' }} /> Schedule Consultation
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Select an available slot. Your request will be sent to the advocate for confirmation.
            </p>

            {slotsLoading ? (
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading available slots…</p>
            ) : slotsToShow.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                No slots available. Contact the advocate directly.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                {slotsToShow.map((slot: any, idx: number) => {
                  const isRealSlot = slot.slot_date !== undefined;
                  const slotLabel = isRealSlot
                    ? `${new Date(slot.slot_date).toLocaleDateString()} — ${slot.start_time?.substring(0,5)} to ${slot.end_time?.substring(0,5)} (${slot.consultation_type || 'Video'}, ${slot.duration_minutes || 30}min)`
                    : (slot.label || slot);
                  const slotValue = isRealSlot
                    ? `${slot.slot_date} ${slot.start_time}`
                    : (slot.value || slot);
                  const isSelected = selectedSlot === slotValue;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSlot(slotValue);
                        setSelectedSlotId(isRealSlot ? slot.id : undefined);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: isSelected ? 'var(--primary-indigo)' : '#e2e8f0',
                        background: isSelected ? '#f5f3ff' : 'white',
                        color: isSelected ? 'var(--primary-indigo)' : '#1e293b',
                        fontWeight: isSelected ? '700' : '600',
                        fontSize: '0.82rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {slotLabel}
                    </button>
                  );
                })}
              </div>
            )}


            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                Note for Advocate (Optional)
              </label>
              <textarea
                value={consultNotes}
                onChange={(e) => setConsultNotes(e.target.value)}
                placeholder="Briefly explain your dispute..."
                className="chat-input"
                style={{ width: '100%', height: '80px', resize: 'none', fontSize: '0.8rem' }}
              />
            </div>

            <button
              onClick={handleBooking}
              disabled={!selectedSlot || bookingLoading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {bookingLoading ? 'Scheduling...' : t.bookConsultation}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
