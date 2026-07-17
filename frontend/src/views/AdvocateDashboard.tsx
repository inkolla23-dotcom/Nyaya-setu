import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Plus, ClipboardList, Calendar, Clock, CheckCircle2, User, AlertCircle, FileText, Sparkles, ShieldAlert, Copy, Edit, BookOpen, Trash2, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';

const DEV_MEETING_MODE = true;
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface AdvocateDashboardProps {
  setView: (view: string) => void;
  setSelectedCaseId: (id: number) => void;
}

export const AdvocateDashboard: React.FC<AdvocateDashboardProps> = ({ setView, setSelectedCaseId }) => {
  const { user, updateAdvocateDetails, token, demoMode } = useAuth();
  const { language } = useLanguage();

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
  const { 
    fetchCases, 
    createCase, 
    addCaseUpdate, 
    fetchSpecializations, 
    fetchAppointments, 
    appointments, 
    chatWithAi,
    fetchNotifications,
    notifications,
    specializations,
    fetchMySlots,
    createSlot,
    updateSlot,
    deleteSlot,
    rejectAppointment,
    rescheduleAppointment,
    respondReschedule
  } = useData();

  const [advocateCases, setAdvocateCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingStatus, setVerifyingStatus] = useState(false);

  // Forms & Modal State
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseClient, setNewCaseClient] = useState('1'); // Defaults to Ramesh Kumar
  const [newCaseCategory, setNewCaseCategory] = useState('1'); // Family Law
  const [newCaseStatus, setNewCaseStatus] = useState('Under Review');
  const [newCaseHearing, setNewCaseHearing] = useState('');
  const [submittingCase, setSubmittingCase] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCaseIdState, setSelectedCaseIdState] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateStage, setUpdateStage] = useState('Pleading');
  const [updateHearingDate, setUpdateHearingDate] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [lastAiTranslation, setLastAiTranslation] = useState('');

  // AI Draft Assistant States
  const [selectedCaseForDraft, setSelectedCaseForDraft] = useState('');
  const [draftType, setDraftType] = useState('Written Statement');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Notepad State
  const [caseNotes, setCaseNotes] = useState('');

  // Slot Management States
  const [mySlots, setMySlots] = useState<any[]>([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('09:30');
  const [slotType, setSlotType] = useState<'Video'|'Audio'|'Chat'>('Video');
  const [slotDuration, setSlotDuration] = useState(30);
  const [slotMaxBookings, setSlotMaxBookings] = useState(1);
  const [slotRepeat, setSlotRepeat] = useState<'None'|'Daily'|'Weekly'>('None');
  const [savingSlot, setSavingSlot] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Pending Requests State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingApptId, setRejectingApptId] = useState<number|null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingApptId, setReschedulingApptId] = useState<number|null>(null);
  const [rescheduleSlotId, setRescheduleSlotId] = useState<number|null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Edit Profile States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhotoVal, setProfilePhotoVal] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAltPhone, setProfileAltPhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('');
  const [profilePincode, setProfilePincode] = useState('');
  const [profileExpYears, setProfileExpYears] = useState(0);
  const [profileBio, setProfileBio] = useState('');
  const [profileBarReg, setProfileBarReg] = useState('');
  const [profileOfficeName, setProfileOfficeName] = useState('');
  const [profileOfficeAddress, setProfileOfficeAddress] = useState('');
  const [profileFee, setProfileFee] = useState(0);
  const [profileOnlineFee, setProfileOnlineFee] = useState(0);
  const [profileLanguages, setProfileLanguages] = useState<string[]>([]);
  const [profileSpecs, setProfileSpecs] = useState<number[]>([]);
  const [profileDays, setProfileDays] = useState('');
  const [profileHours, setProfileHours] = useState('');
  const [profileCourts, setProfileCourts] = useState('');
  const [profileEducation, setProfileEducation] = useState('');
  const [profileDegrees, setProfileDegrees] = useState('');
  const [profileCertifications, setProfileCertifications] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileLinkedin, setProfileLinkedin] = useState('');

  const [activeModalTab, setActiveModalTab] = useState<'basic' | 'practice' | 'pro' | 'docs'>('basic');

  // Replaces files mock paths
  const [newBarCert, setNewBarCert] = useState('');
  const [newIdCard, setNewIdCard] = useState('');
  const [newGovId, setNewGovId] = useState('');
  const [newPracticeCert, setNewPracticeCert] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const openEditProfile = () => {
    const details: any = user?.advocateDetails || {};
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
    setProfilePhone(user?.phone || '');
    setProfilePhotoVal(details.profile_photo || '');
    setProfileAltPhone(details.alternate_phone || '');
    setProfileAddress(details.address || '');
    setProfileCity(details.city || '');
    setProfileState(details.state || '');
    setProfilePincode(details.pincode || '');
    setProfileExpYears(details.experience_years || 0);
    setProfileBio(details.biography || '');
    setProfileBarReg(details.bar_registration || '');
    setProfileOfficeName(details.office_name || '');
    setProfileOfficeAddress(details.office_address || '');
    setProfileFee(details.consultation_fee || 0);
    setProfileOnlineFee(details.online_consultation_fee || 0);
    setProfileDays(details.working_days || '');
    setProfileHours(details.working_hours || '');
    setProfileCourts(details.court_locations || '');
    setProfileEducation(details.education || '');
    setProfileDegrees(details.degrees || '');
    setProfileCertifications(details.certifications || '');
    setProfileWebsite(details.website || '');
    setProfileLinkedin(details.linkedin || '');
    setNewBarCert('');
    setNewIdCard('');
    setNewGovId('');
    setNewPracticeCert('');
    
    let langs: string[] = [];
    try {
      langs = typeof details.languages === 'string' ? JSON.parse(details.languages) : details.languages || [];
      if (!Array.isArray(langs)) langs = [];
    } catch {
      langs = [];
    }
    setProfileLanguages(langs);

    const specs = details.specializations || [];
    setProfileSpecs(specs);

    setShowEditProfileModal(true);
  };

  const toggleLanguage = (lang: string) => {
    setProfileLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleSpec = (id: number) => {
    setProfileSpecs(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim() || !profilePhone.trim()) {
      alert("Name, email, and phone number are required.");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Phone format validation
    const phoneRegex = /^[0-9+() -]{10,20}$/;
    if (!phoneRegex.test(profilePhone)) {
      alert("Please enter a valid phone number.");
      return;
    }

    if (profileFee < 0 || profileOnlineFee < 0) {
      alert("Consultation fees must be positive numbers.");
      return;
    }

    // Validate file types
    const filesToValidate = [
      { path: newBarCert, name: 'Bar Council Certificate' },
      { path: newIdCard, name: 'Government ID' },
      { path: newPracticeCert, name: 'Practice Certificate' }
    ];
    for (const file of filesToValidate) {
      if (file.path) {
        const ext = file.path.split('.').pop()?.toLowerCase();
        if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
          alert(`Invalid file type for ${file.name}. Only PDF, JPG, JPEG, and PNG are allowed.`);
          return;
        }
      }
    }

    setSavingProfile(true);
    try {
      const payload: any = {
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        profile_photo: profilePhotoVal || null,
        alternate_phone: profileAltPhone || null,
        address: profileAddress || null,
        city: profileCity || null,
        state: profileState || null,
        pincode: profilePincode || null,
        experience_years: profileExpYears,
        biography: profileBio || null,
        bar_registration: profileBarReg || null,
        office_name: profileOfficeName || null,
        office_address: profileOfficeAddress || null,
        consultation_fee: profileFee,
        online_consultation_fee: profileOnlineFee,
        languages: JSON.stringify(profileLanguages),
        specializations: profileSpecs,
        working_days: profileDays || null,
        working_hours: profileHours || null,
        court_locations: profileCourts || null,
        education: profileEducation || null,
        degrees: profileDegrees || null,
        certifications: profileCertifications || null,
        website: profileWebsite || null,
        linkedin: profileLinkedin || null
      };

      if (newBarCert) payload.enrollmentCertificate = newBarCert;
      if (newIdCard) payload.idCard = newIdCard;
      if (newGovId) payload.govId = newGovId;
      if (newPracticeCert) payload.practiceCertificate = newPracticeCert;

      const response = await fetch(`${API_URL}/advocates/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Refresh AuthContext session
        const meResponse = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          updateAdvocateDetails(meData.user.advocateDetails);
        }

        // Refresh other dashboard metrics
        await loadAdvData();

        if (data.needsReVerification) {
          alert("Your profile has been updated. Since you changed verification documents or your Bar council number, your profile status has been reset to Pending and submitted for re-verification.");
        } else {
          alert("Profile updated successfully.");
        }
        setShowEditProfileModal(false);
      } else {
        const errData = await response.json();
        alert(`Failed to save profile: ${errData.error || 'Server error'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error saving profile details.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Sample client list for dropdown
  const clientList = [
    { id: 1, name: 'Ramesh Kumar (Divorce Matter)' },
    { id: 2, name: 'Ananya Rao (Property Injunction)' },
    { id: 3, name: 'Savitri Devi (Criminal Charge)' },
    { id: 4, name: 'John Miller (Breach of Contract)' },
    { id: 5, name: 'Prakash Patel (Employment Gratuity)' }
  ];

  async function loadAdvData() {
    setLoading(true);
    try {
      await fetchSpecializations();
      const list = await fetchCases();
      setAdvocateCases(list);
      await fetchAppointments();
      await fetchNotifications();
      // Load slots
      const slots = await fetchMySlots();
      setMySlots(slots);
    } catch (e) {
      console.error('Error fetching advocate details', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdvData();
    // Load local notepad text if any
    const savedNotes = localStorage.getItem('ns_advocate_notes');
    if (savedNotes) setCaseNotes(savedNotes);
  }, [user]);

  const handleAcceptAppointment = async (apptId: number) => {
    try {
      const response = await fetch(`${API_URL}/appointments/${apptId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Auto-refresh appointments so meeting_link/meeting_status updates immediately
        await fetchAppointments();
        const slots = await fetchMySlots();
        setMySlots(slots);
        alert(data.message);
      } else {
        const err = await response.json();
        alert(`Failed to accept appointment: ${err.error || 'Server error'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error accepting appointment.");
    }
  };

  const handleRejectAppointment = async () => {
    if (!rejectingApptId) return;
    try {
      await rejectAppointment(rejectingApptId, rejectionReason || 'Advocate unavailable');
      setShowRejectModal(false);
      setRejectingApptId(null);
      setRejectionReason('');
    } catch (e: any) {
      alert(`Failed to reject: ${e.message}`);
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!reschedulingApptId || !rescheduleSlotId) {
      alert('Please select a slot to propose.');
      return;
    }
    try {
      await rescheduleAppointment(reschedulingApptId, rescheduleSlotId, rescheduleReason || 'Advocate unavailable at previous time.');
      setShowRescheduleModal(false);
      setReschedulingApptId(null);
      setRescheduleSlotId(null);
      setRescheduleReason('');
      alert('Reschedule request sent successfully.');
    } catch (e: any) {
      alert(e.message || 'Failed to reschedule');
    }
  };

  // Slot CRUD handlers
  const openAddSlot = () => {
    setEditingSlot(null);
    setSlotDate('');
    setSlotStartTime('09:00');
    setSlotEndTime('09:30');
    setSlotType('Video');
    setSlotDuration(30);
    setSlotMaxBookings(1);
    setSlotRepeat('None');
    setShowSlotModal(true);
  };

  const openEditSlot = (slot: any) => {
    setEditingSlot(slot);
    setSlotDate(slot.slot_date?.split('T')[0] || slot.slot_date || '');
    setSlotStartTime(slot.start_time?.substring(0, 5) || '09:00');
    setSlotEndTime(slot.end_time?.substring(0, 5) || '09:30');
    setSlotType(slot.consultation_type || 'Video');
    setSlotDuration(slot.duration_minutes || 30);
    setSlotMaxBookings(slot.max_bookings || 1);
    setSlotRepeat(slot.repeat_type || 'None');
    setShowSlotModal(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate || !slotStartTime || !slotEndTime) {
      alert('Date, start time, and end time are required.');
      return;
    }
    setSavingSlot(true);
    try {
      const payload = {
        slot_date: slotDate,
        start_time: slotStartTime,
        end_time: slotEndTime,
        consultation_type: slotType,
        duration_minutes: slotDuration,
        max_bookings: slotMaxBookings,
        repeat_type: slotRepeat,
        is_active: true
      };
      if (editingSlot) {
        await updateSlot(editingSlot.id, payload);
      } else {
        await createSlot(payload);
      }
      const slots = await fetchMySlots();
      setMySlots(slots);
      setShowSlotModal(false);
    } catch (e: any) {
      alert(`Failed to save slot: ${e.message}`);
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await deleteSlot(slotId);
      const slots = await fetchMySlots();
      setMySlots(slots);
    } catch (e: any) {
      alert(`Failed to delete slot: ${e.message}`);
    }
  };

  const handleToggleSlot = async (slot: any) => {
    try {
      await updateSlot(slot.id, {
        slot_date: slot.slot_date?.split('T')[0] || slot.slot_date,
        start_time: slot.start_time?.substring(0, 5),
        end_time: slot.end_time?.substring(0, 5),
        consultation_type: slot.consultation_type,
        duration_minutes: slot.duration_minutes,
        max_bookings: slot.max_bookings,
        is_active: !slot.is_active
      });
      const slots = await fetchMySlots();
      setMySlots(slots);
    } catch (e: any) {
      alert(`Failed to toggle slot: ${e.message}`);
    }
  };


  const handleCompleteAppointment = async (apptId: number) => {
    if (!window.confirm("Mark this consultation as completed?")) return;
    try {
      const response = await fetch(`${API_URL}/appointments/${apptId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        await fetchAppointments();
      } else {
        alert("Failed to mark appointment as completed.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;

    setSubmittingCase(true);
    try {
      const selectedCli = clientList.find(c => c.id === parseInt(newCaseClient));
      await createCase({
        clientId: newCaseClient,
        clientName: selectedCli ? selectedCli.name.split(' (')[0] : 'Client',
        title: newCaseTitle,
        categoryId: newCaseCategory,
        status: newCaseStatus,
        nextHearingDate: newCaseHearing || null
      });
      setShowCaseModal(false);
      setNewCaseTitle('');
      await loadAdvData();
    } catch (e) {
      alert('Failed to register case');
    } finally {
      setSubmittingCase(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseIdState || !updateTitle || !updateDescription) return;

    setSubmittingUpdate(true);
    setLastAiTranslation('');
    try {
      const response = await addCaseUpdate({
        caseId: selectedCaseIdState,
        title: updateTitle,
        description: updateDescription,
        stage: updateStage,
        nextHearingDate: updateHearingDate || null
      });
      setLastAiTranslation(response.aiExplanation);
      setUpdateTitle('');
      setUpdateDescription('');
      await loadAdvData();
    } catch (e) {
      alert('Failed to post update');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleApproveVerification = async () => {
    setVerifyingStatus(true);
    try {
      if (demoMode) {
        // Mock update
        const updatedDetails = {
          ...(user?.advocateDetails || {}),
          is_verified: 1,
          verification_status: 'Approved'
        };
        updateAdvocateDetails(updatedDetails);
      } else {
        const response = await fetch(`${API_URL}/advocates/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Approved' })
        });
        if (response.ok) {
          const data = await response.json();
          updateAdvocateDetails(data.advocateDetails);
        }
      }
    } catch (e) {
      alert('Failed to update verification status');
    } finally {
      setVerifyingStatus(false);
    }
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForDraft) return;
    setDrafting(true);
    setGeneratedDraft('');
    setCopied(false);
    try {
      const matchedCase = advocateCases.find(c => c.id === parseInt(selectedCaseForDraft));
      const targetCaseTitle = matchedCase ? matchedCase.title : 'General Legal Case';
      const prompt = `You are Nyaya Copilot, a senior legal expert in Indian Law. Generate a professional, complete legal draft of type: "${draftType}" for a case titled "${targetCaseTitle}". 
Context/Details: ${draftPrompt || 'None provided'}.
Format it professionally with Title, Subject, Brief Facts, Grounds, and Prayers where applicable. Do not use mock placeholder brackets like [Name] - replace placeholders with appropriate details or leave empty spaces.`;
      
      const response = await chatWithAi(prompt);
      setGeneratedDraft(response);
    } catch (err) {
      setGeneratedDraft('Failed to generate draft. Please verify the AI Service credentials.');
    } finally {
      setDrafting(false);
    }
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaseNotes(e.target.value);
    localStorage.setItem('ns_advocate_notes', e.target.value);
  };

  const navigateToCase = (caseId: number) => {
    setSelectedCaseId(caseId);
    setView('case_details');
  };

  // Check advocate verification status
  const advocateDetails = user?.advocateDetails;
  const isVerified = advocateDetails?.is_verified === 1 || advocateDetails?.verification_status === 'Approved';
  const verificationStatus = advocateDetails?.verification_status || 'Pending Verification';

  return (
    <div className="main-content" style={{ background: '#fafbfc' }}>
      
      {/* Welcome & Verification Bar */}
      <div className="glass-card-no-hover" style={{ 
        padding: '1.75rem', 
        marginBottom: '2rem', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%)', 
        border: '1px solid rgba(99, 102, 241, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
              Welcome, <span className="gradient-text">{user?.name}</span> 🎓
            </h2>
            {isVerified ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#d1fae5', color: '#065f46', padding: '0.25rem 0.6rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', width: 'max-content' }}>
                  <CheckCircle2 size={12} /> Verified Advocate
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  Verified by Nyaya Setu • Officer ID: <strong>OFFICER-99</strong> • Date: <strong>16/07/2026</strong>
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#fffbeb', color: '#92400e', padding: '0.25rem 0.6rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', width: 'max-content' }}>
                  <ShieldAlert size={12} /> Pending Verification
                </span>
                <span style={{ fontSize: '0.65rem', color: '#b45309' }}>
                  Verification ID: <strong>VER-AD-{advocateDetails?.id || 1}</strong> • Status: <strong>{verificationStatus}</strong> • Est. Review Time: <strong>24-48 Hours</strong>
                </span>
              </div>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Bar Council Registration Number: <strong>{advocateDetails?.bar_registration || 'BAR/REG/2012/987'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {!isVerified && (
            <button 
              className="btn-glass"
              onClick={handleApproveVerification}
              disabled={verifyingStatus}
              style={{ color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)', fontWeight: 'bold' }}
            >
              🔒 Demo Bypass: Verify Profile
            </button>
          )}
          <button className="btn-secondary" onClick={openEditProfile}>
            ✏️ Edit Profile
          </button>
          <button className="btn-secondary" onClick={() => setShowUpdateModal(true)}>
            📝 Log Hearing Update
          </button>
          <button className="btn-primary" onClick={() => setShowCaseModal(true)}>
            <Plus size={16} /> Register Case File
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN: Cases registry & AI draft assistant */}
        <div>
          {/* Active Cases Registry */}
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: '700', marginBottom: '1rem' }}>
            💼 Case Briefs Registry ({advocateCases.length})
          </h3>

          {loading ? (
            <div className="skeleton skeleton-rect" style={{ height: '200px' }} />
          ) : advocateCases.length === 0 ? (
            <div className="glass-card-no-hover empty-state-wrapper" style={{ padding: '3rem', marginBottom: '2rem' }}>
              <FileText size={44} className="empty-state-icon" style={{ color: '#94a3b8' }} />
              <h4 style={{ fontWeight: '700', marginTop: '1rem' }}>No Active Briefs Found</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Click "Register Case File" at the top to initialize a digital brief.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {advocateCases.map((c) => (
                <div 
                  key={c.id} 
                  className="glass-card" 
                  onClick={() => navigateToCase(c.id)}
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem 1.25rem',
                    borderRadius: '16px',
                    borderLeft: '4px solid #6366f1'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', background: '#eef2ff', color: '#4338ca', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {c.category_name}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', background: '#fffbeb', color: '#b45309', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        Health: {c.health_score}%
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>{c.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Client: <strong>{c.client_name}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      background: c.status.toLowerCase().includes('adjourned') ? '#fee2e2' : '#d1fae5', 
                      color: c.status.toLowerCase().includes('adjourned') ? '#ef4444' : '#059669', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '9999px'
                    }}>
                      {c.status}
                    </span>
                    {c.next_hearing_date && (
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.15rem', justifyContent: 'flex-end' }}>
                        <Clock size={10} /> {new Date(c.next_hearing_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Legal Draft Assistant Section */}
          <div className="glass-card-no-hover" style={{ padding: '1.75rem', borderRadius: '18px' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#1e293b', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={18} style={{ color: '#6366f1' }} /> Nyaya Copilot: AI Legal Draft Assistant
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Select a litigation file and auto-generate legal notifications, counter petitions, or written statements instantly.
            </p>

            <form onSubmit={handleGenerateDraft}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Select Case Registry</label>
                  <select 
                    className="chat-input" 
                    value={selectedCaseForDraft}
                    onChange={(e) => setSelectedCaseForDraft(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem' }}
                    required
                  >
                    <option value="">-- Choose Case file --</option>
                    {advocateCases.map(c => (
                      <option key={c.id} value={c.id}>{c.title} ({c.client_name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Document Template</label>
                  <select 
                    className="chat-input" 
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem' }}
                  >
                    <option value="Written Statement">Written Statement (Reply Affidavit)</option>
                    <option value="Legal Notice">Legal Notice</option>
                    <option value="Mutual Consent Divorce Agreement">Mutual Consent Divorce Agreement</option>
                    <option value="Anticipatory Bail Application">Anticipatory Bail Application</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Custom facts or clauses (Optional)</label>
                <textarea 
                  className="chat-input"
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  style={{ width: '100%', height: '80px', padding: '0.6rem', resize: 'none' }}
                  placeholder="E.g. Husband agrees to pay one-time settlement of ₹20,00,000, joint custody on weekends..."
                />
              </div>

              <button type="submit" disabled={drafting} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {drafting ? 'Analyzing Briefs & Drafting Document...' : 'Generate Legal Draft with Copilot'}
              </button>
            </form>

            {generatedDraft && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <BookOpen size={14} /> Auto-Generated Draft Document
                  </span>
                  <button onClick={handleCopyDraft} className="btn-glass" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Copy size={12} /> {copied ? 'Copied ✓' : 'Copy Text'}
                  </button>
                </div>

                <div style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  padding: '1.25rem', 
                  fontSize: '0.85rem', 
                  color: '#334155', 
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap', 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  textAlign: 'left'
                }}>
                  {generatedDraft}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Appointments, slots, notes, calendar */}
        <div>

        {/* PENDING CONSULTATION REQUESTS */}
          {(() => {
            const pendingAppts = appointments.filter(a => a.status === 'pending' || a.reschedule_status === 'PENDING_ADVOCATE');
            if (pendingAppts.length === 0) return null;
            return (

              <div className="glass-card-no-hover" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '16px', borderLeft: '4px solid #f59e0b' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                  Pending Consultation Requests ({pendingAppts.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendingAppts.map(appt => {
                    const isClientReschedule = appt.reschedule_status === 'PENDING_ADVOCATE';
                    
                    const apptDate = isClientReschedule && appt.reschedule_slot_date
                      ? new Date(appt.reschedule_slot_date)
                      : new Date(appt.appointment_date);

                    const timeDisplay = isClientReschedule && appt.reschedule_start_time
                      ? `${formatTimeDisplay(appt.reschedule_start_time)} – ${formatTimeDisplay(appt.reschedule_end_time)}`
                      : apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    const typeDisplay = isClientReschedule && appt.reschedule_consultation_type
                      ? appt.reschedule_consultation_type
                      : appt.consultation_type;

                    return (
                      <div key={appt.id} style={{ background: isClientReschedule ? '#f5f3ff' : '#fffbeb', border: `1px solid ${isClientReschedule ? '#ddd6fe' : '#fde68a'}`, borderRadius: '12px', padding: '0.9rem 1rem', fontSize: '0.82rem' }}>
                        {isClientReschedule && (
                          <div style={{ background: '#c084fc', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '0.15rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
                            🔄 CLIENT REQUESTED RESCHEDULE
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                              <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              {appt.client_name}
                            </strong>
                            <span style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                              {appt.notes ? `"${appt.notes}"` : 'No notes provided'}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 'bold', display: 'block' }}>
                              {isClientReschedule && appt.reschedule_slot_date
                                ? formatDateDisplay(appt.reschedule_slot_date)
                                : apptDate.toLocaleDateString()
                              } {timeDisplay}
                            </span>
                            {typeDisplay && (
                              <span style={{ fontSize: '0.65rem', color: '#7c3aed', background: '#ede9fe', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                {typeDisplay}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: `1px dashed ${isClientReschedule ? '#ddd6fe' : '#fde68a'}` }}>
                          <button
                            onClick={() => handleAcceptAppointment(appt.id)}
                            className="btn-primary"
                            style={{ padding: '0.3rem 0.7rem', fontSize: '0.73rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Check size={12} /> {isClientReschedule ? 'Accept New Slot' : 'Accept'}
                          </button>
                          <button
                            onClick={() => { setRejectingApptId(appt.id); setRejectionReason(''); setShowRejectModal(true); }}
                            style={{ padding: '0.3rem 0.7rem', fontSize: '0.73rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <X size={12} /> Reject
                          </button>
                          <button
                            onClick={() => { setReschedulingApptId(appt.id); setRescheduleSlotId(null); setShowRescheduleModal(true); }}
                            style={{ padding: '0.3rem 0.7rem', fontSize: '0.73rem', borderRadius: '6px', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Calendar size={12} /> Propose Different Slot
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Today's Consultations */}
          <div className="glass-card-no-hover" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={16} style={{ color: '#6366f1' }} /> All Consultations ({appointments.filter(a => a.status !== 'pending').length})
            </h4>

            {appointments.filter(a => a.status !== 'pending').length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.25rem 0' }}>No active consultations yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appointments.filter(a => a.status !== 'pending').map((appt) => {
                  const apptDate = new Date(appt.appointment_date);
                  const now = new Date();
                  const diffMins = (apptDate.getTime() - now.getTime()) / (1000 * 60);
                  const isJoinEnabled = DEV_MEETING_MODE ? true : diffMins <= 10;
                  const isScheduled = appt.status === 'scheduled';
                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'cancelled';
                  const meetingReady = isScheduled && appt.meeting_status === 'CREATED' && appt.meeting_link;

                  return (
                    <div key={appt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.8rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.8rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{appt.client_name}</strong>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>{appt.notes ? `"${appt.notes}"` : 'General consultation'}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: '700', color: '#4f46e5', fontSize: '0.8rem', display: 'block' }}>
                            {apptDate.toLocaleDateString()} {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: isCompleted ? '#d1fae5' : isCancelled ? '#fee2e2' : meetingReady ? '#e0e7ff' : '#dbeafe',
                            color: isCompleted ? '#065f46' : isCancelled ? '#dc2626' : meetingReady ? '#3730a3' : '#1e40af',
                            display: 'inline-block',
                            marginTop: '0.2rem'
                          }}>
                            {isCancelled ? 'CANCELLED' : isCompleted ? 'COMPLETED' : meetingReady ? '🟢 MEETING READY' : 'SCHEDULED'}
                          </span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {isScheduled && !isCancelled && (
                          <div style={{ width: '100%' }}>
                            {!appt.meeting_link ? (
                              <span style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 'bold' }}>
                                ⏳ Generating meeting link…
                              </span>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {isJoinEnabled ? (
                                  <a
                                    href={appt.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary"
                                    style={{ textDecoration: 'none', padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                  >
                                    Join Consultation
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
                                    Meeting opens 10 minutes before start.
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleCompleteAppointment(appt.id)}
                                  style={{ border: '1px solid #10b981', color: '#10b981', background: 'none', padding: '0.3rem 0.6rem', fontSize: '0.7rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Complete Session
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {isCompleted && (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            ✓ Consultation Completed
                          </span>
                        )}

                        {isCancelled && (
                          <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>
                            ✗ Rejected{appt.rejection_reason ? ` — ${appt.rejection_reason}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Available Consultation Slots */}
          <div className="glass-card-no-hover" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
                <Calendar size={16} style={{ color: '#6366f1' }} /> My Available Slots ({mySlots.length})
              </h4>
              <button
                onClick={openAddSlot}
                className="btn-primary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Plus size={12} /> Add Slot
              </button>
            </div>

            {demoMode && (
              <p style={{ color: '#b45309', fontSize: '0.72rem', background: '#fef3c7', padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                Slot management requires backend connection. Running in demo mode.
              </p>
            )}

            {mySlots.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
                No slots configured. Add available times so clients can book consultations.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                {mySlots.map(slot => (
                  <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: slot.is_active ? '#f0fdf4' : '#f8fafc', border: `1px solid ${slot.is_active ? '#86efac' : '#e2e8f0'}`, borderRadius: '8px', fontSize: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#1e293b', display: 'block' }}>
                        {new Date(slot.slot_date).toLocaleDateString()} — {slot.start_time?.substring(0,5)} to {slot.end_time?.substring(0,5)}
                      </strong>
                      <span style={{ color: '#64748b', fontSize: '0.68rem' }}>
                        {slot.consultation_type} · {slot.duration_minutes}min · Max {slot.max_bookings} booking{slot.max_bookings > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleToggleSlot(slot)}
                        title={slot.is_active ? 'Deactivate' : 'Activate'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: slot.is_active ? '#10b981' : '#94a3b8', padding: '0.2rem' }}
                      >
                        {slot.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => openEditSlot(slot)}
                        title="Edit"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '0.2rem' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        title="Delete"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Persistent Case Notes Scratchpad */}
          <div className="glass-card-no-hover" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Edit size={16} style={{ color: '#6366f1' }} /> Advocate Notepad
            </h4>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem' }}>Quickly jot down ideas, statutes, or client points. Saved in browser cache.</p>
            <textarea
              className="chat-input"
              value={caseNotes}
              onChange={handleSaveNotes}
              style={{ width: '100%', height: '100px', padding: '0.5rem', fontSize: '0.8rem', resize: 'none', border: '1px solid #e2e8f0' }}
              placeholder="E.g. Section 13(1)(ia) Hindu Marriage Act refers to cruelty grounds..."
            />
          </div>

          {/* Visual Court Calendar List */}
          <div className="glass-card-no-hover" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={16} style={{ color: '#6366f1' }} /> Upcoming Court Calendar
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {advocateCases.filter(c => c.next_hearing_date).map((c, idx) => (
                <div key={idx} style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', borderLeft: '3px solid #f59e0b', borderRadius: '4px', fontSize: '0.75rem' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold', display: 'block' }}>Hearing: {new Date(c.next_hearing_date).toLocaleDateString()}</span>
                  <strong style={{ color: '#1e293b' }}>{c.title}</strong>
                </div>
              ))}
              {advocateCases.filter(c => c.next_hearing_date).length === 0 && (
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>No hearings scheduled in calendar.</p>
              )}
            </div>
          </div>
        </div>



      </div>

      {/* --- REGISTER CASE MODAL --- */}
      {showCaseModal && (
        <div className="modal-overlay" onClick={() => setShowCaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Register New Litigation Brief</h3>
            
            <form onSubmit={handleCreateCase}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Case Title</label>
                <input 
                  type="text" 
                  value={newCaseTitle} 
                  onChange={(e) => setNewCaseTitle(e.target.value)} 
                  className="chat-input" 
                  style={{ width: '100%', padding: '0.6rem' }} 
                  placeholder="E.g. Ramesh Kumar Divorce Matter" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Associate Client</label>
                  <select 
                    className="chat-input" 
                    value={newCaseClient} 
                    onChange={(e) => setNewCaseClient(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem' }}
                  >
                    {clientList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select 
                    className="chat-input" 
                    value={newCaseCategory} 
                    onChange={(e) => setNewCaseCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem' }}
                  >
                    <option value="1">Family Law</option>
                    <option value="2">Criminal Law</option>
                    <option value="3">Property Dispute</option>
                    <option value="4">Labor/Employment Dispute</option>
                    <option value="5">Consumer Protection</option>
                    <option value="6">Civil Law</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label">Status Stage</label>
                  <input 
                    type="text" 
                    value={newCaseStatus} 
                    onChange={(e) => setNewCaseStatus(e.target.value)} 
                    className="chat-input" 
                    style={{ width: '100%', padding: '0.6rem' }} 
                    placeholder="E.g. Under Review" 
                  />
                </div>
                <div>
                  <label className="form-label">Hearing Date</label>
                  <input 
                    type="date" 
                    value={newCaseHearing} 
                    onChange={(e) => setNewCaseHearing(e.target.value)} 
                    className="chat-input" 
                    style={{ width: '100%', padding: '0.6rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCaseModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingCase} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {submittingCase ? 'Creating...' : 'Register File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PROFILE MODAL --- */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Edit Advocate Profile</h3>
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Full Name</label>
                  <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="chat-input" required />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Email</label>
                  <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className="chat-input" required />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Phone</label>
                  <input type="text" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="chat-input" required />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Alternate Phone</label>
                  <input type="text" value={profileAltPhone} onChange={e => setProfileAltPhone(e.target.value)} className="chat-input" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Address</label>
                  <input type="text" value={profileAddress} onChange={e => setProfileAddress(e.target.value)} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>City</label>
                  <input type="text" value={profileCity} onChange={e => setProfileCity(e.target.value)} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>State</label>
                  <input type="text" value={profileState} onChange={e => setProfileState(e.target.value)} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Pincode</label>
                  <input type="text" value={profilePincode} onChange={e => setProfilePincode(e.target.value)} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Experience (Years)</label>
                  <input type="number" min="0" value={profileExpYears} onChange={e => setProfileExpYears(parseInt(e.target.value) || 0)} className="chat-input" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Biography</label>
                  <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="chat-input" rows={3} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Bar Registration</label>
                  <input type="text" value={profileBarReg} onChange={e => setProfileBarReg(e.target.value)} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Office Name</label>
                  <input type="text" value={profileOfficeName} onChange={e => setProfileOfficeName(e.target.value)} className="chat-input" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Office Address</label>
                  <input type="text" value={profileOfficeAddress} onChange={e => setProfileOfficeAddress(e.target.value)} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Consultation Fee (₹)</label>
                  <input type="number" min="0" value={profileFee} onChange={e => setProfileFee(parseInt(e.target.value) || 0)} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Online Fee (₹)</label>
                  <input type="number" min="0" value={profileOnlineFee} onChange={e => setProfileOnlineFee(parseInt(e.target.value) || 0)} className="chat-input" />
                </div>
              </div>
              {/* Document uploads */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Bar Council Certificate</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setNewBarCert(e.target.files?.[0]?.name || '')} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Government ID</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setNewGovId(e.target.files?.[0]?.name || '')} className="chat-input" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Practice Certificate</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setNewPracticeCert(e.target.files?.[0]?.name || '')} className="chat-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditProfileModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile} className="btn-primary" style={{ flex: 1 }}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- LOG UPDATE MODAL --- */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Log Court Hearing Update</h3>
            
            <form onSubmit={handlePostUpdate}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Case File</label>
                <select 
                  className="chat-input" 
                  value={selectedCaseIdState} 
                  onChange={(e) => setSelectedCaseIdState(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem' }}
                  required
                >
                  <option value="">-- Choose Case --</option>
                  {advocateCases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Hearing Title</label>
                  <input 
                    type="text" 
                    value={updateTitle} 
                    onChange={(e) => setUpdateTitle(e.target.value)} 
                    className="chat-input" 
                    style={{ width: '100%', padding: '0.6rem' }} 
                    placeholder="E.g. Written Statement Filed" 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">Next Stage</label>
                  <input 
                    type="text" 
                    value={updateStage} 
                    onChange={(e) => setUpdateStage(e.target.value)} 
                    className="chat-input" 
                    style={{ width: '100%', padding: '0.6rem' }} 
                    placeholder="E.g. Pleading / Evidence" 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Hearing Description (Court Legalese)</label>
                <textarea 
                  value={updateDescription} 
                  onChange={(e) => setUpdateDescription(e.target.value)} 
                  className="chat-input" 
                  style={{ width: '100%', height: '80px', padding: '0.6rem', resize: 'none' }} 
                  placeholder="Describe the court orders or legalese text..." 
                  required 
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Next Adjourned Date</label>
                <input 
                  type="date" 
                  value={updateHearingDate} 
                  onChange={(e) => setUpdateHearingDate(e.target.value)} 
                  className="chat-input" 
                  style={{ width: '100%', padding: '0.6rem' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowUpdateModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingUpdate} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {submittingUpdate ? 'Submitting & Analyzing...' : 'Log Hearing'}
                </button>
              </div>
            </form>

            {lastAiTranslation && (
              <div className="glass-card-no-hover" style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '1rem', marginTop: '1.25rem', fontSize: '0.8rem', textAlign: 'left' }}>
                <h4 style={{ color: '#047857', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  <CheckCircle2 size={12} /> AI Plain Explanation Auto-Generated:
                </h4>
                <p style={{ fontStyle: 'italic', color: '#065f46' }}>"{lastAiTranslation}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- EDIT PROFILE MODAL --- */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>✏️ Edit Advocate Profile</h3>
            
            {/* Modal Tabs Bar */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                onClick={() => setActiveModalTab('basic')}
                style={{ flex: 1, border: 'none', background: activeModalTab === 'basic' ? 'white' : 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', color: activeModalTab === 'basic' ? '#4f46e5' : '#64748b' }}
              >
                Basic Info
              </button>
              <button 
                type="button"
                onClick={() => setActiveModalTab('practice')}
                style={{ flex: 1, border: 'none', background: activeModalTab === 'practice' ? 'white' : 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', color: activeModalTab === 'practice' ? '#4f46e5' : '#64748b' }}
              >
                Office Details
              </button>
              <button 
                type="button"
                onClick={() => setActiveModalTab('pro')}
                style={{ flex: 1, border: 'none', background: activeModalTab === 'pro' ? 'white' : 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', color: activeModalTab === 'pro' ? '#4f46e5' : '#64748b' }}
              >
                Practice Domains
              </button>
              <button 
                type="button"
                onClick={() => setActiveModalTab('docs')}
                style={{ flex: 1, border: 'none', background: activeModalTab === 'docs' ? 'white' : 'none', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', color: activeModalTab === 'docs' ? '#4f46e5' : '#64748b' }}
              >
                Documents
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              
              {/* TAB 1: BASIC INFO */}
              {activeModalTab === 'basic' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Full Name *</label>
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={(e) => setProfileName(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="form-label">Profile Photo URL</label>
                      <input 
                        type="text" 
                        value={profilePhotoVal} 
                        onChange={(e) => setProfilePhotoVal(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="Image URL link..." 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Email Address *</label>
                      <input 
                        type="email" 
                        value={profileEmail} 
                        onChange={(e) => setProfileEmail(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="form-label">Phone Number *</label>
                      <input 
                        type="text" 
                        value={profilePhone} 
                        onChange={(e) => setProfilePhone(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Alternate Phone</label>
                      <input 
                        type="text" 
                        value={profileAltPhone} 
                        onChange={(e) => setProfileAltPhone(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                    <div>
                      <label className="form-label">Pincode</label>
                      <input 
                        type="text" 
                        value={profilePincode} 
                        onChange={(e) => setProfilePincode(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">City</label>
                      <input 
                        type="text" 
                        value={profileCity} 
                        onChange={(e) => setProfileCity(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                    <div>
                      <label className="form-label">State</label>
                      <input 
                        type="text" 
                        value={profileState} 
                        onChange={(e) => setProfileState(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                    <div>
                      <label className="form-label">Years of Experience</label>
                      <input 
                        type="number" 
                        value={profileExpYears} 
                        onChange={(e) => setProfileExpYears(parseInt(e.target.value) || 0)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Biography / About Me</label>
                    <textarea 
                      value={profileBio} 
                      onChange={(e) => setProfileBio(e.target.value)} 
                      className="chat-input" 
                      style={{ width: '100%', height: '80px', padding: '0.6rem', resize: 'none' }} 
                      placeholder="Write a brief professional summary..." 
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Residential / Personal Address</label>
                    <textarea 
                      value={profileAddress} 
                      onChange={(e) => setProfileAddress(e.target.value)} 
                      className="chat-input" 
                      style={{ width: '100%', height: '60px', padding: '0.6rem', resize: 'none' }} 
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: OFFICE DETAILS */}
              {activeModalTab === 'practice' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Law Firm / Office Name</label>
                      <input 
                        type="text" 
                        value={profileOfficeName} 
                        onChange={(e) => setProfileOfficeName(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                    <div>
                      <label className="form-label">Website</label>
                      <input 
                        type="text" 
                        value={profileWebsite} 
                        onChange={(e) => setProfileWebsite(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="https://example.com" 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Consultation Fee (INR) *</label>
                      <input 
                        type="number" 
                        value={profileFee} 
                        onChange={(e) => setProfileFee(parseFloat(e.target.value) || 0)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="form-label">Online Consultation Fee (INR)</label>
                      <input 
                        type="number" 
                        value={profileOnlineFee} 
                        onChange={(e) => setProfileOnlineFee(parseFloat(e.target.value) || 0)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">LinkedIn Profile URL</label>
                      <input 
                        type="text" 
                        value={profileLinkedin} 
                        onChange={(e) => setProfileLinkedin(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="https://linkedin.com/in/..." 
                      />
                    </div>
                    <div>
                      <label className="form-label">Office Address</label>
                      <textarea 
                        value={profileOfficeAddress} 
                        onChange={(e) => setProfileOfficeAddress(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', height: '40px', padding: '0.6rem', resize: 'none' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Working Days</label>
                      <input 
                        type="text" 
                        value={profileDays} 
                        onChange={(e) => setProfileDays(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="E.g. Mon-Fri" 
                      />
                    </div>
                    <div>
                      <label className="form-label">Working Hours</label>
                      <input 
                        type="text" 
                        value={profileHours} 
                        onChange={(e) => setProfileHours(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="E.g. 9 AM - 5 PM" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRACTICE AREAS & DOMAINS */}
              {activeModalTab === 'pro' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Education / Law School</label>
                      <input 
                        type="text" 
                        value={profileEducation} 
                        onChange={(e) => setProfileEducation(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                    <div>
                      <label className="form-label">Degrees Held</label>
                      <input 
                        type="text" 
                        value={profileDegrees} 
                        onChange={(e) => setProfileDegrees(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="E.g. B.A. LL.B., LL.M." 
                      />
                    </div>
                    <div>
                      <label className="form-label">Certifications</label>
                      <input 
                        type="text" 
                        value={profileCertifications} 
                        onChange={(e) => setProfileCertifications(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Court Locations / Practice Bars</label>
                    <input 
                      type="text" 
                      value={profileCourts} 
                      onChange={(e) => setProfileCourts(e.target.value)} 
                      className="chat-input" 
                      style={{ width: '100%', padding: '0.6rem' }} 
                      placeholder="E.g. Delhi High Court, Saket District Court" 
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>🗣️ Languages Spoken (Select all that apply)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      {['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi', 'Odia', 'Assamese', 'Urdu'].map(lang => (
                        <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={profileLanguages.includes(lang)} 
                            onChange={() => toggleLanguage(lang)} 
                          />
                          {lang}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>⚖️ Specializations / Practice Areas (Select all that apply)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                      {specializations.map((cat: any) => (
                        <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={profileSpecs.includes(cat.id)} 
                            onChange={() => toggleSpec(cat.id)} 
                          />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DOCUMENTS & VERIFICATION */}
              {activeModalTab === 'docs' && (
                <div>
                  <div style={{ marginBottom: '1.25rem', background: '#fffbeb', borderLeft: '4px solid #d97706', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#b45309' }}>
                    <strong>⚠️ IMPORTANT RE-VERIFICATION NOTICE:</strong> Changing your Bar Council number or uploading new verification credentials will set your profile status to <strong>Pending Verification</strong>. You will temporarily lose active verified status until Nyaya Setu Officers approve the updates.
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Bar Council Registration Number</label>
                    <input 
                      type="text" 
                      value={profileBarReg} 
                      onChange={(e) => setProfileBarReg(e.target.value)} 
                      className="chat-input" 
                      style={{ width: '100%', padding: '0.6rem' }} 
                      disabled={user?.advocateDetails?.is_verified === 1}
                      placeholder="E.g. BAR/DEL/2012/987"
                    />
                    {user?.advocateDetails?.is_verified === 1 && (
                      <span style={{ fontSize: '0.65rem', color: '#dc2626', display: 'block', marginTop: '0.2rem' }}>
                        * Verified Bar Council number cannot be edited directly. Contact support/officers to modify.
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label className="form-label">Replace Bar Council Certificate</label>
                      <input 
                        type="text" 
                        value={newBarCert} 
                        onChange={(e) => setNewBarCert(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="Path e.g. uploads/bar_cert_updated.pdf" 
                      />
                    </div>
                    <div>
                      <label className="form-label">Replace Government Photo ID</label>
                      <input 
                        type="text" 
                        value={newIdCard} 
                        onChange={(e) => setNewIdCard(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="Path e.g. uploads/id_card_updated.jpg" 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label className="form-label">Replace Government Address ID</label>
                      <input 
                        type="text" 
                        value={newGovId} 
                        onChange={(e) => setNewGovId(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="Path e.g. uploads/gov_id_updated.jpg" 
                      />
                    </div>
                    <div>
                      <label className="form-label">Replace Practice Certificate</label>
                      <input 
                        type="text" 
                        value={newPracticeCert} 
                        onChange={(e) => setNewPracticeCert(e.target.value)} 
                        className="chat-input" 
                        style={{ width: '100%', padding: '0.6rem' }} 
                        placeholder="Path e.g. uploads/practice_cert_updated.pdf" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditProfileModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {savingProfile ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT SLOT MODAL ─────────────────────────────── */}
      {showSlotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                {editingSlot ? 'Edit Slot' : 'Add Available Slot'}
              </h3>
              <button onClick={() => setShowSlotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Date *</label>
                <input type="date" className="chat-input" value={slotDate} onChange={e => setSlotDate(e.target.value)} style={{ width: '100%', padding: '0.6rem' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Start Time *</label>
                  <input type="time" className="chat-input" value={slotStartTime} onChange={e => setSlotStartTime(e.target.value)} style={{ width: '100%', padding: '0.6rem' }} required />
                </div>
                <div>
                  <label className="form-label">End Time *</label>
                  <input type="time" className="chat-input" value={slotEndTime} onChange={e => setSlotEndTime(e.target.value)} style={{ width: '100%', padding: '0.6rem' }} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Consultation Type</label>
                  <select className="chat-input" value={slotType} onChange={e => setSlotType(e.target.value as any)} style={{ width: '100%', padding: '0.6rem' }}>
                    <option value="Video">Video</option>
                    <option value="Audio">Audio</option>
                    <option value="Chat">Chat</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Duration (minutes)</label>
                  <select className="chat-input" value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))} style={{ width: '100%', padding: '0.6rem' }}>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Max Bookings</label>
                  <input type="number" min={1} max={10} className="chat-input" value={slotMaxBookings} onChange={e => setSlotMaxBookings(Number(e.target.value))} style={{ width: '100%', padding: '0.6rem' }} />
                </div>
                <div>
                  <label className="form-label">Repeat</label>
                  <select className="chat-input" value={slotRepeat} onChange={e => setSlotRepeat(e.target.value as any)} style={{ width: '100%', padding: '0.6rem' }}>
                    <option value="None">No Repeat</option>
                    <option value="Daily">Daily (30 days)</option>
                    <option value="Weekly">Weekly (8 weeks)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowSlotModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" disabled={savingSlot} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {savingSlot ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REJECT APPOINTMENT MODAL ─────────────────────────── */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>Reject Consultation Request</h3>
            <p style={{ color: '#475569', fontSize: '0.88rem', marginBottom: '1rem' }}>Please provide a reason for declining. The client will be notified.</p>
            <textarea
              className="chat-input"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="E.g. Unavailable on that date, case type outside my practice..."
              style={{ width: '100%', height: '90px', resize: 'none', padding: '0.6rem', fontSize: '0.85rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setShowRejectModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button
                onClick={handleRejectAppointment}
                style={{ flex: 1, padding: '0.6rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESCHEDULE PROPOSAL MODAL ────────────────────────── */}
      {showRescheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1d4ed8', margin: 0 }}>Propose New Slot</h3>
              <button onClick={() => { setShowRescheduleModal(false); setRescheduleReason(''); setRescheduleSlotId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '1rem' }}>Select one of your available slots to propose to the client.</p>
            {mySlots.filter(s => s.is_active).length === 0 ? (
              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e' }}>
                No active slots available. Please add slots first from the "My Available Slots" section.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {mySlots.filter(s => s.is_active).map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setRescheduleSlotId(slot.id)}
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      border: `2px solid ${rescheduleSlotId === slot.id ? '#4f46e5' : '#e2e8f0'}`,
                      background: rescheduleSlotId === slot.id ? '#f0f0ff' : 'white',
                      color: '#1e293b',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: rescheduleSlotId === slot.id ? '700' : '400',
                      transition: 'all 0.15s'
                    }}
                  >
                    📅 {new Date(slot.slot_date).toLocaleDateString()} — {slot.start_time?.substring(0,5)} to {slot.end_time?.substring(0,5)} ({slot.consultation_type}, {slot.duration_minutes}min)
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Reason for Rescheduling</label>
              <textarea
                className="chat-input"
                value={rescheduleReason}
                onChange={e => setRescheduleReason(e.target.value)}
                placeholder="E.g. Advocate unavailable at previous time."
                style={{ width: '100%', height: '70px', resize: 'none', padding: '0.5rem', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button 
                type="button" 
                onClick={() => { 
                  setShowRescheduleModal(false); 
                  setRescheduleReason(''); 
                  setRescheduleSlotId(null); 
                }} 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleAppointment}
                disabled={!rescheduleSlotId}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', opacity: rescheduleSlotId ? 1 : 0.5 }}
              >
                Send Proposal to Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

