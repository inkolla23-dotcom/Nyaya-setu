import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { Scale, LogOut, Globe, Shuffle, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const { user, logout, demoMode, switchDemoRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  const handleDemoSwitch = () => {
    switchDemoRole();
    setView(user?.role === 'client' ? 'advocate_dashboard' : 'client_dashboard');
  };

  return (
    <header className="nav-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setView(user?.role === 'client' ? 'client_dashboard' : 'advocate_dashboard')}>
        <Scale size={28} style={{ color: '#4f46e5' }} />
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '-0.5px' }} className="gradient-text">
          {t.appName}
        </span>
        {demoMode && (
          <span className="demo-mode-badge">
            ⚠️ Demo Mode
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {demoMode && (
              <button 
                onClick={handleDemoSwitch}
                className="btn-glass"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem',
                  color: '#d97706',
                  borderColor: '#fcd34d',
                  padding: '0.4rem 0.8rem'
                }}
              >
                <Shuffle size={14} />
                Switch Role ({user?.role})
              </button>
            )}
            {user?.role === 'verification_officer' && (
              <button 
                onClick={() => setView('trust_center')}
                className="btn-glass"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem',
                  color: '#059669',
                  borderColor: '#a7f3d0',
                  padding: '0.4rem 0.8rem'
                }}
              >
                🛡️ Verification Portal
              </button>
            )}
            {user?.role === 'super_admin' && (
              <button 
                onClick={() => setView('super_admin_dashboard')}
                className="btn-glass"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem',
                  color: '#dc2626',
                  borderColor: '#fecaca',
                  padding: '0.4rem 0.8rem'
                }}
              >
                ⚙️ Admin Console
              </button>
            )}
          </div>

        {/* User Info Greeting */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: user.role === 'advocate' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e2e8f0',
              color: user.role === 'advocate' ? 'white' : '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {user.role === 'advocate' ? '🎓' : '👤'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>{user.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
                {user.role === 'super_admin' ? 'Super Admin' : 
                 user.role === 'verification_officer' ? 'Verification Officer' : 
                 user.role === 'advocate' ? 'Advocate Profile' : 'Citizen Client'}
              </span>
            </div>
          </div>
        )}

        {/* Global Language Toggle Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <Globe size={14} style={{ color: '#64748b' }} />
          <select 
            value={language} 
            onChange={handleLanguageChange} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '0.8rem', 
              fontWeight: '600', 
              color: '#475569', 
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        {/* Logout Button */}
        <button 
          onClick={logout} 
          className="btn-glass" 
          style={{ 
            color: '#ef4444', 
            borderColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem'
          }}
        >
          <LogOut size={14} />
          {t.logout}
        </button>
      </div>
    </header>
  );
};
