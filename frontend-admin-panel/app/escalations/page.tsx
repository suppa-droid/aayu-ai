'use client';
import { useEffect, useState, useRef } from 'react';
import { adminApi } from '../../lib/admin-api';
import { 
  ShieldAlert, CheckCircle2, Sparkles, RefreshCw, 
  Clock, AlertTriangle, FileText, User, ShieldCheck, Activity
} from 'lucide-react';

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [resolutionNotes, setResolutionNotes] = useState<{ [key: string]: string }>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchEscalations = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const res = await adminApi.get('/admin/district/escalations', {
        params: { status: statusFilter },
      });
      if (Array.isArray(res.data)) {
        // Sort newest first
        const sorted = [...res.data].sort((a, b) => {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        setEscalations(sorted);
      }
      setLastSynced(new Date());
    } catch (e) {
      console.error('Failed to fetch escalations:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch and auto-polling every 3 seconds for real-time synchronization
  useEffect(() => {
    fetchEscalations(true);
    const interval = setInterval(() => {
      fetchEscalations(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleNoteChange = (id: string, text: string) => {
    setResolutionNotes((prev) => ({ ...prev, [id]: text }));
  };

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      const note = resolutionNotes[id] || 'Approved after District CSC manual document verification & affidavit check';
      await adminApi.post(`/admin/district/escalations/${id}/resolve`, null, {
        params: { resolution_notes: note },
      });
      setSuccessToast(`Ticket #${id.substring(0, 8)} successfully resolved & cleared!`);
      setTimeout(() => setSuccessToast(null), 4000);
      await fetchEscalations(true);
    } catch (e) {
      console.error('Failed to resolve escalation:', e);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontWeight: 600,
          fontSize: '0.92rem',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <CheckCircle2 size={20} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header with Live Sync Status & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(245, 158, 11, 0.12)', padding: '0.3rem 0.8rem', borderRadius: '999px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ color: '#f59e0b', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Level 2 District Governance
            </span>
          </div>
          <h2 style={{ fontSize: '1.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <ShieldAlert size={28} color="#f59e0b" />
            <span>Dispute &amp; Escalation Queue</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Real-time queue receiving instant field escalations, OCR discrepancies, and AI fraud alerts.
          </p>
        </div>

        {/* Live Indicator & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <Activity size={14} color="#10b981" />
            <span>Live Polling (3s) · Synced {lastSynced.toLocaleTimeString()}</span>
          </div>

          <button
            onClick={() => fetchEscalations(true)}
            disabled={isRefreshing}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['OPEN', 'RESOLVED', 'ALL'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: statusFilter === filter ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
              background: statusFilter === filter ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: statusFilter === filter ? '#f59e0b' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {filter === 'OPEN' ? `Active Pending (${escalations.filter(e => e.status === 'OPEN').length})` : filter}
          </button>
        ))}
      </div>

      {/* Escalations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {escalations.map((esc) => {
          const isResolved = esc.status === 'RESOLVED';
          return (
            <div 
              key={esc.id} 
              className="card" 
              style={{ 
                borderLeft: isResolved ? '5px solid #10b981' : '5px solid #f59e0b',
                marginBottom: 0,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', color: isResolved ? '#10b981' : '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Ticket #{esc.id.substring(0, 8)}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {esc.created_at ? new Date(esc.created_at).toLocaleString() : 'Just now'}
                    </span>
                    <span style={{ fontSize: '0.74rem', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: '#94a3b8' }}>
                      Officer: {esc.field_worker_id || 'FW-KIOSK'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', margin: '0.15rem 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} color={isResolved ? '#10b981' : '#f59e0b'} />
                    <span>{esc.reason?.replace(/_/g, ' ')}</span>
                  </h3>

                  <p style={{ color: '#e2e8f0', fontSize: '0.92rem', margin: '0.4rem 0 0 0', background: 'rgba(0,0,0,0.25)', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <strong style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'block', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Finding &amp; Field Note:</strong>
                    {esc.description}
                  </p>
                </div>

                <div>
                  <span className={`badge ${isResolved ? 'badge-eligible' : 'badge-warning'}`} style={{ fontSize: '0.84rem', padding: '0.35rem 0.75rem' }}>
                    {isResolved ? '✓ RESOLVED' : '⚠️ OPEN / PENDING'}
                  </span>
                </div>
              </div>

              {/* AI Suggested Resolution Box */}
              {esc.suggested_ai_resolution && (
                <div 
                  style={{ 
                    marginTop: '1.1rem', 
                    background: 'rgba(139, 92, 246, 0.08)', 
                    border: '1px solid rgba(139, 92, 246, 0.25)', 
                    padding: '0.95rem 1.15rem', 
                    borderRadius: 'var(--radius-sm)' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#c084fc', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    <Sparkles size={15} />
                    <span>🤖 AI Pre-Drafted Resolution &amp; Action Plan:</span>
                  </div>
                  <p style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                    {esc.suggested_ai_resolution}
                  </p>
                </div>
              )}

              {/* Resolution Form Controls (Only for OPEN tickets) */}
              {!isResolved ? (
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    District Administrator Resolution Order / Remarks:
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="e.g. Verified original physical document at CSC center. Name variation approved."
                      className="form-control"
                      style={{ flex: '1 1 380px', fontSize: '0.88rem' }}
                      value={resolutionNotes[esc.id] || ''}
                      onChange={(e) => handleNoteChange(esc.id, e.target.value)}
                    />
                    <button
                      onClick={() => handleResolve(esc.id)}
                      disabled={resolvingId === esc.id}
                      className="btn btn-success"
                      style={{ padding: '0.65rem 1.3rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.88rem' }}
                    >
                      <CheckCircle2 size={17} />
                      <span>{resolvingId === esc.id ? 'Resolving...' : '✓ Approve & Clear Escalation'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.84rem' }}>
                  <ShieldCheck size={16} />
                  <span>Resolution recorded in immutable audit log.</span>
                </div>
              )}
            </div>
          );
        })}

        {escalations.length === 0 && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <CheckCircle2 size={44} color="#34d399" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', color: '#34d399' }}>All District Escalations Resolved</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0.4rem auto 0' }}>
              No pending beneficiary appeals or document disputes waiting in queue. When field officers or AI flag anomalies, they will appear here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
