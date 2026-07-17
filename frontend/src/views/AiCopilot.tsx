import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSpeech } from '../context/SpeechContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Mic, Send, AlertTriangle, ShieldCheck, ChevronRight, HelpCircle, FileText, Users, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface AiCopilotProps {
  setView: (view: string) => void;
  initialSearchQuery: string;
  setInitialSearchQuery: (query: string) => void;
  setSelectedAiCategory?: (cat: string) => void;
  setSelectedAdvocateId?: (id: number) => void;
}

export const AiCopilot: React.FC<AiCopilotProps> = ({ 
  setView, 
  initialSearchQuery, 
  setInitialSearchQuery,
  setSelectedAiCategory,
  setSelectedAdvocateId
}) => {
  const { language, t } = useLanguage();
  const { triggerVoiceInput } = useSpeech();
  const { chatWithAi, fetchAiHistory, aiHistory, isLoading, advocates: allAdvocates, fetchAdvocates } = useData();
  const { demoMode } = useAuth();

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI-matched advocate recommendations
  const [recommendedAdvocates, setRecommendedAdvocates] = useState<any[]>([]);
  const [lastAiCategory, setLastAiCategory] = useState<string>('');

  // Helper: parse JSON languages
  const getLangArray = (langs: any): string[] => {
    if (!langs) return [];
    if (Array.isArray(langs)) return langs;
    try { return JSON.parse(langs); } catch { return [langs]; }
  };

  // After AI response, find matching advocates by category
  useEffect(() => {
    if (lastAiCategory && allAdvocates.length > 0) {
      const catLower = lastAiCategory.toLowerCase();
      const matched = allAdvocates.filter((adv: any) => {
        const specName = (adv.specialization_name || '').toLowerCase();
        return specName === catLower || specName.includes(catLower) || catLower.includes(specName);
      });
      // Take top 3 by rating
      const top3 = matched.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
      setRecommendedAdvocates(top3);
    } else {
      setRecommendedAdvocates([]);
    }
  }, [lastAiCategory, allAdvocates]);

  // Ensure advocates are loaded
  useEffect(() => {
    fetchAdvocates({});
  }, []);


  // Suggestion chips based on language
  const suggestionChips = {
    en: [
      "Divorce mutual consent roadmap?",
      "Neighbor built fence on my boundary",
      "Police registered false 420 case",
      "Wages unpaid by employer"
    ],
    te: [
      "పరస్పర విడాకుల ప్రక్రియ ఏమిటి?",
      "భూమి సరిహద్దు ఆక్రమణకు గురైంది",
      "అబద్ధపు ఎఫ్.ఐ.ఆర్ నకిలీ కేసు నమోదు",
      "జీతం రాకపోతే ఎక్కడ ఫిర్యాదు చేయాలి?"
    ],
    hi: [
      "आपसी सहमति से तलाक का रास्ता क्या है?",
      "पड़ोसी ने जमीन की सीमा पर कब्ज़ा कर लिया",
      "झूठी एफआईआर (420) दर्ज हो गई है",
      "कंपनी सैलरी नहीं दे रही है"
    ]
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadLogs() {
      const logs = await fetchAiHistory();
      if (logs.length > 0) {
        setChatMessages(logs);
      } else {
        // Welcoming prompt
        setChatMessages([
          {
            id: 0,
            message: '',
            response: {
              explanation: language === 'te' ? 'హలో! నేను మీ న్యాయ కోపైలట్ (Nyaya Copilot) ని. చట్టపరమైన సమస్యలను సాధారణ భాషలో అర్థం చేసుకోవడంలో సహాయం చేస్తాను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?' :
                           language === 'hi' ? 'नमस्ते! मैं आपका न्याय कोपायलट (Nyaya Copilot) हूँ। मैं कानूनी समस्याओं को सरल भाषा में समझाने में मदद करता हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?' :
                           'Hello! I am your Nyaya Copilot. I help translate complex Indian legal situations into plain citizen terms and plot visual step-by-step action roadmaps. Describe your problem below:',
            },
            createdAt: new Date().toISOString()
          }
        ]);
      }
    }
    loadLogs();
  }, [language]);

  // Handle Initial Search Query passed from Home Screen
  useEffect(() => {
    if (initialSearchQuery) {
      handleSendMessage(initialSearchQuery);
      setInitialSearchQuery(''); // clear so it doesn't loop
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    // Capture text immediately — prevent stale state
    const text = textToSend.trim();
    if (!text || isLoading) return;

    // Stable unique ID for this specific message — used to match response back
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newUserMsg = {
      id: msgId,
      message: text,
      response: null,
      createdAt: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, newUserMsg]);
    setInputText('');

    try {
      // Pass the captured text — NOT inputText state (which may have changed)
      const aiResponse = await chatWithAi(text);

      setChatMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        if (aiResponse && aiResponse.success === false) {
          return {
            ...m,
            response: {
              success: false,
              reply: aiResponse.error || aiResponse.message || 'Nyaya Copilot is temporarily unavailable.',
              explanation: aiResponse.error || 'Nyaya Copilot is temporarily unavailable.',
              details: aiResponse.details || ''
            }
          };
        }
        return {
          ...m,
          response: aiResponse || {
            reply: 'I received your message but could not generate a response. Please try again.',
            explanation: 'I received your message but could not generate a response. Please try again.'
          }
        };
      }));

      // Extract AI category for advocate matching
      if (aiResponse && aiResponse.category) {
        setLastAiCategory(aiResponse.category);
      }


    } catch (e: any) {
      console.error('[AiCopilot] handleSendMessage error:', e.message);
      setChatMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          response: {
            success: false,
            reply: e?.message || 'Nyaya Copilot is temporarily unavailable. Please check your connection.',
            explanation: e?.message || 'Nyaya Copilot is temporarily unavailable.'
          }
        };
      }));
    }
  };


  const handleVoiceInputClick = () => {
    triggerVoiceInput((spokenText) => {
      handleSendMessage(spokenText);
    });
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Breadcrumbs Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b', alignItems: 'center' }}>
          <button 
            onClick={() => setView('client_dashboard')} 
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0, fontWeight: 'bold', fontSize: '0.8rem' }}
          >
            Home
          </button>
          <span>/</span>
          <button 
            onClick={() => setView('client_dashboard')} 
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0, fontWeight: 'bold', fontSize: '0.8rem' }}
          >
            Dashboard
          </button>
          <span>/</span>
          <span style={{ color: '#4b5563' }}>Nyaya Copilot Chat</span>
        </div>
        <button
          onClick={async () => {
            if (window.confirm("Are you sure you want to clear this conversation history?")) {
              if (demoMode) {
                localStorage.removeItem('ns_ai_history');
                setChatMessages([
                  {
                    id: 0,
                    message: '',
                    response: {
                      explanation: language === 'te' ? 'హలో! నేను మీ న్యాయ కోపైలట్ (Nyaya Copilot) ని. చట్టపరమైన సమస్యలను సాధారణ భాషలో అర్థం చేసుకోవడంలో సహాయం చేస్తాను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?' :
                                   language === 'hi' ? 'नमस्ते! मैं आपका न्याय कोपायलट (Nyaya Copilot) हूँ। मैं कानूनी समस्याओं को सरल भाषा में समझाने में मदद करता हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?' :
                                   'Hello! I am your Nyaya Copilot. I help translate complex Indian legal situations into plain citizen terms and plot visual step-by-step action roadmaps. Describe your problem below:',
                    },
                    createdAt: new Date().toISOString()
                  }
                ]);
              } else {
                try {
                  const savedToken = localStorage.getItem('nyaya_setu_token');
                  await fetch(`${API_URL}/ai/chat/clear`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${savedToken}`
                    }
                  });
                  setChatMessages([
                    {
                      id: 0,
                      message: '',
                      response: {
                        explanation: language === 'te' ? 'హలో! నేను మీ న్యాయ కోపైలట్ (Nyaya Copilot) ని. చట్టపరమైన సమస్యలను సాధారణ భాషలో అర్థం చేసుకోవడంలో సహాయం చేస్తాను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?' :
                                     language === 'hi' ? 'नमस्ते! मैं आपका न्याय कोपायलट (Nyaya Copilot) हूँ। मैं कानूनी समस्याओं को सरल भाषा में समझाने में मदद करता हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?' :
                                     'Hello! I am your Nyaya Copilot. I help translate complex Indian legal situations into plain citizen terms and plot visual step-by-step action roadmaps. Describe your problem below:',
                      },
                      createdAt: new Date().toISOString()
                    }
                  ]);
                } catch (e) {
                  console.error('Failed to clear history');
                }
              }
            }
          }}
          className="btn-glass"
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: '#ef4444', borderColor: '#fee2e2' }}
        >
          🗑️ Clear Conversation
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{t.askAi}</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Describe your legal problem in your own words. Nyaya Copilot will explain your options like a lawyer would.
        </p>
      </div>

      {/* Main chat window */}
      <div className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto' }}>
          {chatMessages.map((msg, index) => (
            <React.Fragment key={index}>
              {/* User Bubble */}
              {msg.message && (
                <div className="chat-bubble user" style={{ marginBottom: '1rem' }}>
                  <div className="avatar-user">👤</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div className="bubble-content">{msg.message}</div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem', marginRight: '0.5rem' }}>
                      {new Date(msg.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Bubble */}
              <div className="chat-bubble ai" style={{ width: '100%', marginBottom: '1.5rem' }}>
                <div className="avatar-ai">✨</div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'flex-start' }}>
                  <div className="bubble-content" style={{ width: '100%' }}>
                  {msg.response ? (
                    <div>
                      {/* ── Error State ─────────────────────────────────── */}
                      {msg.response.success === false ? (
                        <div style={{ display: 'flex', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.85rem', color: '#dc2626', fontSize: '0.85rem' }}>
                          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{msg.response.reply || msg.response.error}</div>
                            {msg.response.details && (
                              <div style={{ fontSize: '0.72rem', color: '#ef4444', opacity: 0.8 }}>{msg.response.details}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                      <div>

                        {/* ── Category + Confidence strip ─────────────── */}
                        {msg.response.category && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', background: 'linear-gradient(135deg,#e0e7ff,#ede9fe)', color: '#4f46e5', padding: '0.3rem 0.7rem', borderRadius: '20px', letterSpacing: '0.03em' }}>
                              ⚖️ {msg.response.category}
                            </span>

                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              {msg.response.confidence != null && (
                                <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.55rem', borderRadius: '20px', fontWeight: '600' }}>
                                  {Math.round(msg.response.confidence * 100)}% Match
                                </span>
                              )}
                              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <ShieldCheck size={13} /> Verified
                              </span>
                            </div>
                          </div>
                        )}

                        {/* ── Conversational Reply ─────────────────────── */}
                        {/* Only plain text paragraphs — no markdown, no headings */}
                        <div style={{ fontSize: '0.96rem', lineHeight: '1.75', color: '#1e293b', marginBottom: '1.4rem' }}>
                          {(msg.response.reply || msg.response.explanation || '')
                            // Strip any residual markdown headings/bullets the AI may have left
                            .replace(/^#{1,3}\s+/gm, '')
                            .replace(/^\*{1,2}(.+?)\*{1,2}/gm, '$1')
                            .replace(/^[-•]\s+/gm, '')
                            .split('\n')
                            .filter((line: string) => line.trim() !== '' || true)
                            .map((line: string, li: number) => {
                              const clean = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim();
                              if (!clean) return <br key={li} />;
                              return <p key={li} style={{ margin: '0 0 0.6rem 0' }}>{clean}</p>;
                            })}
                        </div>

                        {/* ── Applicable Laws card ─────────────────────── */}
                        {msg.response.laws?.length > 0 && (
                          <div style={{ background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1d4ed8', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              📚 Applicable Laws
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {msg.response.laws.map((law: string, li: number) => (
                                <div key={li} style={{ fontSize: '0.82rem', color: '#1e3a5f', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                  <span style={{ color: '#3b82f6', fontWeight: '700', flexShrink: 0 }}>§</span>
                                  <span>{law}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Required Documents + Consultation row ────── */}
                        {(msg.response.requiredDocuments?.length > 0 || msg.response.estimated_documents?.length > 0 || msg.response.estimatedFee || msg.response.estimatedTimeline) && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>

                            {/* Documents */}
                            {(msg.response.requiredDocuments?.length > 0 || msg.response.estimated_documents?.length > 0) && (
                              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  📝 Documents Needed
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  {(msg.response.requiredDocuments || msg.response.estimated_documents || []).map((doc: string, di: number) => (
                                    <div key={di} style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                                      <span style={{ color: '#10b981', fontWeight: '700', flexShrink: 0, marginTop: '1px' }}>✓</span>
                                      <span>{doc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Consultation details */}
                            {(msg.response.estimatedFee || msg.response.estimatedTimeline || msg.response.advocateType || msg.response.recommended_specialization) && (
                              <div style={{ background: 'linear-gradient(135deg,#fdf4ff,#faf5ff)', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#7e22ce', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  💼 Case Details
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {(msg.response.advocateType || msg.response.recommended_specialization) && (
                                    <div style={{ fontSize: '0.78rem', color: '#4c1d95' }}>
                                      <span style={{ fontWeight: '600' }}>Lawyer: </span>
                                      {msg.response.advocateType || msg.response.recommended_specialization}
                                    </div>
                                  )}
                                  {msg.response.estimatedTimeline && (
                                    <div style={{ fontSize: '0.78rem', color: '#4c1d95' }}>
                                      <span style={{ fontWeight: '600' }}>Timeline: </span>
                                      {msg.response.estimatedTimeline}
                                    </div>
                                  )}
                                  {msg.response.estimatedFee && (
                                    <div style={{ fontSize: '0.78rem', color: '#4c1d95' }}>
                                      <span style={{ fontWeight: '600' }}>Est. Fee: </span>
                                      {msg.response.estimatedFee}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Roadmap Stepper ──────────────────────────── */}
                        {msg.response.roadmap?.length > 0 && (
                          <div style={{ marginBottom: '1.1rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              🗺️ Your Legal Roadmap
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                              {msg.response.roadmap.map((step: string, si: number) => (
                                <div key={si} style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
                                  {/* Step number column */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px', flexShrink: 0 }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {si + 1}
                                    </div>
                                    {si < msg.response.roadmap.length - 1 && (
                                      <div style={{ width: '2px', flex: 1, background: 'linear-gradient(to bottom,#a5b4fc,#e0e7ff)', marginTop: '2px' }} />
                                    )}
                                  </div>
                                  {/* Step text */}
                                  <div style={{ paddingLeft: '0.65rem', paddingBottom: si < msg.response.roadmap.length - 1 ? '0.9rem' : '0', paddingTop: '2px' }}>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: '1.5' }}>{step}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── CTA buttons ──────────────────────────────── */}
                        {(msg.response.roadmap?.length > 0 || msg.response.requiredDocuments?.length > 0) && (
                          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn-primary"
                              onClick={() => {
                                if (setSelectedAiCategory && msg.response.category) {
                                  setSelectedAiCategory(msg.response.category);
                                }
                                setView('advocate_search');
                              }}
                              style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
                            >
                              🔍 Find {msg.response.category || ''} Advocates
                            </button>
                            <button
                              className="btn-glass"
                              onClick={() => setView('document_checker')}
                              style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <FileText size={13} /> Check My Documents
                            </button>
                          </div>
                        )}

                        {/* ── Disclaimer ───────────────────────────────── */}
                        <div style={{ display: 'flex', gap: '0.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.65rem 0.75rem', color: '#b45309', fontSize: '0.73rem', marginBottom: '0.75rem' }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                          <span style={{ fontWeight: '500' }}>{msg.response.disclaimer || t.educationalDisclaimer}</span>
                        </div>

                        {/* ── AI Matched Advocates ─────────────────────── */}
                        {msg.response.category && recommendedAdvocates.length > 0 && index === chatMessages.length - 1 && (
                          <div className="ai-recommend-panel" style={{ marginBottom: '1rem' }}>
                            <h4><Users size={16} /> Recommended {msg.response.category} Advocates</h4>
                            <div className="recommend-advocate-cards">
                              {recommendedAdvocates.map((adv: any) => {
                                const langs = getLangArray(adv.languages);
                                return (
                                  <div
                                    key={adv.id}
                                    className="recommend-advocate-card"
                                    onClick={() => {
                                      if (setSelectedAdvocateId) setSelectedAdvocateId(adv.id);
                                      setView('advocate_profile');
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <img
                                        src={adv.profile_photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80'}
                                        alt={adv.name}
                                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e7ff' }}
                                      />
                                      <div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>{adv.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{adv.experience_years}y exp · {adv.location}</div>
                                      </div>
                                    </div>
                                    <div className="lang-chips" style={{ marginTop: '0.25rem' }}>
                                      {langs.slice(0, 3).map((l: string) => <span key={l} className="lang-chip lang-chip-sm">{l}</span>)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                      <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                        <Star size={11} fill="#10b981" /> {adv.rating}
                                      </span>
                                      <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#4f46e5' }}>₹{adv.consultation_fee}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              className="btn-secondary"
                              onClick={() => {
                                if (setSelectedAiCategory) setSelectedAiCategory(lastAiCategory);
                                setView('advocate_search');
                              }}
                              style={{ marginTop: '0.75rem', fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                            >
                              View All {lastAiCategory} Advocates <ChevronRight size={14} />
                            </button>
                          </div>
                        )}

                        {/* ── Copy / Listen / Regenerate ───────────────── */}
                        <div style={{ display: 'flex', gap: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', fontSize: '0.74rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.response.reply || '').then(() => alert('Copied!'));
                            }}
                            style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const synth = window.speechSynthesis;
                              if (!synth) { alert('TTS not supported'); return; }
                              if (synth.speaking) { synth.cancel(); return; }
                              const text = (msg.response.reply || '').replace(/\n/g, ' ');
                              const utt = new SpeechSynthesisUtterance(text);
                              const loc: Record<string, string> = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };
                              utt.lang = loc[msg.response.detectedLanguage || language] || 'en-IN';
                              utt.rate = 0.9;
                              synth.speak(utt);
                            }}
                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                          >
                            🔊 Listen
                          </button>
                          <button
                            type="button"
                            onClick={() => !isLoading && handleSendMessage(msg.message)}
                            disabled={isLoading}
                            style={{ background: 'none', border: 'none', color: isLoading ? '#94a3b8' : '#d97706', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                          >
                            🔄 Regenerate
                          </button>
                        </div>

                      </div>
                      )}
                    </div>
                  ) : (
                    /* Typing indicator */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Nyaya Copilot is thinking</span>
                      <span style={{ display: 'inline-flex', gap: '3px' }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: `bounce 1.2s infinite ${i * 0.2}s` }} />
                        ))}
                      </span>
                    </div>
                  )}
                  </div>
                  <span style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '0.2rem', marginLeft: '0.5rem' }}>
                    {new Date(msg.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Typing Skeleton Animation */}
          {isLoading && (
            <div className="chat-bubble ai" style={{ width: '100%' }}>
              <div className="avatar-ai">✨</div>
              <div className="bubble-content" style={{ width: '60%' }}>
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          {/* Suggestion Chips */}
          <div className="suggestion-container">
            {suggestionChips[language as keyof typeof suggestionChips]?.map((chip, idx) => (
              <button 
                key={idx} 
                className="suggestion-chip"
                onClick={() => !isLoading && handleSendMessage(chip)}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} 
            className="chat-input-bar"
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
          >
            <button 
              type="button" 
              onClick={handleVoiceInputClick}
              className="voice-btn-pulse"
              style={{ width: '40px', height: '40px', opacity: isLoading ? 0.5 : 1 }}
              title={t.voiceAction}
              disabled={isLoading}
            >
              <Mic size={18} />
            </button>
            
            <input 
              type="text" 
              placeholder={isLoading ? 'Nyaya Copilot is thinking...' : t.askAiPlaceholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chat-input"
              style={{ height: '40px', opacity: isLoading ? 0.7 : 1 }}
              disabled={isLoading}
            />
            
            <button 
              type="submit" 
              className="btn-primary"
              style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center', opacity: isLoading ? 0.5 : 1 }}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
          {isLoading && (
            <div style={{ fontSize: '0.72rem', color: '#6366f1', marginTop: '0.4rem', textAlign: 'center', opacity: 0.8 }}>
              ✨ Nyaya Copilot is generating a legal analysis for you...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
