import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { ChevronLeft, Users, ShieldAlert, BarChart3, Settings, Terminal, Activity, Trash2, ShieldCheck, Database } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface SuperAdminDashboardProps {
  setView: (view: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ setView }) => {
  const { logout, demoMode, token } = useAuth();
  const { language } = useLanguage();
  const { advocates } = useData();

  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'settings' | 'logs'>('users');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<any[]>([]);

  // Local storage mock lists for Super Admin Demo Mode
  const defaultMockUsers: any[] = [];

  const defaultMockLogs = [
    { timestamp: new Date(Date.now() - 50000).toISOString(), event: "JWT Authentication login success", user: "admin@nyayasetu.in", level: "info" },
    { timestamp: new Date(Date.now() - 120000).toISOString(), event: "OCR Scanning Enrollment certificate", user: "aditi@example.com", level: "info" },
    { timestamp: new Date(Date.now() - 250000).toISOString(), event: "Consultation booked transactional commit", user: "ramesh@example.com", level: "success" },
    { timestamp: new Date(Date.now() - 400000).toISOString(), event: "ALTER TABLE users upgrade command", user: "SYSTEM", level: "warning" },
    { timestamp: new Date(Date.now() - 600000).toISOString(), event: "MySQL Connection pool initialized", user: "SYSTEM", level: "success" }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      } else {
        setUsersList([]);
      }
      setSelectedLogs(defaultMockLogs);

      const auditRes = await fetch(`${API_URL}/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }

      const apptRes = await fetch(`${API_URL}/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointmentsList(apptData);
      }
    } catch (e) {
      console.error(e);
      setUsersList([]);
      setSelectedLogs(defaultMockLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this user from Nyaya Setu database?")) return;
    try {
      const response = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("User record deleted successfully from database.");
        await loadData();
      } else {
        alert("Failed to delete user record");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting user record");
    }
  };

  return (
    <div className="main-content" style={{ background: '#fafbfc' }}>
      
      {/* Breadcrumbs Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '0.4rem' }}>
          <span>Super Admin Console</span>
          <span>/</span>
          <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>Dashboard</span>
        </div>
        <button className="btn-secondary" onClick={() => logout()}>
          Exit Console (Log Out)
        </button>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.75px', margin: 0 }}>
          Super Admin Dashboard
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Monitor system logs, manage active directories, review analytics, and toggle underlying configuration keys.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total User Directory</span>
          <strong style={{ fontSize: '1.75rem', color: '#0f172a', display: 'block', marginTop: '0.2rem' }}>{usersList.length || 12} Profiles</strong>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Active Copilot Sessions</span>
          <strong style={{ fontSize: '1.75rem', color: '#6366f1', display: 'block', marginTop: '0.2rem' }}>148 Sessions</strong>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Consultations Processed</span>
          <strong style={{ fontSize: '1.75rem', color: '#059669', display: 'block', marginTop: '0.2rem' }}>32 Bookings</strong>
        </div>
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Database Connections</span>
          <strong style={{ fontSize: '1.75rem', color: '#0ea5e9', display: 'block', marginTop: '0.2rem' }}>Active Pool ✓</strong>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ padding: '0.75rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'users' ? '2px solid #4f46e5' : 'none', color: activeTab === 'users' ? '#4f46e5' : '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Users size={16} /> Directory Accounts
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={{ padding: '0.75rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'analytics' ? '2px solid #4f46e5' : 'none', color: activeTab === 'analytics' ? '#4f46e5' : '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <BarChart3 size={16} /> Analytics metrics
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ padding: '0.75rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'settings' ? '2px solid #4f46e5' : 'none', color: activeTab === 'settings' ? '#4f46e5' : '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Settings size={16} /> Platform Settings
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ padding: '0.75rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'logs' ? '2px solid #4f46e5' : 'none', color: activeTab === 'logs' ? '#4f46e5' : '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Terminal size={16} /> System Logs
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'users' && (
        <div className="glass-card-no-hover" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>Active User Accounts Directory</h4>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Name</th>
                <th style={{ padding: '0.75rem' }}>Email</th>
                <th style={{ padding: '0.75rem' }}>Phone</th>
                <th style={{ padding: '0.75rem' }}>Registered Role</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((usr) => (
                <tr key={usr.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{usr.name}</td>
                  <td style={{ padding: '0.75rem' }}>{usr.email}</td>
                  <td style={{ padding: '0.75rem' }}>{usr.phone || 'n/a'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: usr.role === 'super_admin' ? '#fee2e2' : usr.role === 'verification_officer' ? '#dcfce7' : usr.role === 'advocate' ? '#e0e7ff' : '#f1f5f9',
                      color: usr.role === 'super_admin' ? '#991b1b' : usr.role === 'verification_officer' ? '#166534' : usr.role === 'advocate' ? '#3730a3' : '#475569',
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '6px',
                      fontWeight: 'bold' 
                    }}>
                      {usr.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDeleteUser(usr.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card-no-hover" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>AI Copilot Usage breakdown</h4>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '1rem', borderBottom: '1px solid #cbd5e1' }}>
                <div style={{ width: '30px', height: '60%', background: '#8b5cf6', borderRadius: '4px 4px 0 0' }} title="English: 60%"></div>
                <div style={{ width: '30px', height: '25%', background: '#6366f1', borderRadius: '4px 4px 0 0' }} title="Hindi: 25%"></div>
                <div style={{ width: '30px', height: '15%', background: '#10b981', borderRadius: '4px 4px 0 0' }} title="Telugu: 15%"></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem', marginTop: '0.5rem', color: '#64748b' }}>
                <span>English (60%)</span>
                <span>Hindi (25%)</span>
                <span>Telugu (15%)</span>
              </div>
            </div>

            <div className="glass-card-no-hover" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>Consultation Specialization share</h4>
              <ul style={{ fontSize: '0.8rem', color: '#334155', listStyle: 'none', padding: 0 }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Family Law disputes</span>
                  <strong>42%</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Property dispute resolutions</span>
                  <strong>28%</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Criminal Defense consults</span>
                  <strong>18%</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                  <span>Other civil matters</span>
                  <strong>12%</strong>
                </li>
              </ul>
            </div>
          </div>

          <div className="glass-card-no-hover" style={{ padding: '1.5rem', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
              🎥 Live Google Meet Consultations ({appointmentsList.length})
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="user-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Client</th>
                    <th style={{ padding: '0.75rem' }}>Advocate</th>
                    <th style={{ padding: '0.75rem' }}>Date & Time</th>
                    <th style={{ padding: '0.75rem' }}>Meeting Link</th>
                    <th style={{ padding: '0.75rem' }}>Meeting Status</th>
                    <th style={{ padding: '0.75rem' }}>Appointment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontStyle: 'italic' }}>
                        No consultations scheduled.
                      </td>
                    </tr>
                  ) : (
                    appointmentsList.map((appt) => (
                      <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem' }}>{appt.client_name}</td>
                        <td style={{ padding: '0.75rem' }}>{appt.advocate_name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          {new Date(appt.appointment_date).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {appt.meeting_link ? (
                            <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: '600' }}>
                              {appt.meeting_link}
                            </a>
                          ) : (
                            <span style={{ color: '#64748b', fontStyle: 'italic' }}>Not Created</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '4px',
                            background: appt.meeting_status === 'CREATED' ? '#d1fae5' : '#f1f5f9',
                            color: appt.meeting_status === 'CREATED' ? '#065f46' : '#475569'
                          }}>
                            {appt.meeting_status || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '4px',
                            background: appt.status === 'completed' ? '#d1fae5' : appt.status === 'scheduled' ? '#dbeafe' : '#fef3c7',
                            color: appt.status === 'completed' ? '#065f46' : appt.status === 'scheduled' ? '#1e40af' : '#92400e'
                          }}>
                            {appt.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="glass-card-no-hover" style={{ padding: '2rem', borderRadius: '16px' }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>Global Platform Configurations</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', display: 'block' }}>OpenAI-compatible Endpoint Toggles</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Route Copilot traffic to internal secure LLM endpoints.</span>
              </div>
              <input type="checkbox" defaultChecked style={{ accentColor: '#4f46e5', width: '38px', height: '20px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', display: 'block' }}>Mandatory Verification Flags</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Prevent newly signed-up advocates from appearing in results until verified.</span>
              </div>
              <input type="checkbox" defaultChecked style={{ accentColor: '#4f46e5', width: '38px', height: '20px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', display: 'block' }}>Automated OCR Document scans</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Process certificates immediately using AI text-extraction at signup.</span>
              </div>
              <input type="checkbox" defaultChecked style={{ accentColor: '#4f46e5', width: '38px', height: '20px' }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card-no-hover" style={{ padding: '1.5rem', borderRadius: '16px', background: '#0f172a', border: '1px solid #1e293b' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Database size={16} /> System Event Transaction logs
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {selectedLogs.map((log, idx) => (
                <div key={idx} style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', borderLeft: log.level === 'warning' ? '3px solid #f59e0b' : log.level === 'success' ? '3px solid #10b981' : '3px solid #3b82f6', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <strong style={{ color: log.level === 'warning' ? '#f59e0b' : '#3b82f6' }}>{log.event}</strong>
                  </div>
                  <span style={{ color: '#94a3b8' }}>User: {log.user}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card-no-hover" style={{ padding: '1.5rem', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📝 Advocate Profile Edit Audit Trails ({auditLogs.length})
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', fontSize: '0.8rem' }}>
              {auditLogs.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                  No profile update history logged yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} style={{ padding: '0.75rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#4f46e5' }}>{log.user_name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ color: '#334155', fontSize: '0.75rem' }}>
                      Changed field: <code style={{ background: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{log.changed_field}</code>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.7rem' }}>
                      <div style={{ color: '#ef4444', textDecoration: 'line-through', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        Old: {log.old_value || 'None'}
                      </div>
                      <div style={{ color: '#10b981', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        New: {log.new_value || 'None'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.25rem', textAlign: 'right' }}>
                      Edited by: <strong>{log.updated_by_name}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
