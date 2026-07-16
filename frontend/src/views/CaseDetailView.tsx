import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ShieldCheck, Clock, FileText, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle, UploadCloud } from 'lucide-react';

interface CaseDetailViewProps {
  setView: (view: string) => void;
  caseId: number;
  setSelectedDocAnalysis: (doc: any) => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({ setView, caseId, setSelectedDocAnalysis }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { fetchCaseDetails, uploadDocument, getWhatNext } = useData();

  const [activeCase, setActiveCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWhatNextModal, setShowWhatNextModal] = useState(false);
  const [whatNextData, setWhatNextData] = useState<any>(null);
  const [whatNextLoading, setWhatNextLoading] = useState(false);

  // Document upload simulation state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function loadCaseData() {
    setLoading(true);
    try {
      const data = await fetchCaseDetails(caseId);
      setActiveCase(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const handleWhatNextClick = async () => {
    setShowWhatNextModal(true);
    setWhatNextLoading(true);
    try {
      const info = await getWhatNext(caseId);
      setWhatNextData(info);
    } catch (e) {
      console.error(e);
    } finally {
      setWhatNextLoading(false);
    }
  };

  // Simulating dragging
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Simulating drop file
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await simulateUpload(file.name);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await simulateUpload(file.name);
    }
  };

  const simulateUpload = async (fileName: string) => {
    setUploadingDoc(true);
    try {
      // Determine file type from extension
      let fileType = 'Notice';
      if (fileName.toLowerCase().includes('fir')) fileType = 'FIR';
      if (fileName.toLowerCase().includes('agree') || fileName.toLowerCase().includes('lease') || fileName.toLowerCase().includes('contract')) fileType = 'Agreement';

      await uploadDocument({
        caseId,
        fileName,
        fileType,
        textContent: `Simulated legal file text content for ${fileName}`
      });

      // Reload case details to show new document and updated health score
      await loadCaseData();
    } catch (e) {
      alert('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleViewDocAnalysis = (doc: any) => {
    setSelectedDocAnalysis(doc);
    setView('document_checker');
  };

  if (loading) {
    return (
      <div className="main-content">

        <div className="skeleton skeleton-rect" style={{ height: '300px' }} />
      </div>
    );
  }

  // Parse health score reasons
  let healthReasons: string[] = [];
  try {
    healthReasons = typeof activeCase.health_reasons === 'string' 
      ? JSON.parse(activeCase.health_reasons) 
      : activeCase.health_reasons || [];
  } catch (e) {
    healthReasons = [];
  }

  return (
    <div className="main-content">


      {/* Case Header Banner */}
      <div className="glass-card-no-hover" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '5px solid var(--primary-indigo)' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#ede9fe', color: '#7c3aed', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
            {activeCase.category_name}
          </span>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#0f172a' }}>{activeCase.title}</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
            Advocate: <strong>{activeCase.advocate_name}</strong> | Client: <strong>{activeCase.client_name}</strong>
          </p>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: 'bold', 
            background: activeCase.status.toLowerCase().includes('adjourned') ? '#fee2e2' : '#d1fae5', 
            color: activeCase.status.toLowerCase().includes('adjourned') ? '#ef4444' : '#10b981', 
            padding: '0.4rem 1rem', 
            borderRadius: '9999px'
          }}>
            {activeCase.status}
          </span>
          {activeCase.next_hearing_date && (
            <span style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
              <Clock size={14} /> Hearing: {new Date(activeCase.next_hearing_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '2rem' }}>
        
        {/* Left Column: Timeline & AI Summaries */}
        <div>
          {/* AI Case Summary */}
          <div className="glass-card-no-hover" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#1e293b' }}>
              ✨ AI Case Summary
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {activeCase.ai_summary || "No summary recorded. Provide documents or updates to generate a brief."}
            </p>
          </div>

          {/* GitHub Case Timeline */}
          <div className="glass-card-no-hover" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#1e293b' }}>
              📊 {t.timeline}
            </h3>

            {activeCase.updates?.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No updates logged for this case.</p>
            ) : (
              <div className="timeline-container">
                {activeCase.updates?.map((up: any) => (
                  <div key={up.id} className="timeline-item">
                    {/* Circle icon dot */}
                    <div className="timeline-icon-dot">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-purple)' }} />
                    </div>

                    <div className="timeline-content-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6366f1', background: '#ede9fe', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {up.stage}
                        </span>
                        <span className="timeline-date">
                          {new Date(up.update_date).toLocaleDateString()} {new Date(up.update_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.4rem' }}>
                        {up.title}
                      </h4>

                      {/* Legalese versus AI explainer */}
                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', border: '1px solid rgba(0,0,0,0.03)' }}>
                        <strong>{t.originalLegalese}:</strong> "{up.description}"
                      </div>
                      
                      {up.ai_explanation && (
                        <div style={{ marginTop: '0.75rem', background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#166534', border: '1px solid #d1fae5' }}>
                          <strong>💡 {t.aiPlainExplanation}:</strong> "{up.ai_explanation}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Health gauge & Document uploads */}
        <div>
          {/* Health score Circular Gauge */}
          <div className="glass-card-no-hover" style={{ padding: '1.75rem', marginBottom: '2rem', borderRadius: '18px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>{t.healthScore}</h3>
            
            <div className="health-score-container" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* circular gauge */}
              <svg className="gauge-svg" viewBox="0 0 36 36" style={{ width: '70px', height: '70px', flexShrink: 0 }}>
                <path
                  className="gauge-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{ stroke: '#e2e8f0', strokeWidth: '3.5', fill: 'none' }}
                />
                <path
                  className="gauge-fill"
                  strokeDasharray={`${activeCase.health_score}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{ 
                    strokeWidth: '3.5', 
                    strokeLinecap: 'round', 
                    fill: 'none', 
                    transition: 'stroke-dasharray 0.5s ease',
                    stroke: activeCase.health_score > 80 ? '#10b981' : activeCase.health_score > 60 ? '#f59e0b' : '#ef4444' 
                  }}
                />
                <text x="18" y="21.5" className="gauge-text" textAnchor="middle" style={{ fontSize: '8px', fontWeight: 'bold', fill: '#1e293b', fontFamily: 'inherit' }}>
                  {activeCase.health_score}%
                </text>
              </svg>
 
              <div>
                <strong style={{ fontSize: '1.4rem', color: '#0f172a', display: 'block' }}>{activeCase.health_score}/100 Score</strong>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem', lineHeight: 1.3 }}>AI evaluation of case readiness and requirements.</p>
              </div>
            </div>

            {/* Checklist reasons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              {healthReasons.map((reason, idx) => {
                const isNegative = reason.toLowerCase().includes('missing') || reason.toLowerCase().includes('pending');
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                    {isNegative ? (
                      <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} />
                    ) : (
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)' }} />
                    )}
                    <span style={{ textDecoration: isNegative ? 'none' : 'none' }}>
                      {reason}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* What happens next button */}
            <button 
              className="btn-primary" 
              onClick={handleWhatNextClick}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.6rem' }}
            >
              🚀 {t.whatHappensNext}
            </button>
          </div>

          {/* Document Vault (List + Upload) */}
          <div className="glass-card-no-hover" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b' }}>
              📁 Case Document Vault
            </h3>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {activeCase.documents?.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>No documents uploaded yet.</p>
              ) : (
                activeCase.documents?.map((doc: any) => (
                  <div 
                    key={doc.id} 
                    className="glass-card" 
                    onClick={() => handleViewDocAnalysis(doc)}
                    style={{ 
                      padding: '0.75rem 1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <FileText size={20} style={{ color: '#4f46e5', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e293b', display: 'block' }}>{doc.file_name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{doc.file_type}</span>
                      </div>
                    </div>
                    <ChevronLeft size={16} style={{ transform: 'rotate(180deg)', color: '#94a3b8' }} />
                  </div>
                ))
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div 
              className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{ padding: '1.5rem 1rem', borderRadius: '12px' }}
            >
              <input 
                type="file" 
                id="file-upload-input" 
                onChange={handleFileInputChange} 
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload-input" style={{ cursor: 'pointer' }}>
                <UploadCloud size={32} className="upload-icon-pulse" style={{ margin: '0 auto 0.5rem' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4f46e5', display: 'block' }}>
                  {uploadingDoc ? 'Uploading & Analyzing...' : 'Upload Legal Papers'}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  PDF, Image (Agreement, FIR, Notice)
                </span>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* --- WHAT HAPPENS NEXT SLIDE-OVER OVERLAY --- */}
      {showWhatNextModal && (
        <div className="modal-overlay" onClick={() => setShowWhatNextModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="gradient-text">
              🚀 Case Stage Projection
            </h3>
            
            {whatNextLoading ? (
              <div style={{ padding: '2rem 0' }}>
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" />
              </div>
            ) : whatNextData ? (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b45309', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {t.stage}
                  </span>
                  <p style={{ fontSize: '0.9rem', color: '#1e293b', marginTop: '0.4rem', fontWeight: '500' }}>
                    {whatNextData.currentStage}
                  </p>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', background: '#d1fae5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    What Happens Next?
                  </span>
                  <p style={{ fontSize: '0.9rem', color: '#1e293b', marginTop: '0.4rem', fontWeight: '500' }}>
                    {whatNextData.possibleNextStage}
                  </p>
                </div>

                <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                    📋 Prepare These Documents
                  </span>
                  <ul style={{ paddingLeft: '1rem' }}>
                    {whatNextData.documentsToPrepare?.map((doc: string, idx: number) => (
                      <li key={idx} style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem' }}>{doc}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <span style={{ color: '#64748b' }}>Estimated Wait Period:</span>
                  <strong style={{ color: '#4f46e5' }}>{whatNextData.waitingTime}</strong>
                </div>
              </div>
            ) : (
              <p>Failed to generate roadmap prediction.</p>
            )}

            <button 
              className="btn-primary" 
              onClick={() => setShowWhatNextModal(false)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.6rem' }}
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
