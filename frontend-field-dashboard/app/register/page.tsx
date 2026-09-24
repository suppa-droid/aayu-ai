'use client';
import { useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { OfflineStorageManager } from '../../lib/offline-cache';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  User, 
  MapPin, 
  IndianRupee, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  WifiOff 
} from 'lucide-react';

export default function RegisterCitizenPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    age: 65,
    gender: 'Female',
    monthly_income: 3000,
    is_bpl: true,
    caste_category: 'General',
    disability_percentage: 0,
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    mobile_number: '9876543210',
    has_aadhaar: true,
    has_bpl_card: true,
    has_bank_account: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (!/^[6-9]\d{9}$/.test(formData.mobile_number.trim())) {
      setErrorMsg('Enter a valid 10-digit Indian mobile number.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (!navigator.onLine) {
        await OfflineStorageManager.saveDraftCitizen(formData);
        setSuccessMsg('⚡ Offline Mode: Senior Citizen saved to local IndexedDB! Will auto-sync when connected.');
        setTimeout(() => router.push('/offline-sync'), 1500);
        return;
      }

      await apiClient.post('/citizens/', formData);
      setSuccessMsg('✓ Beneficiary successfully onboarded into Aayu AI Registry!');
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status && status < 500) {
        const detail = err.response?.data?.detail;
        setErrorMsg(typeof detail === 'string' ? detail : 'Registration was rejected. Check the form and try again.');
        return;
      }
      console.error('API submission failed, buffering to IndexedDB:', err);
      await OfflineStorageManager.saveDraftCitizen(formData);
      setSuccessMsg('Network delay detected: beneficiary saved to the local queue and will sync when the connection returns.');
      setTimeout(() => router.push('/offline-sync'), 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.4) 0%, rgba(6, 182, 212, 0.2) 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#2dd4bf'
            }}
          >
            <UserPlus size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>Senior Citizen Beneficiary Onboarding</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Direct village-level registration with deterministic eligibility baseline profiling
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="animate-fade-in" style={{ margin: '1.25rem 0', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#fda4af', fontWeight: 600 }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div 
            className="animate-fade-in"
            style={{ 
              margin: '1.25rem 0', 
              padding: '1rem 1.25rem', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(16, 185, 129, 0.15)', 
              border: '1px solid rgba(52, 211, 153, 0.35)', 
              color: '#34d399',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          {/* Section 1: Demographics */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ color: '#2dd4bf', fontSize: '0.96rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={16} />
              <span>1. Demographics & Identity</span>
            </h4>
            <div className="grid-3">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Full Legal Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-control" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Kaushalya Devi" 
                />
              </div>
              <div className="form-group">
                <label>Age (Years)</label>
                <input 
                  type="number" 
                  name="age" 
                  className="form-control" 
                  value={formData.age} 
                  onChange={handleChange} 
                  required 
                  min={50} 
                  max={120} 
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Social Category / Caste</label>
                <select name="caste_category" className="form-control" value={formData.caste_category} onChange={handleChange}>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Disability % (if any)</label>
                <input 
                  type="number" 
                  name="disability_percentage" 
                  className="form-control" 
                  value={formData.disability_percentage} 
                  onChange={handleChange} 
                  min={0} 
                  max={100} 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial & Location */}
          <div style={{ marginBottom: '1.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <h4 style={{ color: '#2dd4bf', fontSize: '0.96rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IndianRupee size={16} />
              <span>2. Financial & Welfare Profile</span>
            </h4>
            <div className="grid-3">
              <div className="form-group">
                <label>Monthly Household Income (₹)</label>
                <input 
                  type="number" 
                  name="monthly_income" 
                  className="form-control" 
                  value={formData.monthly_income} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input 
                  type="text" 
                  name="state" 
                  className="form-control" 
                  value={formData.state} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>District / Tehsil</label>
                <input 
                  type="text" 
                  name="district" 
                  className="form-control" 
                  value={formData.district} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Mobile Number (For SMS & Voice Briefings)</label>
                <input 
                  type="text" 
                  name="mobile_number" 
                  className="form-control" 
                  value={formData.mobile_number} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Verification Checkboxes */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <h4 style={{ color: '#2dd4bf', fontSize: '0.96rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} />
              <span>3. Entitlement Credentials</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  background: formData.is_bpl ? 'rgba(13, 148, 136, 0.15)' : 'rgba(5, 8, 17, 0.6)', 
                  border: `1px solid ${formData.is_bpl ? '#2dd4bf' : 'var(--border-subtle)'}`,
                  padding: '0.9rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer' 
                }}
              >
                <input 
                  type="checkbox" 
                  name="is_bpl" 
                  checked={formData.is_bpl} 
                  onChange={handleChange} 
                  style={{ width: '18px', height: '18px', accentColor: '#0d9488' }} 
                />
                <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>BPL Ration Card Holder</span>
              </label>

              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  background: formData.has_aadhaar ? 'rgba(13, 148, 136, 0.15)' : 'rgba(5, 8, 17, 0.6)', 
                  border: `1px solid ${formData.has_aadhaar ? '#2dd4bf' : 'var(--border-subtle)'}`,
                  padding: '0.9rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer' 
                }}
              >
                <input 
                  type="checkbox" 
                  name="has_aadhaar" 
                  checked={formData.has_aadhaar} 
                  onChange={handleChange} 
                  style={{ width: '18px', height: '18px', accentColor: '#0d9488' }} 
                />
                <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Aadhaar Card Linked</span>
              </label>

              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  background: formData.has_bpl_card ? 'rgba(13, 148, 136, 0.15)' : 'rgba(5, 8, 17, 0.6)', 
                  border: `1px solid ${formData.has_bpl_card ? '#2dd4bf' : 'var(--border-subtle)'}`,
                  padding: '0.9rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer' 
                }}
              >
                <input 
                  type="checkbox" 
                  name="has_bpl_card" 
                  checked={formData.has_bpl_card} 
                  onChange={handleChange} 
                  style={{ width: '18px', height: '18px', accentColor: '#0d9488' }} 
                />
                <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>BPL Certificate / Card</span>
              </label>

              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem', 
                  background: formData.has_bank_account ? 'rgba(13, 148, 136, 0.15)' : 'rgba(5, 8, 17, 0.6)', 
                  border: `1px solid ${formData.has_bank_account ? '#2dd4bf' : 'var(--border-subtle)'}`,
                  padding: '0.9rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer' 
                }}
              >
                <input 
                  type="checkbox" 
                  name="has_bank_account" 
                  checked={formData.has_bank_account} 
                  onChange={handleChange} 
                  style={{ width: '18px', height: '18px', accentColor: '#0d9488' }} 
                />
                <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Direct Benefit Bank A/C</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem' }} 
            disabled={isSubmitting}
          >
            <UserPlus size={20} />
            <span>{isSubmitting ? 'Registering Citizen...' : 'Complete Registration & Save Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
