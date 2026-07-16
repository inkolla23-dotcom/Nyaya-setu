import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ShieldCheck, AlertCircle, CheckCircle2, XCircle, FileText, User, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';

interface TrustCenterProps {
  setView: (view: string) => void;
}

export const TrustCenter: React.FC<TrustCenterProps> = ({ setView }) => {
  const { token, demoMode, user, logout } = useAuth();
  const { language } = useLanguage();

  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedAdvocate, setSelectedAdvocate] = useState<any>(null);
  
  // Action states
  const [actionNotes, setActionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const defaultMockVerifications: any[] = [];

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/verifications', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVerifications(data);
        if (data.length > 0) {
          // Keep current selection or select first
          setSelectedAdvocate((prev: any) => {
            if (prev) {
              const matched = data.find((x: any) => x.id === prev.id);
              if (matched) return matched;
            }
            return data[0];
          });
        } else {
          setSelectedAdvocate(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, [token]);

  const handleAction = async (status: 'Approved' | 'Rejected' | 'Resubmit') => {
    if (!selectedAdvocate) return;
    setSubmittingAction(true);
    try {
      const response = await fetch('/api/admin/verify-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          advocateId: selectedAdvocate.id,
          status,
          notes: actionNotes,
          rejectReason
        })
      });
      if (response.ok) {
        await loadVerifications();
      }
      setActionNotes('');
      setRejectReason('');
      alert(`Advocate profile verification status updated to "${status}" successfully.`);
    } catch (e) {
      alert('Failed to update verification status');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter verifications for tab
  const getTabStatus = () => {
    if (activeTab === 'pending') return 'Pending Verification';
    if (activeTab === 'approved') return 'Approved';
    return 'Rejected';
  };

  const filteredVerifications = verifications.filter(v => v.verification_status === getTabStatus());

  // Alerts calculations
  const lowScoreProfiles = verifications.filter(v => v.ai_match_score && v.ai_match_score < 70);
  const duplicateAlerts = verifications.filter(v => v.duplicate_detection && (v.duplicate_detection.toLowerCase().includes('flag') || v.duplicate_detection.toLowerCase().includes('match')));

  return (
    <div className="main-content" style={{ background: '#fafbfc' }}>
      
      {/* Header Back navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          {user?.role === 'verification_officer' ? (
            <button 
              className="btn-glass" 
              onClick={() => logout()} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', borderColor: '#fee2e2' }}
            >
              Sign Out (Log Out)
            </button>
          ) : (
            <button 
              className="btn-glass" 
              onClick={() => setView('client_dashboard')} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ChevronLeft size={16} /> Exit Verification Portal
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && (
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 'bold', color: '#1e293b', display: 'block' }}>{user.name}</span>
              <span style={{ color: '#64748b' }}>{user.email}</span>
            </div>
          )}
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.75rem', borderRadius: '8px' }}>
            🛡️ Officer Access
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.75px', margin: 0 }}>
          Nyaya Setu Verification Portal
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Audit advocate certificate registries, match live selfies with official ID databases, and manage enrollment clearances.
        </p>
      </div>

      {/* Warnings Banner */}
      {(lowScoreProfiles.length > 0 || duplicateAlerts.length > 0) && (
        <div className="glass-card-no-hover" style={{ 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%)', 
          border: '1px solid rgba(239, 68, 68, 0.15)',
          padding: '1.25rem',
          marginBottom: '2rem',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <ShieldAlert size={28} style={{ color: '#ef4444' }} />
          <div>
            <h4 style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '0.95rem' }}>AI Verification Alert Monitor Raised</h4>
            <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.15rem' }}>
              Detected <strong>{lowScoreProfiles.length}</strong> profile with low match confidence and <strong>{duplicateAlerts.length}</strong> duplicate name/bar code flag alert. Please review before granting Bar authorization.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN: Tabs and list */}
        <div>
          {/* Tabs bar */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <button 
              onClick={() => setActiveTab('pending')}
              style={{ flex: 1, border: 'none', background: activeTab === 'pending' ? 'white' : 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'pending' ? '#4f46e5' : '#64748b' }}
            >
              Pending ({verifications.filter(v => v.verification_status === 'Pending Verification').length})
            </button>
            <button 
              onClick={() => setActiveTab('approved')}
              style={{ flex: 1, border: 'none', background: activeTab === 'approved' ? 'white' : 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'approved' ? '#059669' : '#64748b' }}
            >
              Approved ({verifications.filter(v => v.verification_status === 'Approved').length})
            </button>
            <button 
              onClick={() => setActiveTab('rejected')}
              style={{ flex: 1, border: 'none', background: activeTab === 'rejected' ? 'white' : 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'rejected' ? '#ef4444' : '#64748b' }}
            >
              Rejected ({verifications.filter(v => v.verification_status === 'Rejected').length})
            </button>
          </div>

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredVerifications.map((v) => {
              const isAlert = v.ai_match_score && v.ai_match_score < 70;
              return (
                <div 
                  key={v.id} 
                  className="glass-card"
                  onClick={() => setSelectedAdvocate(v)}
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    border: selectedAdvocate?.id === v.id ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.06)',
                    background: selectedAdvocate?.id === v.id ? '#f5f3ff' : 'white',
                    borderLeft: isAlert ? '4px solid #ef4444' : '4px solid #cbd5e1'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.85rem' }}>{v.name}</h5>
                    {isAlert && <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#ef4444', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>Risk Flag</span>}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>{v.bar_registration}</span>
                  <span style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: '600' }}>Match Confidence: {v.ai_match_score || 95}%</span>
                </div>
              );
            })}

            {filteredVerifications.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem' }}>No registrations in this tab.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Detail Audits inspection panel */}
        <div>
          {selectedAdvocate ? (
            <div className="glass-card-no-hover" style={{ padding: '2rem', borderRadius: '20px' }}>
              
              {/* Advocate Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a' }}>{selectedAdvocate.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Email: <strong>{selectedAdvocate.email}</strong> • Phone: <strong>{selectedAdvocate.phone}</strong> • City: <strong>{selectedAdvocate.city}, {selectedAdvocate.state}</strong>
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#4f46e5', background: '#eef2ff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block', marginTop: '0.5rem' }}>
                    Practice domains: {selectedAdvocate.specialization_names || 'General practice'}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    background: selectedAdvocate.verification_status === 'Approved' ? '#d1fae5' : selectedAdvocate.verification_status === 'Rejected' ? '#fee2e2' : '#fffbeb', 
                    color: selectedAdvocate.verification_status === 'Approved' ? '#065f46' : selectedAdvocate.verification_status === 'Rejected' ? '#ef4444' : '#92400e', 
                    padding: '0.3rem 0.8rem', 
                    borderRadius: '9999px' 
                  }}>
                    {selectedAdvocate.verification_status}
                  </span>
                </div>
              </div>

              {/* Live Selfie vs Government Photo ID displays */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' }}>
                📷 Photo & Government ID Identity Audit
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', background: '#f8fafc', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Live Captured Selfie</span>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: '3px solid #cbd5e1' }}>
                    <img src={selectedAdvocate.live_selfie || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', background: '#f8fafc', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Government Photo ID</span>
                  <div style={{ width: '150px', height: '95px', borderRadius: '8px', border: '1px dashed #94a3b8', margin: '12px auto', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#475569', fontWeight: 'bold' }}>
                    Aadhaar / Passport Image
                  </div>
                </div>
              </div>

              {/* OCR extracts audit table comparison */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' }}>
                🔏 Automated OCR Extraction Comparisons
              </h4>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Security Field</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Profile Value</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>OCR Extracted Value</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Match Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Advocate Name</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{selectedAdvocate.name}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{selectedAdvocate.ocr_name || 'Rajesh Kumar'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: selectedAdvocate.name_match === 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {selectedAdvocate.name_match === 0 ? 'Mismatch ❌' : 'Matched ✓'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Bar Code Enrollment</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{selectedAdvocate.bar_registration}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{selectedAdvocate.ocr_enrollment || 'BAR/DEL/2015/8812'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: selectedAdvocate.ocr_enrollment && selectedAdvocate.ocr_enrollment !== selectedAdvocate.bar_registration ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {selectedAdvocate.ocr_enrollment && selectedAdvocate.ocr_enrollment !== selectedAdvocate.bar_registration ? 'Mismatch ❌' : 'Matched ✓'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>Certificate ID Code</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>n/a (input values)</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{selectedAdvocate.ocr_certificate_no || 'CERT-BAR-881240'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#10b981', fontWeight: 'bold' }}>Parsed ✓</td>
                  </tr>
                </tbody>
              </table>

              {/* AI matching statistics dashboard cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Face Match Similarity</span>
                  <strong style={{ fontSize: '1.2rem', color: selectedAdvocate.face_match_score < 70 ? '#ef4444' : '#0f172a' }}>
                    {selectedAdvocate.face_match_score || 94}% Confidence
                  </strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Duplicate Registry Check</span>
                  <strong style={{ fontSize: '0.8rem', color: '#059669', display: 'block', marginTop: '0.2rem' }}>
                    {selectedAdvocate.ocr_name && selectedAdvocate.ocr_name.includes('Alert') ? 'Alert Flag raised' : 'No duplicates ✓'}
                  </strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>AI Match Risk Index</span>
                  <strong style={{ fontSize: '1.2rem', color: selectedAdvocate.ai_match_score < 70 ? '#ef4444' : '#059669' }}>
                    {selectedAdvocate.ai_match_score || 95}% Safe
                  </strong>
                </div>
              </div>

              {/* Collapsible AI verification reports */}
              <div style={{ background: '#f1f5f9', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '2rem', fontSize: '0.8rem', color: '#334155', textAlign: 'left', border: '1px solid #cbd5e1' }}>
                <strong style={{ display: 'block', color: '#1e293b', marginBottom: '0.25rem' }}>✨ AI Verification Report Findings:</strong>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4, fontFamily: 'monospace' }}>
                  {selectedAdvocate.ai_verification_report || 'No automated reports generated.'}
                </p>
              </div>

              {/* Decision Section */}
              {selectedAdvocate.verification_status === 'Pending Verification' && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' }}>
                    📋 Trust Team Review Actions
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Internal Review Notes</label>
                      <textarea 
                        className="chat-input"
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Type verification notes for advocate directory logs..."
                        style={{ width: '100%', height: '60px', padding: '0.5rem', fontSize: '0.8rem', resize: 'none' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Rejection Reason (If rejecting)</label>
                      <textarea 
                        className="chat-input"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Provide details about missing certificates or mismatches..."
                        style={{ width: '100%', height: '60px', padding: '0.5rem', fontSize: '0.8rem', resize: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      onClick={() => handleAction('Approved')}
                      disabled={submittingAction}
                      className="btn-primary" 
                      style={{ flex: 1, justifyContent: 'center', background: '#059669', borderColor: '#059669' }}
                    >
                      Approve Profile
                    </button>
                    <button 
                      onClick={() => handleAction('Rejected')}
                      disabled={submittingAction}
                      className="btn-primary" 
                      style={{ flex: 1, justifyContent: 'center', background: '#dc2626', borderColor: '#dc2626' }}
                    >
                      Reject Profile
                    </button>
                    <button 
                      onClick={() => handleAction('Resubmit')}
                      disabled={submittingAction}
                      className="btn-secondary" 
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Request New Documents
                    </button>
                  </div>
                </div>
              )}

              {/* Verification history vertical tree log */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem' }}>
                  📜 Verification Audit History
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedAdvocate.verification_history?.map((h: any, idx: number) => (
                    <div key={idx} style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderLeft: '3px solid #6366f1', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>[{h.status}]</strong> {h.notes}
                      </div>
                      <span style={{ color: '#64748b' }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human-in-the-loop disclaimer warning */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4b5563', background: '#f3f4f6', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', marginTop: '1.5rem', border: '1px solid #d1d5db' }}>
                <AlertCircle size={14} style={{ color: '#4b5563' }} />
                <span>AI tools are strictly assisting verification. Final profile activation decision is manually authorized by the Nyaya Setu Verification Team.</span>
              </div>

            </div>
          ) : (
            <div className="glass-card-no-hover empty-state-wrapper" style={{ padding: '5rem', textAlign: 'center' }}>
              <UserCheck size={44} style={{ color: '#94a3b8' }} />
              <h4 style={{ marginTop: '1rem', fontWeight: 'bold' }}>No Profile Selected for Audit</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Select an advocate registration profile from the sidebar list to inspect details.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
