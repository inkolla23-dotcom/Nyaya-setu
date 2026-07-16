import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Search, MapPin, Star, ShieldCheck, ChevronRight, User, Filter, X, Briefcase, DollarSign, Globe } from 'lucide-react';

interface AdvocateSearchProps {
  setView: (view: string) => void;
  setSelectedAdvocateId: (id: number) => void;
  initialCategory?: string;
  setInitialCategory?: (cat: string) => void;
}

const ALL_LANGUAGES = [
  'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam',
  'Marathi', 'Gujarati', 'Punjabi', 'Bengali', 'Odia', 'Urdu', 'Assamese', 'Rajasthani', 'Haryanvi'
];

const AVAILABILITY_OPTIONS = ['Available Today', 'Available Tomorrow', 'Available in 2 Days', 'Available in 3 Days', 'Available on Monday'];

export const AdvocateSearch: React.FC<AdvocateSearchProps> = ({
  setView,
  setSelectedAdvocateId,
  initialCategory = '',
  setInitialCategory
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { fetchAdvocates, fetchSpecializations, specializations, advocates } = useData();

  // Filter States
  const [nameSearch, setNameSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minExp, setMinExp] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availability, setAvailability] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // If we arrive from AI copilot with a category pre-selected
  useEffect(() => {
    if (initialCategory) {
      // Find specialization id by name
      const spec = specializations.find(s => s.name.toLowerCase() === initialCategory.toLowerCase());
      if (spec) setSelectedCat(String(spec.id));
    }
  }, [initialCategory, specializations]);

  const countActiveFilters = useCallback(() => {
    let count = 0;
    if (nameSearch) count++;
    if (selectedCat) count++;
    if (selectedLang) count++;
    if (locationInput) count++;
    if (maxFee) count++;
    if (minRating) count++;
    if (minExp) count++;
    if (verifiedOnly) count++;
    if (availability) count++;
    setActiveFilterCount(count);
  }, [nameSearch, selectedCat, selectedLang, locationInput, maxFee, minRating, minExp, verifiedOnly, availability]);

  useEffect(() => { countActiveFilters(); }, [countActiveFilters]);

  const loadAdvocates = useCallback(async () => {
    setLoading(true);
    try {
      await fetchSpecializations();
      const clientLang = language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English';
      await fetchAdvocates({
        specializationId: selectedCat,
        location: locationInput,
        maxFee: maxFee,
        language: selectedLang,
        clientLang,
        clientBudget: maxFee || '5000',
        minRating,
        minExperience: minExp,
        verifiedOnly: String(verifiedOnly),
        availability,
        nameSearch,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedCat, locationInput, maxFee, selectedLang, minRating, minExp, verifiedOnly, availability, nameSearch]);

  useEffect(() => {
    loadAdvocates();
  }, [loadAdvocates]);

  const clearFilters = () => {
    setNameSearch('');
    setSelectedCat('');
    setSelectedLang('');
    setLocationInput('');
    setMaxFee('');
    setMinRating('');
    setMinExp('');
    setVerifiedOnly(false);
    setAvailability('');
    if (setInitialCategory) setInitialCategory('');
  };

  const handleSelectAdvocate = (advId: number) => {
    setSelectedAdvocateId(advId);
    setView('advocate_profile');
  };

  const getLangArray = (langs: any): string[] => {
    if (!langs) return [];
    if (Array.isArray(langs)) return langs;
    try { return JSON.parse(langs); } catch { return [langs]; }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.7) return '#10b981';
    if (rating >= 4.4) return '#f59e0b';
    return '#64748b';
  };

  const getAvailabilityColor = (avail: string) => {
    if (avail?.toLowerCase().includes('today')) return '#10b981';
    if (avail?.toLowerCase().includes('tomorrow')) return '#4f46e5';
    return '#64748b';
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{t.findAdvocate}</h2>
        <p style={{ color: '#64748b' }}>
          {language === 'te' ? 'మీ బడ్జెట్ మరియు భాషకు తగిన ధృవీకరించబడిన లాయర్లను కనుగొనండి.' :
           language === 'hi' ? 'अपने बजट और भाषा के अनुसार सत्यापित वकीलों को खोजें।' :
           `Connect with ${advocates.length} verified legal specialists — filter by specialization, language, experience, budget, and availability.`}
        </p>
      </div>

      {/* Filter Panel */}
      <div className="filter-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={16} color="#4f46e5" />
            <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>Search & Filter Advocates</span>
            {activeFilterCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                color: 'white', fontSize: '0.72rem', fontWeight: '700',
                padding: '0.15rem 0.55rem', borderRadius: '20px'
              }}>
                {activeFilterCount} Active
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', cursor: 'pointer' }}>
                <X size={13} /> Clear All
              </button>
            )}
            <button onClick={() => setFiltersExpanded(!filtersExpanded)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: 'white', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#4f46e5', borderRadius: '8px', cursor: 'pointer' }}>
              {filtersExpanded ? 'Collapse' : 'Expand'} Filters
            </button>
          </div>
        </div>

        {/* Name Search - always visible */}
        <div style={{ marginTop: '1rem', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
            placeholder="Search advocate by name..."
            style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', outline: 'none', fontSize: '0.9rem', background: 'white' }}
          />
        </div>

        {filtersExpanded && (
          <div className="filter-grid" style={{ marginTop: '0.75rem' }}>
            {/* Specialization */}
            <div className="filter-field">
              <label><Briefcase size={11} style={{ display: 'inline', marginRight: '4px' }} />Practice Area</label>
              <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
                <option value="">All Specializations</option>
                {specializations.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            {/* Language */}
            <div className="filter-field">
              <label><Globe size={11} style={{ display: 'inline', marginRight: '4px' }} />Language Spoken</label>
              <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
                <option value="">All Languages</option>
                {ALL_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Experience */}
            <div className="filter-field">
              <label>Min. Experience (yrs)</label>
              <select value={minExp} onChange={e => setMinExp(e.target.value)}>
                <option value="">Any Experience</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="10">10+ Years</option>
                <option value="15">15+ Years</option>
                <option value="20">20+ Years</option>
              </select>
            </div>

            {/* Location */}
            <div className="filter-field">
              <label><MapPin size={11} style={{ display: 'inline', marginRight: '4px' }} />Location / City</label>
              <input
                type="text"
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                placeholder="e.g. Mumbai, Delhi..."
              />
            </div>

            {/* Max Fee */}
            <div className="filter-field">
              <label><DollarSign size={11} style={{ display: 'inline', marginRight: '4px' }} />Max Fee (₹)</label>
              <select value={maxFee} onChange={e => setMaxFee(e.target.value)}>
                <option value="">Any Budget</option>
                <option value="800">Up to ₹800</option>
                <option value="1200">Up to ₹1,200</option>
                <option value="2000">Up to ₹2,000</option>
                <option value="3000">Up to ₹3,000</option>
                <option value="5000">Up to ₹5,000</option>
              </select>
            </div>

            {/* Min Rating */}
            <div className="filter-field">
              <label><Star size={11} style={{ display: 'inline', marginRight: '4px' }} />Minimum Rating</label>
              <select value={minRating} onChange={e => setMinRating(e.target.value)}>
                <option value="">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.7">4.7+ Stars</option>
              </select>
            </div>

            {/* Availability */}
            <div className="filter-field">
              <label>Availability</label>
              <select value={availability} onChange={e => setAvailability(e.target.value)}>
                <option value="">Any Availability</option>
                {AVAILABILITY_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Verified Only */}
            <div className="filter-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label className="filter-toggle-row" style={{ marginBottom: 0, width: '100%', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={e => setVerifiedOnly(e.target.checked)}
                />
                <ShieldCheck size={14} color="#4f46e5" />
                Verified Only
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!loading && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing <strong style={{ color: '#0f172a' }}>{advocates.length}</strong> advocate{advocates.length !== 1 ? 's' : ''}
            {selectedCat && specializations.find(s => String(s.id) === selectedCat) ? ` in ${specializations.find(s => String(s.id) === selectedCat)?.name}` : ''}
          </span>
        </div>
      )}

      {/* Advocates Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton skeleton-rect" style={{ height: '300px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : advocates.length === 0 ? (
        <div className="glass-card-no-hover empty-state-wrapper">
          <Search size={48} className="empty-state-icon" />
          <h4>No Matching Advocates Found</h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
            Try clearing some filters — reduce the max fee, remove location restrictions, or broaden the specialization.
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-secondary" style={{ marginTop: '0.5rem' }}>
              <X size={14} /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="advocate-grid">
          {advocates.map((adv) => {
            const langs = getLangArray(adv.languages);
            return (
              <div
                key={adv.id}
                className="glass-card advocate-card"
                onClick={() => handleSelectAdvocate(adv.id)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px', position: 'relative' }}
              >
                {/* Match score gauge */}
                {adv.matchScore !== undefined && (
                  <div className="match-ring-absolute">
                    <svg className="gauge-svg" viewBox="0 0 36 36" style={{ width: '48px', height: '48px' }}>
                      <path className="gauge-bg" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="gauge-fill" strokeWidth="3" strokeDasharray={`${adv.matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="21.5" className="gauge-text" textAnchor="middle" style={{ fontSize: '9px', fill: '#0f172a' }}>
                        {adv.matchScore}%
                      </text>
                    </svg>
                  </div>
                )}

                {/* Top */}
                <div>
                  {/* Photo */}
                  <div className="advocate-photo-wrapper">
                    {adv.profile_photo ? (
                      <img src={adv.profile_photo} alt={adv.name} className="advocate-photo" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <User size={36} />
                      </div>
                    )}
                  </div>

                  {/* Verified & Experience */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    {adv.is_verified ? (
                      <span className="badge-verified"><ShieldCheck size={12} /> Verified</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', background: '#fffbeb', color: '#b45309', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>
                        Pending
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>
                      {adv.experience_years}y exp
                    </span>
                    {adv.cases_handled && (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        · {adv.cases_handled} cases
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.15rem' }}>
                    {adv.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                    {adv.specialization_name || 'General Counsel'}
                  </span>

                  {/* Language Chips */}
                  {langs.length > 0 && (
                    <div className="lang-chips" style={{ marginBottom: '0.6rem' }}>
                      {langs.slice(0, 4).map(l => (
                        <span key={l} className="lang-chip lang-chip-sm">{l}</span>
                      ))}
                      {langs.length > 4 && (
                        <span className="lang-chip lang-chip-sm" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                          +{langs.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    "{adv.biography?.substring(0, 80)}..."
                  </p>
                </div>

                {/* Bottom */}
                <div>
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '0.6rem 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
                    <span>📍 {adv.location}</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>₹{parseInt(adv.consultation_fee)} / call</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: getRatingColor(adv.rating) }}>
                      <Star size={12} fill={getRatingColor(adv.rating)} /> {adv.rating} Stars
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '500', color: getAvailabilityColor(adv.availability) }}>
                      🕐 {adv.availability}
                    </span>
                  </div>

                  {adv.matchReason && (
                    <div style={{ background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.68rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      🎯 {adv.matchReason}
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.5rem', fontSize: '0.82rem', borderRadius: '10px' }}
                  >
                    View Profile & Book <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
