import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { ChevronLeft, FileText, Sparkles, BookOpen, AlertCircle, UploadCloud, CheckCircle2 } from 'lucide-react';

interface DocumentCheckerProps {
  setView: (view: string) => void;
  selectedDocAnalysis: any;
  setSelectedDocAnalysis: (doc: any) => void;
  caseId: number | null;
}

export const DocumentChecker: React.FC<DocumentCheckerProps> = ({ setView, selectedDocAnalysis, setSelectedDocAnalysis, caseId }) => {
  const { t, language } = useLanguage();
  const { uploadDocument } = useData();

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Standalone upload simulation (without a case)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await simulateStandaloneUpload(e.dataTransfer.files[0].name);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await simulateStandaloneUpload(e.target.files[0].name);
    }
  };

  const simulateStandaloneUpload = async (fileName: string) => {
    setUploading(true);
    try {
      let fileType = 'Notice';
      if (fileName.toLowerCase().includes('fir')) fileType = 'FIR';
      if (fileName.toLowerCase().includes('agree') || fileName.toLowerCase().includes('lease') || fileName.toLowerCase().includes('contract')) fileType = 'Agreement';

      const response = await uploadDocument({
        caseId: caseId || null,
        fileName,
        fileType,
        textContent: `Standalone simulated legal file text content for ${fileName}`
      });

      setSelectedDocAnalysis(response.document);
    } catch (e) {
      alert('Failed to analyze document');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedDocAnalysis(null);
  };

  // Safe JSON Parsing helper
  const parseJsonArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val);
    } catch (e) {
      return [];
    }
  };

  const parseJsonObject = (val: any): Record<string, string> => {
    if (!val) return {};
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch (e) {
      return {};
    }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{t.uploadAction}</h2>
          <p style={{ color: '#64748b' }}>
            {language === 'te' ? 'పత్రాలను అప్‌లోడ్ చేసి వాటిలోని కఠిన చట్టపరమైన పదాల అర్థాలను తెలుసుకోండి.' : 
             language === 'hi' ? 'दस्तावेज अपलोड करें और कठिन कानूनी शब्दों का सरल अर्थ समझें।' : 
             'Translate and scan agreements, notices, or police FIR reports into citizen language and verify missing files.'}
          </p>
        </div>
        {selectedDocAnalysis ? (
          <button className="btn-secondary" onClick={handleReset}>
            Scan Another File
          </button>
        ) : null}
      </div>

      {/* NO SELECTED ANALYSIS - SHOW UPLOADER */}
      {!selectedDocAnalysis ? (
        <div style={{ maxWidth: '680px', margin: '3rem auto' }}>
          <div 
            className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            style={{ padding: '4rem 2rem' }}
          >
            <input 
              type="file" 
              id="standalone-file-input" 
              onChange={handleFileInput} 
              style={{ display: 'none' }}
            />
            <label htmlFor="standalone-file-input" style={{ cursor: 'pointer', display: 'block' }}>
              <UploadCloud size={64} className="upload-icon-pulse" style={{ margin: '0 auto 1.5rem', color: '#4f46e5' }} />
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                {uploading ? 'Analyzing with AI...' : 'Select Legal Document to Audit'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {t.uploadPrompt}
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>Property Agreements</span>
                <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>Police FIR Copies</span>
                <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>Court Notices</span>
              </div>
            </label>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
            <AlertCircle size={18} style={{ color: '#6366f1', flexShrink: 0 }} />
            <span>
              <strong>Demo simulation tip:</strong> You can drag/select any dummy file. If the file name contains "FIR", the system simulates a criminal FIR review. If it contains "agree" or "lease", it runs an agreement title check.
            </span>
          </div>
        </div>
      ) : (
        /* ANALYSIS PRESENT - SHOW RESULTS PANEL */
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          
          {/* Left Side: Summary & Points */}
          <div>
            {/* File info banner */}
            <div className="glass-card-no-hover" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#f5f3ff', borderColor: 'rgba(99,102,241,0.1)' }}>
              <div className="action-icon-wrapper bg-purple-grad" style={{ padding: '0.75rem', borderRadius: '50%' }}>
                <FileText size={24} />
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{selectedDocAnalysis.fileName || selectedDocAnalysis.file_name}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                  <span>Type: <strong>{selectedDocAnalysis.fileType || selectedDocAnalysis.file_type}</strong></span>
                  <span>•</span>
                  <span>Audited by Nyaya Setu AI</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card-no-hover" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-purple)' }} /> {t.summary}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                {selectedDocAnalysis.summary}
              </p>
            </div>

            {/* Key obligations */}
            <div className="glass-card-no-hover" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} /> {t.keyPoints}
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {parseJsonArray(selectedDocAnalysis.keyPoints || selectedDocAnalysis.key_points).map((pt, idx) => (
                  <li key={idx} style={{ fontSize: '0.875rem', color: '#334155' }}>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing documents */}
            <div className="glass-card-no-hover" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={18} style={{ color: 'var(--accent-amber)' }} /> {t.commonMissingDocs}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {parseJsonArray(selectedDocAnalysis.missingDocuments || selectedDocAnalysis.missing_documents).map((doc, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠</span> {doc}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right Side: Jargon explainer */}
          <div>
            <div className="glass-card-no-hover" style={{ padding: '1.75rem', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} style={{ color: '#4f46e5' }} /> {t.jargonExplainer}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Hover or read below for plain terms translating the legalese found in your document:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(parseJsonObject(selectedDocAnalysis.difficultWords || selectedDocAnalysis.difficult_words)).map(([word, explanation], idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#7c3aed', textTransform: 'capitalize', display: 'block', marginBottom: '0.2rem' }}>
                      {word}
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                      {explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
