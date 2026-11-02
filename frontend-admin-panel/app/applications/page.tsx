'use client';
import { useEffect, useState } from 'react';
import { adminApi as apiClient } from '../../lib/admin-api';
import { Columns, Clock, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

type Application = {
  id: string;
  citizen_id: string;
  citizen_name?: string | null;
  scheme_id: string;
  status: string;
  remarks: string | null;
  created_at: string;
};

const PIPELINE = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'SUBMITTED', label: 'Submitted' },
  { status: 'DOCUMENT_VERIFIED', label: 'Docs Verified' },
  { status: 'FLAGGED_MISMATCH', label: 'Flagged' },
  { status: 'ESCALATED_DISTRICT', label: 'Escalated' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'REJECTED', label: 'Rejected' },
  { status: 'RENEWAL_DUE', label: 'Renewal Due' },
];

export default function ApplicationsKanban() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await apiClient.get('/applications/');
      setApplications(Array.isArray(res.data) ? res.data : []);
      setLoadError('');
    } catch (e) {
      console.error('Failed to fetch applications:', e);
      setLoadError('Applications could not be loaded. Confirm the backend is running on http://localhost:8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('appId', appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('appId');
    if (!appId) return;

    // Optimistic update
    setApplications(prev => prev.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    ));

    try {
      await apiClient.patch(`/applications/${appId}/status?status=${newStatus}`);
    } catch (err) {
      console.error('Failed to update status', err);
      // Revert on failure
      fetchApplications();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'DRAFT': return <Clock size={16} color="#64748b" />;
      case 'DOCUMENT_VERIFIED': return <Clock size={16} color="#3b82f6" />;
      case 'ESCALATED_DISTRICT':
      case 'FLAGGED_MISMATCH':
      case 'RENEWAL_DUE': return <ShieldAlert size={16} color="#f59e0b" />;
      case 'APPROVED': return <CheckCircle2 size={16} color="#10b981" />;
      case 'REJECTED': return <AlertCircle size={16} color="#ef4444" />;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Columns size={32} color="#4f46e5" />
          Application Processing Pipeline
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Drag and drop citizen applications to update their status and trigger downstream workflows.
        </p>
      </div>

      {loadError && (
        <p style={{ color: '#fda4af', marginBottom: '1rem' }}>{loadError}</p>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading applications...</div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
          {PIPELINE.map(({ status, label }) => (
            <div 
              key={status} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              style={{ 
                flex: '0 0 320px', 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1rem',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusIcon(status)}
                  {label}
                </h3>
                <span style={{ background: 'var(--bg-card)', padding: '0.1rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {applications.filter(a => a.status === status).length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {applications.filter(a => a.status === status).map(app => (
                  <div 
                    key={app.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    className="card"
                    style={{ 
                      padding: '1rem', 
                      margin: 0, 
                      cursor: 'grab', 
                      borderLeft: status === 'APPROVED' ? '3px solid #10b981' : 
                                 status === 'ESCALATED_DISTRICT' || status === 'FLAGGED_MISMATCH' ? '3px solid #f59e0b' : 
                                 status === 'REJECTED' ? '3px solid #ef4444' : '3px solid transparent'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: '0.25rem' }}>
                      #{app.id.split('-')[0]}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      {app.citizen_name || `Citizen ${app.citizen_id.substring(0, 8)}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#818cf8', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {app.scheme_id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
