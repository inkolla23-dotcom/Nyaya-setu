import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSpeech } from '../context/SpeechContext';
import { useData } from '../context/DataContext';
import { Search, Mic, Upload, UserPlus, MessageSquare, FileText, Calendar, Clock, AlertTriangle, ShieldCheck, Flame, Scale, Globe, ArrowRight, ChevronRight, X } from 'lucide-react';

const DEV_MEETING_MODE = true;

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTimeDisplay = (timeStr: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${min} ${ampm}`;
};

interface ClientDashboardProps {
  setView: (view: string) => void;
  setSelectedCaseId: (id: number) => void;
  setInitialSearchQuery: (query: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ setView, setSelectedCaseId, setInitialSearchQuery }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { triggerVoiceInput } = useSpeech();
  const { fetchCases, fetchSpecializations, advocates, cases, appointments, fetchAppointments, respondReschedule, fetchAdvocateSlots } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [clientCases, setClientCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Client reschedule slot request states
  const [reschedulingAppt, setReschedulingAppt] = useState<any>(null);
  const [advSlots, setAdvSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        await fetchSpecializations();
        const caseList = await fetchCases();
        setClientCases(caseList);
        await fetchAppointments();
      } catch (err) {
        console.error('Error loading client dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (reschedulingAppt) {
      setLoadingSlots(true);
      fetchAdvocateSlots(reschedulingAppt.advocate_id)
        .then((slots) => {
          setAdvSlots(slots.filter((s: any) => s.is_active));
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingSlots(false));
    } else {
      setAdvSlots([]);
      setSelectedSlotId(null);
    }
  }, [reschedulingAppt]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setInitialSearchQuery(searchQuery);
    setView('ai_copilot');
  };

  const handleVoiceTrigger = () => {
    triggerVoiceInput((spokenText) => {
      setSearchQuery(spokenText);
      setInitialSearchQuery(spokenText);
      setView('ai_copilot');
    });
  };

  const navigateToCase = (caseId: number) => {
    setSelectedCaseId(caseId);
    setView('case_details');
  };

  const handleTopicClick = (query: string) => {
    setInitialSearchQuery(query);
    setView('ai_copilot');
  };

  // Filter nearby advocates based on citizen's city, fallback to top-rated
  const userCity = user?.city || '';
  const nearbyAdvocates = advocates.filter(a => {
    if (!userCity) return true;
    return a.location.toLowerCase().includes(userCity.toLowerCase()) || 
           (a.city && a.city.toLowerCase().includes(userCity.toLowerCase()));
  }).slice(0, 3);

  const fallbackAdvocates = nearbyAdvocates.length > 0 ? nearbyAdvocates : advocates.slice(0, 3);

  const popularTopics = [
    { title: language === 'te' ? 'విడాకుల ప్రక్రియ' : language === 'hi' ? 'तलाक प्रक्रिया' : 'Mutual Divorce Roadmap', query: 'Mutual consent divorce timeline and steps in India' },
    { title: language === 'te' ? 'భూమి సరిహద్దు ఆక్రమణ' : language === 'hi' ? 'जमीन कब्ज़ा' : 'Land Encroachment Remedy', query: 'My neighbor built a wall encroaching on my property boundary' },
    { title: language === 'te' ? 'జీతం బకాయిలు' : language === 'hi' ? 'बकाया वेतन' : 'Wage Non-Payment', query: 'Employer has not paid my salary for past 3 months' },
    { title: language === 'te' ? 'ముందస్తు బెయిల్' : language === 'hi' ? 'अग्रिम जमानत' : 'Anticipatory Bail', query: 'Process to apply for anticipatory bail for false police FIR' }
  ];

  return (
    <div className="main-content" style={{ background: '#fafbfc' }}>
      <style>{`
        @keyframes orb-float {
          0% { transform: translateY(0px) rotate(0deg); filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.35)); }
          50% { transform: translateY(-10px) rotate(180deg); filter: drop-shadow(0 0 25px rgba(139, 92, 246, 0.5)); }
          100% { transform: translateY(0px) rotate(360deg); filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.35)); }
        }
        .animated-orb {
          width: 90px;
          height: 90px;
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          background: linear-gradient(135deg, rgba(139,92,246,0.7) 0%, rgba(99,102,241,0.6) 100%);
          animation: orb-float 8s ease-in-out infinite;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: inset 0 0 12px rgba(255,255,255,0.4);
        }
      `}</style>

      {/* Hero Intro Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem 0' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {language === 'te' ? 'డిజిటల్ లీగల్ కంపానియన్' : language === 'hi' ? 'डिजिटल कानूनी साथी' : 'AI Legal Copilot Engine'}
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.75px', marginTop: '0.25rem' }}>
            {t.welcomeBack}, <span className="gradient-text">{user?.name}</span> 👋
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            {userCity ? `Citizen Account registered in ${userCity}, ${user?.state || ''}` : 'Your simplified legal gateway is active.'}
          </p>
        </div>
      </div>

      {/* Hero Glassmorphic Search Block */}
      <div className="glass-card-no-hover" style={{ 
        padding: '2.5rem', 
        marginBottom: '2.5rem', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.1)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        borderRadius: '24px'
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', color: '#1e293b' }}>
            {language === 'te' ? 'మీ సమస్యను సాధారణ భాషలో చెప్పండి లేదా మాట్లాడండి:' : 
             language === 'hi' ? 'अपनी समस्या सरल शब्दों में लिखें या बोलकर बताएं:' : 
             'Describe your dispute in plain words. Nyaya Copilot will analyze it instantly:'}
          </h3>
          
          <form onSubmit={handleSearchSubmit} className="ai-search-container" style={{ margin: 0, boxShadow: 'var(--shadow-sm)' }}>
            <input 
              type="text" 
              placeholder={t.askAiPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ai-search-box"
              style={{ fontSize: '1rem' }}
            />
            <div className="ai-search-actions">
              <button 
                type="button" 
                onClick={handleVoiceTrigger}
                className="voice-btn-pulse"
                title={t.voiceAction}
                style={{ background: '#f5f3ff', color: '#6366f1' }}
              >
                <Mic size={22} />
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', minHeight: '46px' }}
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          {/* Micro Tip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', background: 'rgba(16, 185, 129, 0.08)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', marginTop: '1rem' }}>
            <Globe size={14} />
            {t.illiterateFriendlyTip}
          </div>
        </div>

        {/* Animated AI Orb Graphic */}
        <div className="animated-orb">
          <Scale size={32} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN */}
        <div>
          {/* Quick Actions Grid */}
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '1rem' }}>
            💡 Quick Legal Utilities
          </h3>
          
          <div className="quick-actions-grid" style={{ marginBottom: '2.5rem' }}>
            <div onClick={() => setView('advocate_search')} className="glass-card action-card" style={{ cursor: 'pointer', padding: '1.25rem' }}>
              <div className="action-icon-wrapper bg-purple-grad" style={{ padding: '0.75rem', borderRadius: '12px' }}>
                <UserPlus size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#0f172a' }}>{t.findAdvocate}</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {language === 'te' ? 'లాయర్లతో బుక్ చేయండి' : language === 'hi' ? 'वकीलों से जुड़ें' : 'Match and book consultations'}
                </p>
              </div>
            </div>

            <div onClick={() => { setInitialSearchQuery(''); setView('ai_copilot'); }} className="glass-card action-card" style={{ cursor: 'pointer', padding: '1.25rem' }}>
              <div className="action-icon-wrapper bg-teal-grad" style={{ padding: '0.75rem', borderRadius: '12px' }}>
                <MessageSquare size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#0f172a' }}>{t.askAi}</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {language === 'te' ? 'ఉచిత సమాచారం' : language === 'hi' ? 'सहायता प्राप्त करें' : 'Get jargon-free answers'}
                </p>
              </div>
            </div>

            <div onClick={() => setView('document_checker')} className="glass-card action-card" style={{ cursor: 'pointer', padding: '1.25rem' }}>
              <div className="action-icon-wrapper bg-emerald-grad" style={{ padding: '0.75rem', borderRadius: '12px' }}>
                <FileText size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#0f172a' }}>{t.uploadAction}</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {language === 'te' ? 'పత్రాల సారాంశం' : language === 'hi' ? 'दस्तावेज़ ऑडिट करें' : 'Audit legalese certificates'}
                </p>
              </div>
            </div>
          </div>

          {/* Active Cases Section */}
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💼 {t.recentCases} ({clientCases.length})
          </h3>
          
          {loading ? (
            <div className="skeleton skeleton-rect" style={{ height: '140px' }} />
          ) : clientCases.length === 0 ? (
            <div className="glass-card-no-hover empty-state-wrapper" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <FileText size={40} className="empty-state-icon" style={{ color: '#94a3b8' }} />
              <h4 style={{ fontWeight: '700', marginTop: '1rem' }}>No Active Cases Found</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '380px', margin: '0.25rem auto 1.25rem auto' }}>
                Once you book a consultation and select an advocate, case briefs will update here dynamically.
              </p>
              <button className="btn-primary" onClick={() => setView('advocate_search')}>
                {t.findAdvocate}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {clientCases.map((c) => (
                <div 
                  key={c.id} 
                  className="glass-card" 
                  onClick={() => navigateToCase(c.id)}
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    borderLeft: '4px solid var(--primary-indigo)',
                    borderRadius: '16px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', background: '#eef2ff', color: '#4338ca', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                        {c.category_name}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', background: '#fffbeb', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                        Health Score: {c.health_score}%
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>{c.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Advocate: <strong>{c.advocate_name}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      background: c.status.toLowerCase().includes('adjourned') ? '#fee2e2' : '#d1fae5', 
                      color: c.status.toLowerCase().includes('adjourned') ? '#ef4444' : '#059669', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px',
                      display: 'inline-block'
                    }}>
                      {c.status}
                    </span>
                    {c.next_hearing_date && (
                      <span style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <Clock size={12} /> {new Date(c.next_hearing_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Scheduled consultations list */}
          <div className="glass-card-no-hover" style={{ padding: '1.25rem', marginBottom: '2rem', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={16} style={{ color: '#6366f1' }} /> My Consultations ({appointments.length})
            </h4>

            {appointments.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0' }}>No consultations booked yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appointments.map((appt) => {
                  const apptDate = new Date(appt.appointment_date);
                  const now = new Date();
                  const diffMins = (apptDate.getTime() - now.getTime()) / (1000 * 60);
                  const isJoinEnabled = DEV_MEETING_MODE ? true : (diffMins <= 10);
                  const isPending = appt.status === 'pending';
                  const isScheduled = appt.status === 'scheduled';
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'cancelled';
                  const hasPendingReschedule = appt.reschedule_status === 'PENDING_CLIENT';
                  const meetingReady = isScheduled && appt.meeting_status === 'CREATED' && appt.meeting_link;

                  return (
                    <div key={appt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.6rem 0.8rem', background: isCancelled ? '#fff1f2' : isPending ? '#fffbeb' : '#f8fafc', border: `1px solid ${isCancelled ? '#fecdd3' : isPending ? '#fde68a' : '#f1f5f9'}`, borderRadius: '10px', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong>{appt.advocate_name || 'Advocate'}</strong>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b' }}>{appt.notes ? `"${appt.notes}"` : 'General consultation'}</span>
                        </div>
                        <span style={{
                          fontSize: '0.6rem',
                          fontWeight: 'bold',
                          padding: '0.1rem 0.3rem',
                          borderRadius: '4px',
                          background: isCompleted ? '#d1fae5' : isCancelled ? '#fee2e2' : meetingReady ? '#e0e7ff' : isScheduled ? '#dbeafe' : '#fef3c7',
                          color: isCompleted ? '#065f46' : isCancelled ? '#dc2626' : meetingReady ? '#3730a3' : isScheduled ? '#1e40af' : '#92400e'
                        }}>
                          {isCancelled ? 'CANCELLED' : isCompleted ? 'COMPLETED' : meetingReady ? '🟢 READY' : isPending ? 'PENDING APPROVAL' : 'SCHEDULED'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 'bold' }}>
                        📅 {apptDate.toLocaleDateString()} {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                        {isPending && !hasPendingReschedule && (
                          <span style={{ fontSize: '0.65rem', color: '#92400e', fontStyle: 'italic' }}>
                            ⏳ Awaiting advocate confirmation…
                          </span>
                        )}

                        {hasPendingReschedule && (
                          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '1rem', marginTop: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <p style={{ fontSize: '0.8rem', color: '#5b21b6', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                              📅 Advocate proposed a new consultation time.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', background: 'white', padding: '0.8rem', borderRadius: '8px', border: '1px solid #f3e8ff' }}>
                              <div>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Date:</span>
                                <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>{formatDateDisplay(appt.reschedule_slot_date)}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Time:</span>
                                <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>
                                  {formatTimeDisplay(appt.reschedule_start_time)} – {formatTimeDisplay(appt.reschedule_end_time)}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Consultation Type:</span>
                                <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>{appt.reschedule_consultation_type || 'Video'}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Duration:</span>
                                <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>{appt.reschedule_duration_minutes || 30} minutes</span>
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Reason:</span>
                                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: '500', fontStyle: 'italic' }}>{appt.reschedule_reason || 'Advocate unavailable at previous time.'}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={async () => {
                                  try {
                                    await respondReschedule(appt.id, 'accept');
                                    alert('Reschedule request sent successfully.');
                                  } catch(e: any) {
                                    alert(e.message || 'Server error responding to reschedule');
                                  }
                                }}
                                className="btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                ✅ Accept New Slot
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await respondReschedule(appt.id, 'decline');
                                    alert('Reschedule request sent successfully.');
                                  } catch(e: any) {
                                    alert(e.message || 'Server error responding to reschedule');
                                  }
                                }}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                ❌ Decline
                              </button>
                              <button
                                onClick={() => setReschedulingAppt(appt)}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                🔄 Request Another Time
                              </button>
                            </div>
                          </div>
                        )}

                        {isCancelled && (
                          <span style={{ fontSize: '0.65rem', color: '#dc2626' }}>
                            ✗ Declined by advocate{appt.rejection_reason ? `: ${appt.rejection_reason}` : ''}. Please choose another advocate or slot.
                          </span>
                        )}

                        {isScheduled && !isCancelled && (
                          <div>
                            {!appt.meeting_link ? (
                              <span style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 'bold' }}>
                                ⏳ Generating your meeting link…
                              </span>
                            ) : (
                              <div>
                                {isJoinEnabled ? (
                                  <a
                                    href={appt.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary"
                                    style={{ textDecoration: 'none', padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}
                                  >
                                    Join Consultation
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>
                                    Join button appears 10 minutes before start.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {isCompleted && (
                          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>
                            ✓ Consultation Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Emergency Assistance Panel */}
          <div className="glass-card-no-hover" style={{ 
            padding: '1.5rem', 
            marginBottom: '2rem', 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255,255,255,0.9) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '16px'
          }}>
            <h4 style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              <Flame size={18} /> Emergency Help Desk
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
              Are you facing immediate police detention, harassment, or eviction? Talk to legal assistance immediately:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="tel:15100" style={{ textDecoration: 'none', background: 'white', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: '#b91c1c', fontWeight: 'bold' }}>
                <span>NALSA Helpline:</span>
                <span>📞 15100</span>
              </a>
              <a href="tel:181" style={{ textDecoration: 'none', background: 'white', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: '#b91c1c', fontWeight: 'bold' }}>
                <span>Women Helpline:</span>
                <span>📞 181</span>
              </a>
            </div>
          </div>

          {/* Popular Legal Guides */}
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem' }}>
            🔥 Popular Legal Guides
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {popularTopics.map((topic, idx) => (
              <div 
                key={idx} 
                className="glass-card" 
                onClick={() => handleTopicClick(topic.query)}
                style={{ padding: '0.9rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>{topic.title}</span>
                <ChevronRight size={14} style={{ color: '#94a3b8' }} />
              </div>
            ))}
          </div>

          {/* Nearby / Suggested Advocates */}
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem' }}>
            📍 Top Matched Advocates {userCity ? `in ${userCity}` : ''}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {fallbackAdvocates.map((adv) => (
              <div 
                key={adv.id} 
                className="glass-card" 
                onClick={() => {
                  setSelectedCaseId(adv.id); // temporary reuse advocate select id
                  setView('advocate_details');
                }}
                style={{ padding: '1rem', cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'center', borderRadius: '14px' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={adv.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} alt={adv.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adv.name}</h5>
                  <span style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: '600', display: 'block' }}>{adv.specialization_name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>⭐ {adv.rating} • {adv.experience_years} yrs exp</span>
                </div>
                <ChevronRight size={14} style={{ color: '#94a3b8' }} />
              </div>
            ))}
          </div>

          {/* Govt Schemes Banner */}
          <div className="glass-card-no-hover" style={{ 
            marginTop: '2rem', 
            padding: '1.25rem', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(255,255,255,0.9) 100%)', 
            border: '1px solid rgba(99,102,241,0.1)',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <Scale size={24} style={{ color: '#6366f1', marginBottom: '0.5rem' }} />
            <h5 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.25rem' }}>Government Tele-Law Scheme</h5>
            <p style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4 }}>
              Eligible rural/low-income citizens can seek free legal counseling from pre-appointed panel lawyers via local CSC centers.
            </p>
          </div>

        </div>

      </div>

      {/* ─── CLIENT SELECT ANOTHER TIME MODAL ────────────────── */}
      {reschedulingAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Request Another Time</h3>
              <button onClick={() => setReschedulingAppt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Select a different available slot from <strong>{reschedulingAppt.advocate_name}</strong>.
            </p>
            {loadingSlots ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading slots...</p>
            ) : advSlots.length === 0 ? (
              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e' }}>
                No active slots available. Please contact the advocate directly.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {advSlots.map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      border: `2px solid ${selectedSlotId === slot.id ? '#4f46e5' : '#e2e8f0'}`,
                      background: selectedSlotId === slot.id ? '#f0f0ff' : 'white',
                      color: '#1e293b',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: selectedSlotId === slot.id ? '700' : '400',
                      transition: 'all 0.15s',
                      marginBottom: '0.25rem'
                    }}
                  >
                    📅 {new Date(slot.slot_date).toLocaleDateString()} — {slot.start_time?.substring(0,5)} to {slot.end_time?.substring(0,5)} ({slot.consultation_type}, {slot.duration_minutes}min)
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setReschedulingAppt(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={async () => {
                  if (!selectedSlotId) return;
                  try {
                    await respondReschedule(reschedulingAppt.id, 'request_another', selectedSlotId);
                    setReschedulingAppt(null);
                    alert('Reschedule request sent successfully.');
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
                disabled={!selectedSlotId}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', opacity: selectedSlotId ? 1 : 0.5 }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
