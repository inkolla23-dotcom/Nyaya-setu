import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { WelcomeScreen } from './views/WelcomeScreen';
import { Navbar } from './components/Navbar';
import { ClientDashboard } from './views/ClientDashboard';
import { AdvocateDashboard } from './views/AdvocateDashboard';
import { AiCopilot } from './views/AiCopilot';
import { AdvocateSearch } from './views/AdvocateSearch';
import { AdvocateProfileView } from './views/AdvocateProfileView';
import { CaseDetailView } from './views/CaseDetailView';
import { DocumentChecker } from './views/DocumentChecker';
import { TrustCenter } from './views/TrustCenter';
import { SuperAdminDashboard } from './views/SuperAdminDashboard';
import { ShieldAlert, ChevronLeft } from 'lucide-react';
import './App.css';

const App: React.FC = () => {
  const { user, isLoaded } = useAuth();
  const { language } = useLanguage();
  const [view, setRawView] = useState<string>('welcome');
  const [historyStack, setHistoryStack] = useState<string[]>([]);

  // Shared Navigation Parameters
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState<number | null>(null);
  const [selectedDocAnalysis, setSelectedDocAnalysis] = useState<any | null>(null);
  const [selectedAiCategory, setSelectedAiCategory] = useState<string>('');
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');

  // Wrapped setView that tracks navigation history
  const setView = (newView: string) => {
    setRawView(current => {
      if (current !== newView) {
        setHistoryStack(prev => {
          // Don't push duplicate consecutive entries
          if (prev.length > 0 && prev[prev.length - 1] === current) return prev;
          return [...prev, current];
        });
      }
      return newView;
    });
  };

  // Go back to previous view, or fallback to role dashboard
  const goBack = () => {
    setHistoryStack(prev => {
      const copy = [...prev];
      const prevView = copy.pop();
      if (prevView) {
        setRawView(prevView);
        return copy;
      }
      // No history — go to appropriate dashboard
      if (user) {
        if (user.role === 'advocate') setRawView('advocate_dashboard');
        else if (user.role === 'verification_officer') setRawView('trust_center');
        else if (user.role === 'super_admin') setRawView('super_admin_dashboard');
        else setRawView('client_dashboard');
      } else {
        setRawView('welcome');
      }
      return prev;
    });
  };

  // Handle route switching based on login/role changes
  useEffect(() => {
    const path = window.location.pathname;

    // Check path permissions first
    if (path === '/verification' || path === '/admin') {
      if (!user) {
        window.history.pushState({}, '', '/verification-login');
        setView('officer_login');
        return;
      }
      if (user.role !== 'verification_officer') {
        setView('access_denied');
        return;
      }
      setView('trust_center');
      return;
    }

    if (path === '/verification-login') {
      if (user && user.role === 'verification_officer') {
        window.history.pushState({}, '', '/verification');
        setView('trust_center');
        return;
      }
      setView('officer_login');
      return;
    }

    if (user) {
      if (user.role === 'advocate') {
        setView('advocate_dashboard');
      } else if (user.role === 'verification_officer') {
        setView('trust_center');
      } else if (user.role === 'super_admin') {
        setView('super_admin_dashboard');
      } else {
        setView('client_dashboard');
      }
    } else {
      setView('welcome');
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton skeleton-rect" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#4f46e5' }}>Loading Nyaya Setu...</h3>
        </div>
      </div>
    );
  }

  // Access Denied / Access Protection Views
  if (view === 'officer_login') {
    return (
      <WelcomeScreen 
        setView={setView} 
        initialStep="login" 
        initialEmail="ndhivija3@gmail.com" 
        portalTitle="Nyaya Setu Verification Portal" 
        portalSubtitle="Authorized Verification Officers Only"
      />
    );
  }

  if (view === 'access_denied') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc' }}>
        <div className="glass-card-no-hover" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', textAlign: 'center', border: '1px solid #fee2e2', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', color: '#ef4444' }}>
            <ShieldAlert size={56} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#991b1b', marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '2rem' }}>
            You are not authorized to access the Verification Portal.
          </p>
          <button className="btn-primary" onClick={() => { window.history.pushState({}, '', '/'); setView(user ? (user.role === 'advocate' ? 'advocate_dashboard' : 'client_dashboard') : 'welcome'); }} style={{ width: '100%', justifyContent: 'center' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render Welcome Page if not logged in
  if ((!user || view === 'welcome') && view !== 'trust_center') {
    return <WelcomeScreen setView={setView} />;
  }

  // Render Inner views
  const renderViewContent = () => {
    switch (view) {
      case 'client_dashboard':
        return (
          <ClientDashboard 
            setView={setView} 
            setSelectedCaseId={setSelectedCaseId} 
            setInitialSearchQuery={setInitialSearchQuery}
          />
        );
      case 'advocate_dashboard':
        return (
          <AdvocateDashboard 
            setView={setView} 
            setSelectedCaseId={setSelectedCaseId} 
          />
        );
      case 'ai_copilot':
        return (
          <AiCopilot 
            setView={setView} 
            initialSearchQuery={initialSearchQuery} 
            setInitialSearchQuery={setInitialSearchQuery}
            setSelectedAiCategory={setSelectedAiCategory}
            setSelectedAdvocateId={setSelectedAdvocateId}
          />
        );
      case 'advocate_search':
        return (
          <AdvocateSearch 
            setView={setView} 
            setSelectedAdvocateId={setSelectedAdvocateId}
            initialCategory={selectedAiCategory}
            setInitialCategory={setSelectedAiCategory}
          />
        );
      case 'advocate_profile':
        return (
          <AdvocateProfileView 
            setView={setView} 
            advocateId={selectedAdvocateId || 1} 
          />
        );
      case 'case_details':
        return (
          <CaseDetailView 
            setView={setView} 
            caseId={selectedCaseId || 1} 
            setSelectedDocAnalysis={setSelectedDocAnalysis}
          />
        );
      case 'document_checker':
        return (
          <DocumentChecker 
            setView={setView} 
            selectedDocAnalysis={selectedDocAnalysis} 
            setSelectedDocAnalysis={setSelectedDocAnalysis}
            caseId={selectedCaseId}
          />
        );
      case 'trust_center':
        return (
          <TrustCenter 
            setView={setView} 
          />
        );
      case 'super_admin_dashboard':
        return (
          <SuperAdminDashboard 
            setView={setView} 
          />
        );
      default:
        return (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>404 - View Not Found</h2>
            <button className="btn-primary" onClick={() => setView(user?.role === 'advocate' ? 'advocate_dashboard' : 'client_dashboard')}>
              Go Home
            </button>
          </div>
        );
    }
  };

  // Universal back button — shown on all views except welcome/access screens
  const showBackButton = !['welcome', 'officer_login', 'access_denied'].includes(view);

  return (
    <div className={`app-container theme-lavender`}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Navbar currentView={view} setView={setView} />
        {showBackButton && (
          <div className="back-button-bar">
            <button onClick={goBack} className="btn-back">
              <ChevronLeft size={16} />
              Back
            </button>
          </div>
        )}
        {renderViewContent()}
      </div>
    </div>
  );
};

export default App;
