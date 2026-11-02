'use client';
import { useState, useEffect } from 'react';
import { OfflineDB, DraftCitizen, CachedScheme, SyncLog } from '../../lib/offline-db';
import { apiClient } from '../../lib/api-client';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  CloudUpload, 
  HardDriveDownload,
  Trash2,
  Database,
  BookOpen,
  History,
  AlertCircle
} from 'lucide-react';

export default function OfflineSyncPage() {
  const [drafts, setDrafts] = useState<DraftCitizen[]>([]);
  const [cachedSchemes, setCachedSchemes] = useState<CachedScheme[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCachingSchemes, setIsCachingSchemes] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const loadLocalData = async () => {
    try {
      const d = await OfflineDB.getDraftCitizens();
      const s = await OfflineDB.getCachedSchemes();
      const l = await OfflineDB.getSyncLogs();
      setDrafts(d);
      setCachedSchemes(s);
      setSyncLogs(l);
    } catch (e) {
      console.error('Failed loading IndexedDB data', e);
    }
  };

  useEffect(() => {
    loadLocalData();
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      loadLocalData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      loadLocalData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (drafts.length === 0) return;
    setIsSyncing(true);
    setStatusMsg('');

    try {
      const res = await OfflineDB.syncAllDrafts();
      await loadLocalData();

      if (res.syncedCount > 0 && res.failedCount === 0) {
        setStatusMsg(`✓ Successfully synchronized ${res.syncedCount} citizen records to central Aayu AI database!`);
      } else if (res.syncedCount > 0) {
        setStatusMsg(`⚠️ Synchronized ${res.syncedCount} records. ${res.failedCount} could not be uploaded.`);
      } else if (res.failedCount > 0) {
        setStatusMsg(`⚠️ Synchronization encountered issues with ${res.failedCount} records.`);
      }
    } catch (e) {
      setStatusMsg('Sync failed. Please verify central backend connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePrecacheSchemes = async () => {
    setIsCachingSchemes(true);
    setStatusMsg('');
    try {
      const fallback: CachedScheme[] = [
        {
          id: 'IGNOAPS',
          name: 'Indira Gandhi National Old Age Pension Scheme',
          category: 'Social Security & Pension',
          benefits: 'Rs. 500/month from age 60, Rs. 800/month from age 80',
          eligibility_criteria: { min_age: 60, bpl_required: true, max_income: 2500 },
          cached_at: new Date().toISOString()
        },
        {
          id: 'AB_PMJAY_70',
          name: 'Ayushman Bharat PM-JAY Senior Citizen Coverage',
          category: 'Universal Health Insurance',
          benefits: 'Rs. 5,00,000 per family per year',
          eligibility_criteria: { min_age: 70, universal: true },
          cached_at: new Date().toISOString()
        },
        {
          id: 'RVY',
          name: 'Rashtriya Vayoshri Yojana',
          category: 'Assistive Devices & Mobility Support',
          benefits: 'Free spectacles, hearing aids, wheelchairs, walking sticks, and knee braces',
          eligibility_criteria: { min_age: 60, bpl_or_income_at_or_below: 3000 },
          cached_at: new Date().toISOString()
        },
        {
          id: 'AVYAY',
          name: 'Atal Vayo Abhyuday Yojana',
          category: 'Elderly Care & Shelter Support',
          benefits: 'Shelter, healthcare, and nutrition in senior citizen homes',
          eligibility_criteria: { min_age: 60 },
          cached_at: new Date().toISOString()
        },
        {
          id: 'SACRED',
          name: 'Senior Able Citizens for Re-Employment in Dignity',
          category: 'Employment & Dignified Livelihood',
          benefits: 'Matching with organisations that need experienced senior workers',
          eligibility_criteria: { min_age: 60 },
          cached_at: new Date().toISOString()
        }
      ];

      let schemes = fallback;
      try {
        const res = await apiClient.get('/schemes/');
        if (Array.isArray(res.data) && res.data.length > 0) {
          schemes = res.data.map((scheme: any) => {
            const benefits = scheme.benefit_details || {};
            const benefitText = Object.values(benefits).map(String).join(' · ');
            return {
              id: scheme.scheme_id,
              name: scheme.name,
              category: scheme.category || '',
              benefits: benefitText || scheme.name,
              eligibility_criteria: { min_age: scheme.min_age, rules: scheme.rules || [] },
              cached_at: new Date().toISOString()
            };
          });
        }
      } catch (fetchErr) {
        console.warn('Scheme API unavailable, caching the built-in catalogue', fetchErr);
      }

      await OfflineDB.cacheSchemes(schemes);
      await loadLocalData();
      setStatusMsg(`✓ Pre-cached ${schemes.length} welfare schemes into device IndexedDB storage.`);
    } catch (e) {
      console.error('Failed to precache schemes', e);
      setStatusMsg('Failed to pre-cache schemes.');
    } finally {
      setIsCachingSchemes(false);
    }
  };

  const handleDeleteDraft = async (id?: number) => {
    if (!id) return;
    await OfflineDB.deleteDraftCitizen(id);
    await loadLocalData();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <RefreshCw size={26} color="#2dd4bf" />
          <span>Offline PWA & IndexedDB Sync Hub</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
          Ultra-resilient offline storage engine engineered for remote villages with zero connectivity
        </p>
      </div>

      {/* Network Status Banner */}
      <div 
        className="card" 
        style={{ 
          background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderColor: isOnline ? 'rgba(52, 211, 153, 0.3)' : 'rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '50%', 
              background: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: isOnline ? '#34d399' : '#fbbf24'
            }}
          >
            {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: isOnline ? '#34d399' : '#fbbf24' }}>
              {isOnline ? 'Online: Connected to Central Cloud' : 'Offline Mode: Local IndexedDB Active'}
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              {isOnline ? 'Real-time LangGraph multi-agent orchestration available' : 'Registrations cached in browser storage with zero data loss'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleManualSync} 
            disabled={!isOnline || drafts.length === 0 || isSyncing}
            className="btn btn-primary"
            style={{ fontSize: '0.9rem' }}
          >
            <CloudUpload size={16} />
            <span>{isSyncing ? 'Syncing...' : `Sync Queue (${drafts.length})`}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div 
          className="animate-fade-in"
          style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem 1.25rem', 
            borderRadius: 'var(--radius-sm)', 
            background: /fail|⚠|issue/i.test(statusMsg) ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
            border: /fail|⚠|issue/i.test(statusMsg) ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(52, 211, 153, 0.35)', 
            color: /fail|⚠|issue/i.test(statusMsg) ? '#fbbf24' : '#34d399',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Storage Health Metrics Grid */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#38bdf8', marginBottom: '0.4rem' }}>
            <Database size={18} />
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IndexedDB Storage</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>vayosetu_field_db</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Version 1.0 (Persistent)</div>
        </div>

        <div className="card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fbbf24', marginBottom: '0.4rem' }}>
            <HardDriveDownload size={18} />
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Draft Queue</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{drafts.length} Records</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Awaiting cloud upload</div>
        </div>

        <div className="card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399', marginBottom: '0.4rem' }}>
            <BookOpen size={18} />
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Offline Schemes</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{cachedSchemes.length} Cached</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Ready for offline consultation</div>
        </div>
      </div>

      {/* Pending Drafts Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDriveDownload size={18} color="#2dd4bf" />
            <span>Pending Local Records Queue ({drafts.length})</span>
          </h3>
          {drafts.length > 0 && (
            <button 
              onClick={() => OfflineDB.clearDraftCitizens().then(loadLocalData)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', color: '#fb7185' }}
            >
              Clear All
            </button>
          )}
        </div>

        {drafts.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#34d399' }}>
            <CheckCircle2 size={36} style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>All local records are synchronized with central cloud server.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Zero pending backlog in device storage.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {drafts.map((d) => (
              <div 
                key={d._id} 
                style={{ 
                  padding: '1rem 1.2rem', 
                  background: 'rgba(5, 8, 17, 0.7)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{d.name}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginLeft: '0.5rem' }}>
                    ({d.age} Yrs, {d.gender}) — {d.district}, {d.state}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Saved locally: {new Date(d.created_at).toLocaleTimeString()} • Phone: {d.mobile_number}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-warning">
                    IndexedDB Stored
                  </span>
                  <button 
                    onClick={() => handleDeleteDraft(d._id)}
                    style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '4px' }}
                    title="Delete Draft"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-Cached Welfare Schemes Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="#38bdf8" />
            <span>Pre-Cached Welfare Schemes Catalog</span>
          </h3>
          <button 
            onClick={handlePrecacheSchemes}
            disabled={isCachingSchemes}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
          >
            <RefreshCw size={14} style={{ marginRight: '4px' }} />
            {isCachingSchemes ? 'Updating Cache...' : 'Download Schemes for Field Trip'}
          </button>
        </div>

        {cachedSchemes.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
            <p>No offline schemes pre-cached yet. Click "Download Schemes for Field Trip" to load criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '0.75rem' }}>
            {cachedSchemes.map((s) => (
              <div 
                key={s.id}
                style={{
                  padding: '0.9rem 1.1rem',
                  background: 'rgba(5, 8, 17, 0.5)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>{s.name}</strong>
                  <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', fontSize: '0.72rem' }}>
                    {s.category}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {s.benefits}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Logs Audit History */}
      {syncLogs.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="#c084fc" />
            <span>Recent Synchronization Logs</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {syncLogs.map((log, i) => (
              <div 
                key={i}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: log.status === 'SUCCESS' ? '#34d399' : '#fbbf24' }}>
                    [{log.status}]
                  </span>
                  <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                    {log.details || `Synced ${log.synced_count}/${log.total_attempted} records`}
                  </span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
