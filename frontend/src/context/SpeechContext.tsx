import React, { createContext, useContext, useState } from 'react';
import { useLanguage } from './LanguageContext';

interface SpeechContextType {
  isRecording: boolean;
  showSpeechModal: boolean;
  simulatedTranscript: string;
  triggerVoiceInput: (callback: (text: string) => void) => void;
  closeVoiceModal: () => void;
  startRecording: () => void;
  stopRecording: (text: string) => void;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export const SpeechProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showSpeechModal, setShowSpeechModal] = useState<boolean>(false);
  const [simulatedTranscript, setSimulatedTranscript] = useState<string>('');
  const [currentCallback, setCurrentCallback] = useState<((text: string) => void) | null>(null);
  const [speechRecognitionInstance, setSpeechRecognitionInstance] = useState<any>(null);

  const voiceSuggestions: Record<string, string[]> = {
    en: [
      "I want a mutual consent divorce and need to know about alimony.",
      "My neighbor has encroached on my boundary land and started building.",
      "A false FIR under section 420 has been filed against me by my business partner.",
      "My company laid me off without paying my 3 months of pending salary."
    ],
    te: [
      "మా ల్యాండ్ సరిహద్దును పక్కింటి వారు ఆక్రమించి ఇల్లు కడుతున్నారు.",
      "మేము పరస్పర అంగీకారంతో విడాకులు తీసుకోవాలనుకుంటున్నాము, భరణం ఎంత వస్తుంది?",
      "నా భాగస్వామి నాపై 420 కింద అబద్ధపు పోలీస్ కేసు పెట్టారు, బెయిల్ ఎలా వస్తుంది?",
      "కంపెనీ నన్ను తీసేసింది, నా 3 నెలల జీతం ఇవ్వడం లేదు."
    ],
    hi: [
      "मेरे पड़ोसी ने मेरी ज़मीन पर कब्ज़ा करके अवैध निर्माण शुरू कर दिया है।",
      "हम आपसी सहमति से तलाक लेना चाहते हैं, गुजारे भत्ते की क्या प्रक्रिया है?",
      "मेरे पार्टनर ने मेरे खिलाफ धोखाधड़ी (420) का झूठा मुकदमा दर्ज कराया है।",
      "कंपनी ने मुझे नौकरी से निकाल दिया और 3 महीने की सैलरी नहीं दी है।"
    ]
  };

  const triggerVoiceInput = (callback: (text: string) => void) => {
    setCurrentCallback(() => callback);
    setShowSpeechModal(true);
    setIsRecording(true);
    setSimulatedTranscript('');

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Select locale language
      const localeMap: Record<string, string> = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };
      recognition.lang = localeMap[language] || 'en-IN';

      recognition.onstart = () => {
        setIsRecording(true);
        setSimulatedTranscript("Listening... Please speak now.");
      };

      recognition.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setSimulatedTranscript(speechToText);
        setIsRecording(false);
        setTimeout(() => {
          if (callback) {
            callback(speechToText);
          }
          closeVoiceModal();
        }, 1500);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSimulatedTranscript("Microphone permission blocked. Please enable mic access. Using manual choices:");
        } else {
          setSimulatedTranscript(`Voice capture warning (${event.error}). Loading manual suggestions:`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setSpeechRecognitionInstance(recognition);
      recognition.start();
    } else {
      setIsRecording(false);
      setSimulatedTranscript("Web Speech API is not supported in this browser. Loading manual selection templates:");
    }
  };

  const closeVoiceModal = () => {
    if (speechRecognitionInstance) {
      try {
        speechRecognitionInstance.abort();
      } catch (e) {}
    }
    setShowSpeechModal(false);
    setIsRecording(false);
    setSimulatedTranscript('');
    setCurrentCallback(null);
    setSpeechRecognitionInstance(null);
  };

  const startRecording = () => {
    setIsRecording(true);
    setSimulatedTranscript('');
  };

  const stopRecording = (selectedText: string) => {
    setIsRecording(false);
    
    // Fallback simulation: typing out suggestions
    let currentText = '';
    const words = selectedText.split(' ');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < words.length) {
        currentText += (index === 0 ? '' : ' ') + words[index];
        setSimulatedTranscript(currentText);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (currentCallback) {
            currentCallback(selectedText);
          }
          closeVoiceModal();
        }, 1000);
      }
    }, 120);
  };

  return (
    <SpeechContext.Provider value={{
      isRecording,
      showSpeechModal,
      simulatedTranscript,
      triggerVoiceInput,
      closeVoiceModal,
      startRecording,
      stopRecording
    }}>
      {children}
      
      {/* Speech Simulation UI Overlay */}
      {showSpeechModal && (
        <div className="modal-overlay" onClick={closeVoiceModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }} className="gradient-text">
              {language === 'te' ? 'వాయిస్ సహాయకుడు' : language === 'hi' ? 'आवाज सहायक' : 'Voice Assistant'}
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
              <div className={`voice-btn-pulse ${isRecording ? 'voice-recording-pulse' : ''}`} style={{ width: '80px', height: '80px' }}>
                <span style={{ fontSize: '1.75rem' }}>🎙️</span>
              </div>
            </div>
            
            {isRecording ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {language === 'te' ? 'సిస్టమ్ వింటోంది... దయచేసి మాట్లాడండి లేదా ఎంచుకోండి:' : 
                 language === 'hi' ? 'सिस्टम सुन रहा है... कृपया बोलें या नीचे से चुनें:' : 
                 'Listening... Speak into your microphone or choose a template below:'}
              </p>
            ) : (
              <p style={{ color: '#059669', fontWeight: '600', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                {language === 'te' ? 'సందేశం తయారైంది!' : language === 'hi' ? 'आवाज़ रिकॉर्ड हो गई!' : 'Voice Captured successfully!'}
              </p>
            )}
            
            {simulatedTranscript && (
              <div style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                textAlign: 'left',
                minHeight: '60px',
                fontSize: '0.9rem',
                fontWeight: '500',
                lineHeight: 1.4
              }}>
                "{simulatedTranscript}"
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', maxHeight: '180px', overflowY: 'auto' }}>
              {voiceSuggestions[language]?.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => stopRecording(text)}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  "{text}"
                </button>
              ))}
            </div>
            
            <button
              onClick={closeVoiceModal}
              style={{
                marginTop: '1.5rem',
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {language === 'te' ? 'రద్దు చేయి' : language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
};
