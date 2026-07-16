import React, { useState } from 'react';
import { useLanguage, Language } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Scale, Globe, ArrowRight, ShieldCheck, UserCheck, Briefcase, ChevronLeft, Upload, Sparkles, Camera, ShieldAlert } from 'lucide-react';

interface WelcomeScreenProps {
  setView: (view: string) => void;
  initialStep?: 'language' | 'role' | 'register' | 'login' | 'success_screen';
  initialEmail?: string;
  portalTitle?: string;
  portalSubtitle?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  setView, 
  initialStep, 
  initialEmail, 
  portalTitle, 
  portalSubtitle 
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { enterDemoMode, login, register } = useAuth();
  
  // Navigation state
  const [step, setStep] = useState<'language' | 'role' | 'register' | 'login' | 'success_screen'>(initialStep || 'language');
  const [selectedRole, setSelectedRole] = useState<'client' | 'advocate'>('client');
  const [successAppId, setSuccessAppId] = useState('');
  
  // Common Form States
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  
  // Client Form States
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  
  // Advocate Form States
  const [barRegistration, setBarRegistration] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([]); // Multiple specializations
  const [experienceYears, setExperienceYears] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>(['English', 'Hindi']);
  const [consultationFee, setConsultationFee] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [biography, setBiography] = useState('');
  
  // Selfie simulation states
  const [liveSelfie, setLiveSelfie] = useState<string | null>(null);
  const [capturingSelfie, setCapturingSelfie] = useState(false);
  const [selfieCountdown, setSelfieCountdown] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP Simulation States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock Upload state feedback indicators
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, boolean>>({});

  const specCategories = [
    { id: 1, name: 'Family Law' },
    { id: 2, name: 'Civil Law' },
    { id: 3, name: 'Criminal Law' },
    { id: 4, name: 'Property Law' },
    { id: 5, name: 'Consumer Law' },
    { id: 6, name: 'Cyber Law' },
    { id: 7, name: 'Labour Law' },
    { id: 8, name: 'Corporate Law' },
    { id: 9, name: 'Tax Law' },
    { id: 10, name: 'Banking Law' },
    { id: 11, name: 'Motor Accident Claims' },
    { id: 12, name: 'Medical Negligence' },
    { id: 13, name: 'Divorce' },
    { id: 14, name: 'Domestic Violence' },
    { id: 15, name: 'Child Custody' },
    { id: 16, name: 'Senior Citizen Law' },
    { id: 17, name: 'Women Protection' },
    { id: 18, name: 'Constitutional Law' },
    { id: 19, name: 'Environmental Law' },
    { id: 20, name: 'Intellectual Property' },
    { id: 21, name: 'Real Estate' },
    { id: 22, name: 'Cheque Bounce (NI Act)' },
    { id: 23, name: 'Land Disputes' },
    { id: 24, name: 'Education Law' },
    { id: 25, name: 'Immigration Law' }
  ];


  const handleSpecToggle = (id: number) => {
    setSelectedSpecs(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingDoc, setUploadingDoc] = useState<Record<string, boolean>>({});
  const [ocrTextExtracts, setOcrTextExtracts] = useState<Record<string, string>>({});
  const [ocrComplete, setOcrComplete] = useState<Record<string, boolean>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(prev => ({ ...prev, [docKey]: true }));
    setUploadProgress(prev => ({ ...prev, [docKey]: 0 }));
    setOcrComplete(prev => ({ ...prev, [docKey]: false }));
    setUploadedFiles(prev => ({ ...prev, [docKey]: false }));

    let prog = 0;
    const interval = setInterval(() => {
      prog += 25;
      setUploadProgress(prev => ({ ...prev, [docKey]: prog }));
      if (prog >= 100) {
        clearInterval(interval);
        setUploadingDoc(prev => ({ ...prev, [docKey]: false }));
        setUploadedFiles(prev => ({ ...prev, [docKey]: true }));
        
        setTimeout(() => {
          let extracted = '';
          if (docKey === 'enrollment') {
            extracted = `BAR COUNCIL REGISTERED\nEnrollment No: ${barRegistration || 'BAR/DEL/2012/987'}\nName: ${name || 'Advocate Applicant'}\nClearance: Authentic`;
          } else if (docKey === 'id') {
            extracted = `BAR ASSOCIATION MEMBERSHIP\nName: ${name || 'Advocate Applicant'}\nMembership status: ACTIVE`;
          } else if (docKey === 'gov') {
            extracted = `GOVERNMENT OF INDIA\nAadhaar Card No: XXXX-XXXX-4982\nName: ${name || 'Advocate Applicant'}`;
          } else {
            extracted = `CERTIFICATE OF PRACTICE\nStatus: Issued by Bar Council of India`;
          }
          setOcrTextExtracts(prev => ({ ...prev, [docKey]: extracted }));
          setOcrComplete(prev => ({ ...prev, [docKey]: true }));
        }, 1000);
      }
    }, 200);
  };

  const startSelfieCapture = async () => {
    setError('');
    setLiveSelfie(null);
    setCapturingSelfie(true);
    setSelfieCountdown(null);
    
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoEl = document.getElementById('selfieWebcamVideo') as HTMLVideoElement;
        if (videoEl) {
          videoEl.srcObject = stream;
        }
        (window as any).localWebcamStream = stream;
      } catch (err) {
        console.error(err);
        setError('Camera permission denied or camera device busy. Using fallback portrait snapshot.');
        setLiveSelfie('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
        setCapturingSelfie(false);
      }
    }, 200);
  };

  const captureSelfieSnapshot = () => {
    const videoEl = document.getElementById('selfieWebcamVideo') as HTMLVideoElement;
    if (videoEl) {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setLiveSelfie(dataUrl);
      }
      
      const stream = (window as any).localWebcamStream;
      if (stream) {
        stream.getTracks().forEach((track: any) => track.stop());
      }
      setCapturingSelfie(false);
    }
  };

  const cancelSelfieCapture = () => {
    const stream = (window as any).localWebcamStream;
    if (stream) {
      stream.getTracks().forEach((track: any) => track.stop());
    }
    setCapturingSelfie(false);
  };

  const handleRegisterClick = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (selectedRole === 'advocate') {
      if (selectedSpecs.length === 0) {
        setError('Please select at least one Practice Area.');
        return;
      }
      if (!liveSelfie) {
        setError('Please take a Live Selfie snapshot for identity verification.');
        return;
      }
      if (!uploadedFiles['enrollment'] || !uploadedFiles['id'] || !uploadedFiles['gov']) {
        setError('Please upload the required verification certificates.');
        return;
      }
    }

    // Build payload to save in pending state
    let payload: any = {};
    if (selectedRole === 'client') {
      payload = {
        name,
        email,
        password,
        role: 'client',
        phone,
        state,
        district,
        city,
        languagePreference: preferredLanguage
      };
    } else {
      payload = {
        name,
        email,
        password,
        role: 'advocate',
        phone,
        state,
        district,
        city,
        languages: JSON.stringify(languagesSpoken),
        experienceYears: parseInt(experienceYears) || 0,
        specializationId: selectedSpecs[0] || null, // fallback
        specializationIds: selectedSpecs, // array
        specializationName: specCategories.find(s => s.id === selectedSpecs[0])?.name || null,
        specializationNames: selectedSpecs.map(id => specCategories.find(s => s.id === id)?.name).filter(Boolean),
        consultationFee: parseFloat(consultationFee) || 0.00,
        officeAddress,
        biography,
        barRegistration,
        profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        liveSelfie,
        enrollmentCertificate: 'uploads/bar_cert_' + Date.now() + '.pdf',
        idCard: 'uploads/bar_id_' + Date.now() + '.jpg',
        govId: 'uploads/gov_id_' + Date.now() + '.jpg',
        practiceCertificate: uploadedFiles['practice'] ? 'uploads/practice_cert_' + Date.now() + '.pdf' : null
      };
    }

    setPendingPayload(payload);
    setOtpError('');
    setEmailOtp('');
    setMobileOtp('');
    setShowOtpModal(true); // Open OTP Verification Overlay
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    
    // Check simulated OTP code (123456 or 999999)
    if (emailOtp !== '123456' || mobileOtp !== '123456') {
      setOtpError('Invalid verification OTP code. Use "123456" for demo simulation.');
      return;
    }

    setLoading(true);
    setShowOtpModal(false);
    try {
      const resData = await register(pendingPayload);
      if (pendingPayload.role === 'advocate') {
        setSuccessAppId(resData.applicationId || 'NS-ADV-9999');
        setStep('success_screen');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'client' | 'advocate' | 'verification_officer' | 'super_admin') => {
    if (role === 'client') {
      setEmail('ramesh@example.com');
      setPassword('password123');
    } else if (role === 'advocate') {
      setEmail('aditi@example.com');
      setPassword('password123');
    } else if (role === 'verification_officer') {
      setEmail('ndhivija3@gmail.com');
      setPassword('ndhivijia@2038');
    } else if (role === 'super_admin') {
      setEmail('admin@nyayasetu.in');
      setPassword('password123');
    }
  };

  return (
    <div className="welcome-screen">
      {/* Floating Header with Demo Access */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100, display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', padding: '0.4rem 0.8rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', marginRight: '0.2rem' }}>⚡ DEMO PORTAL:</span>
        <button 
          className="btn-glass" 
          onClick={() => enterDemoMode('client')}
          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: '#1e293b' }}
        >
          👤 Client
        </button>
        <button 
          className="btn-glass" 
          onClick={() => enterDemoMode('advocate')}
          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: '#4f46e5' }}
        >
          🎓 Advocate
        </button>
        <button 
          className="btn-glass" 
          onClick={() => enterDemoMode('verification_officer')}
          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: '#059669' }}
        >
          🛡️ Officer
        </button>
        <button 
          className="btn-glass" 
          onClick={() => enterDemoMode('super_admin')}
          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: '#dc2626' }}
        >
          ⚙️ Admin
        </button>
      </div>

      <div className="welcome-card glass-card-no-hover">
        {step !== 'language' && (
          <button 
            className="btn-glass" 
            onClick={() => {
              setError('');
              if (step === 'role') setStep('language');
              else if (step === 'register' || step === 'login') setStep('role');
            }} 
            style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', padding: '0.4rem 0.6rem' }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#6366f1' }}>
          <Scale size={42} className="upload-icon-pulse" />
        </div>
        
        <h1 className="welcome-logo gradient-text" style={{ fontSize: '2.25rem' }}>{t.appName}</h1>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1.5rem', fontWeight: '500' }}>{t.tagline}</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {/* STEP 1: Language selection */}
        {step === 'language' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <Globe size={16} /> {t.selectLanguage}
            </h3>
            <div className="lang-grid" style={{ marginBottom: '2rem' }}>
              <div className={`lang-card ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>
                <h3>English</h3>
                <p>Simple Legal Help</p>
              </div>
              <div className={`lang-card ${language === 'te' ? 'active' : ''}`} onClick={() => setLanguage('te')}>
                <h3>తెలుగు</h3>
                <p>సులభంగా చట్టసహాయం</p>
              </div>
              <div className={`lang-card ${language === 'hi' ? 'active' : ''}`} onClick={() => setLanguage('hi')}>
                <h3>हिन्दी</h3>
                <p>सरल कानूनी मदद</p>
              </div>
            </div>

            <button className="btn-primary" onClick={() => setStep('role')} style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
              {t.continue} <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: Choose Role (Client vs Advocate) */}
        {step === 'role' && (
          <div>
            <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '1rem' }}>
              Select Your Access Profile
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div 
                className={`glass-card ${selectedRole === 'client' ? 'active-role' : ''}`}
                onClick={() => setSelectedRole('client')}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: selectedRole === 'client' ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.08)',
                  background: selectedRole === 'client' ? '#f5f3ff' : 'white',
                  padding: '1rem 1.25rem'
                }}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: selectedRole === 'client' ? '#4f46e5' : '#0f172a', fontSize: '1.05rem' }}>
                  👤 {t.clientRole}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2' }}>{t.clientDesc}</p>
              </div>

              <div 
                className={`glass-card ${selectedRole === 'advocate' ? 'active-role' : ''}`}
                onClick={() => setSelectedRole('advocate')}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: selectedRole === 'advocate' ? '2px solid #6366f1' : '1px solid rgba(0,0,0,0.08)',
                  background: selectedRole === 'advocate' ? '#f5f3ff' : 'white',
                  padding: '1rem 1.25rem'
                }}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: selectedRole === 'advocate' ? '#4f46e5' : '#0f172a', fontSize: '1.05rem' }}>
                  🎓 {t.advocateRole}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2' }}>{t.advocateDesc}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn-primary" onClick={() => setStep('register')} style={{ width: '100%', justifyContent: 'center' }}>
                Create New Account
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setStep('login');
                  fillDemoCredentials(selectedRole);
                }} 
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Sign In with Password
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Register Form */}
        {step === 'register' && (
          <form onSubmit={handleRegisterClick} style={{ textAlign: 'left', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: '#1e293b', textAlign: 'center', fontWeight: 'bold' }}>
              {selectedRole === 'advocate' ? 'Advocate Registration' : 'Client Registration'}
            </h3>

            {/* General Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Full Name</label>
                <input type="text" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ramesh Kumar" />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Email Address</label>
                <input type="email" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ramesh@example.com" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Password</label>
                <input type="password" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Confirm Password</label>
                <input type="password" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Phone Number</label>
                <input type="text" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="9876543210" />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>State</label>
                <input type="text" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={state} onChange={(e) => setState(e.target.value)} required placeholder="Delhi" />
              </div>
            </div>

            {/* Location Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>District</label>
                <input type="text" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={district} onChange={(e) => setDistrict(e.target.value)} required placeholder="New Delhi" />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>City</label>
                <input type="text" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Connaught Place" />
              </div>
            </div>

            {/* CLIENT ONLY FIELDS */}
            {selectedRole === 'client' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Preferred Communication Language</label>
                <select className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
                  <option value="en">English</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>
            )}

            {/* ADVOCATE ONLY FIELDS */}
            {selectedRole === 'advocate' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Bar Registration No.</label>
                    <input type="text" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={barRegistration} onChange={(e) => setBarRegistration(e.target.value)} required placeholder="BAR/DEL/2012/987" />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Years of Experience</label>
                    <input type="number" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} required placeholder="12" />
                  </div>
                </div>

                {/* Multiple Specializations Selection checkboxes */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem', display: 'block' }}>Practice Specialization Areas (Select Multiple)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {specCategories.map(spec => (
                      <label 
                        key={spec.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.4rem', 
                          fontSize: '0.75rem', 
                          cursor: 'pointer',
                          background: selectedSpecs.includes(spec.id) ? '#f5f3ff' : 'white',
                          border: selectedSpecs.includes(spec.id) ? '1px solid #6366f1' : '1px solid #cbd5e1',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '8px'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedSpecs.includes(spec.id)} 
                          onChange={() => handleSpecToggle(spec.id)} 
                          style={{ accentColor: '#6366f1' }}
                        />
                        {spec.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Consultation Fee (₹)</label>
                  <input type="number" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} required placeholder="1500" />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Languages Spoken</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '0.5rem',
                    marginTop: '0.25rem',
                    maxHeight: '130px',
                    overflowY: 'auto',
                    padding: '0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: 'white'
                  }}>
                    {['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Punjabi', 'Bengali', 'Odia', 'Urdu', 'Assamese'].map(lang => {
                      const isSelected = languagesSpoken.includes(lang);
                      return (
                        <label key={lang} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : '#fff',
                          border: isSelected ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                          padding: '0.25rem 0.4rem',
                          borderRadius: '6px',
                          transition: 'all 0.2s',
                          userSelect: 'none'
                        }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setLanguagesSpoken(prev =>
                                prev.includes(lang) ? prev.filter(x => x !== lang) : [...prev, lang]
                              );
                            }}
                            style={{ accentColor: '#4f46e5' }}
                          />
                          {lang}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Office Location Address</label>
                  <input type="text" className="chat-input" style={{ width: '100%', padding: '0.6rem' }} value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="Chamber 402, High Court, New Delhi" required />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Professional Biography</label>
                  <textarea className="chat-input" style={{ width: '100%', height: '60px', padding: '0.6rem', resize: 'none' }} value={biography} onChange={(e) => setBiography(e.target.value)} placeholder="Briefly describe your legal career details..." required />
                </div>

                {/* Selfie capture card */}
                <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', background: '#f8fafc' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#1e293b' }}>
                    <Camera size={14} /> Live Identity Verification Selfie
                  </label>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.75rem' }}>Stream your camera to capture an identity match snapshot.</p>
                  
                  {liveSelfie ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #10b981' }}>
                        <img src={liveSelfie} alt="Selfie preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '800', display: 'block' }}>Selfie Captured ✓</span>
                        <button type="button" onClick={startSelfieCapture} className="btn-glass" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#6366f1', marginTop: '0.2rem' }}>Retake Capture</button>
                      </div>
                    </div>
                  ) : capturingSelfie ? (
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#000', borderRadius: '8px' }}>
                      <video id="selfieWebcamVideo" autoPlay playsInline style={{ width: '100%', maxHeight: '180px', borderRadius: '6px', background: '#1e293b' }}></video>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                        <button type="button" onClick={captureSelfieSnapshot} className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: '#10b981', borderColor: '#10b981' }}>Capture Frame</button>
                        <button type="button" onClick={cancelSelfieCapture} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: 'white', background: '#ef4444', borderColor: '#ef4444' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={startSelfieCapture} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}>
                      <Camera size={12} /> Start Browser Webcam Stream
                    </button>
                  )}
                </div>

                {/* Document Verification uploads section */}
                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                  Verification Certificate Copies Upload
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { key: 'enrollment', label: 'Enrollment Certificate *' },
                    { key: 'id', label: 'Advocate Identity Card *' },
                    { key: 'gov', label: 'Government Photo ID *' },
                    { key: 'practice', label: 'Practice Certificate' }
                  ].map(doc => (
                    <div key={doc.key} className="upload-container" style={{ padding: '0.75rem', border: '1px dashed #cbd5e1', borderRadius: '10px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' }}>{doc.label}</span>
                        {uploadedFiles[doc.key] && <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 'bold' }}>Uploaded successfully ✓</span>}
                      </div>

                      {uploadingDoc[doc.key] ? (
                        <div>
                          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${uploadProgress[doc.key] || 0}%`, height: '100%', background: '#6366f1', transition: 'width 0.2s' }}></div>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>Uploading: {uploadProgress[doc.key] || 0}%</span>
                        </div>
                      ) : uploadedFiles[doc.key] ? (
                        <div>
                          {ocrComplete[doc.key] ? (
                            <div style={{ background: '#f1f5f9', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                              <strong>✨ OCR Text Extracted:</strong><br />
                              {ocrTextExtracts[doc.key]}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: '#4f46e5', fontWeight: '600' }}>OCR Scanning in progress...</span>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input 
                            type="file" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            id={`file-input-${doc.key}`}
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileChange(e, doc.key)}
                          />
                          <button 
                            type="button" 
                            onClick={() => document.getElementById(`file-input-${doc.key}`)?.click()} 
                            className="btn-secondary" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Upload size={10} /> Choose File & Scan
                          </button>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>No file selected (PDF, PNG, JPG)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
              {loading ? 'Submitting Registration...' : 'Complete Profile Setup'}
            </button>
          </form>
        )}
        {/* STEP 5: Success Screen */}
        {step === 'success_screen' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#10b981' }}>
              <ShieldCheck size={52} className="upload-icon-pulse" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
              ✅ Registration Successful
            </h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your advocate profile has been submitted.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Verification Status</span>
                <span style={{ fontWeight: 'bold', color: '#b45309', background: '#fffbeb', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>Pending</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Estimated Review</span>
                <span style={{ fontWeight: 'bold', color: '#334155' }}>1–2 Business Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b' }}>Application ID</span>
                <span style={{ fontWeight: 'bold', color: '#4f46e5', fontFamily: 'monospace' }}>{successAppId}</span>
              </div>
            </div>

            <button 
              className="btn-primary" 
              onClick={() => {
                setStep('login');
                fillDemoCredentials('advocate');
              }} 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        {/* STEP 4: Login Form */}
        {step === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.25rem', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.25rem' }}>
              {portalTitle || 'Sign In to Your Account'}
            </h3>
            {portalSubtitle && (
              <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '1.25rem', fontWeight: '500' }}>
                {portalSubtitle}
              </p>
            )}
            {!portalSubtitle && <div style={{ marginBottom: '1.25rem' }} />}

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="chat-input"
                style={{ width: '100%', padding: '0.75rem' }} 
                required 
                placeholder="email@example.com"
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="chat-input"
                  style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem' }} 
                  required 
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: '#475569' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#4f46e5' }}
                />
                Remember Me
              </label>
              <button
                type="button"
                onClick={() => alert("Prototype forgot password: Reset link sent to your registered email.")}
                style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '600', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                {loading ? 'Authenticating...' : 'Verify & Log In'}
              </button>

              {portalSubtitle && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    window.history.pushState({}, '', '/');
                    setView('welcome');
                    setStep('language');
                  }} 
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                >
                  Back to Home
                </button>
              )}
              
              {!portalSubtitle && (
                <>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <button type="button" className="btn-secondary" onClick={() => fillDemoCredentials('client')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', justifyContent: 'center' }}>
                      Demo Client
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => fillDemoCredentials('advocate')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', justifyContent: 'center' }}>
                      Demo Advocate
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => fillDemoCredentials('verification_officer')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', justifyContent: 'center' }}>
                      Demo Officer
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => fillDemoCredentials('super_admin')} style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', justifyContent: 'center' }}>
                      Demo Admin
                    </button>
                  </div>

                  <button type="button" className="btn-glass" onClick={() => setStep('role')} style={{ width: '100%', color: '#64748b', fontSize: '0.8rem', border: 'none' }}>
                    Need an account? Register instead
                  </button>
                </>
              )}
            </div>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.8rem', fontWeight: '600' }}>
          <ShieldCheck size={14} /> Encrypted Session Authentication
        </div>
      </div>

      {/* --- OTP VERIFICATION MODAL OVERLAY --- */}
      {showOtpModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowOtpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#6366f1', marginBottom: '0.5rem' }}>
              🛡️ OTP Account Verification
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
              We have dispatched security codes to verify your email and mobile registrations.
            </p>

            {otpError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '0.6rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '1rem', textAlign: 'left' }}>
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Email OTP code (sent to {email})</label>
                <input 
                  type="text" 
                  value={emailOtp} 
                  onChange={(e) => setEmailOtp(e.target.value)} 
                  className="chat-input" 
                  style={{ width: '100%', padding: '0.6rem', textAlign: 'center', letterSpacing: '4px', fontSize: '1.1rem' }} 
                  placeholder="xxxxxx"
                  required 
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Mobile OTP code (sent to {phone})</label>
                <input 
                  type="text" 
                  value={mobileOtp} 
                  onChange={(e) => setMobileOtp(e.target.value)} 
                  className="chat-input" 
                  style={{ width: '100%', padding: '0.6rem', textAlign: 'center', letterSpacing: '4px', fontSize: '1.1rem' }} 
                  placeholder="xxxxxx"
                  required 
                />
              </div>

              <div style={{ background: '#e0f2fe', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.7rem', color: '#0369a1', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                🔑 Demo Verification Code: Use "123456" for both inputs to activate.
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Verify & Activate Account
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
