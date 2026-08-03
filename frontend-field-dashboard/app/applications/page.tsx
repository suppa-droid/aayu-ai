'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { FileText, CheckCircle2, Clock, AlertCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await apiClient.get('/applications/');
      setApps(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-eligible"><CheckCircle2 size={13} /> APPROVED</span>;
      case 'REJECTED':
        return <span className="badge badge-ineligible"><AlertCircle size={13} /> REJECTED</span>;
      case 'ESCALATED':
        return <span className="badge badge-warning"><ShieldAlert size={13} /> ESCALATED L2</span>;
      default:
        return <span className="badge badge-info"><Clock size={13} /> {status || 'IN_PROGRESS'}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={28} color="#2dd4bf" />
          <span>Active Applications & Lifecycle Tracker</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
          Track end-to-end benefit disbursement lifecycle across District CSC and State Portals
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              background: 'rgba(255, 255, 255, 0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--text-muted)'
            }}
          >
            <FileText size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>No active applications submitted yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '380px', margin: '0.4rem auto 0' }}>
            Run an AI evaluation from the dashboard to submit applications directly on behalf of senior citizens.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {apps.map((app) => (
            <div key={app.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div 
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '10px', 
                      background: 'rgba(13, 148, 136, 0.15)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#2dd4bf',
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 700
                    }}
                  >
                    #{app.id.substring(0, 4)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem' }}>Application ID: {app.id}</h3>
                    <div style={{ display: 'flex', gap: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      <span>Scheme: <strong style={{ color: 'var(--text-primary)' }}>{app.scheme_id}</strong></span>
                      <span>•</span>
                      <span>Beneficiary: <strong style={{ color: 'var(--text-primary)' }}>{app.citizen_id}</strong></span>
                    </div>
                  </div>
                </div>

                <div>
                  {getStatusBadge(app.status)}
                </div>
              </div>

              {app.remarks && (
                <div 
                  style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(244, 63, 94, 0.08)', 
                    borderRadius: 'var(--radius-sm)', 
                    borderLeft: '3px solid #f43f5e',
                    fontSize: '0.88rem',
                    color: '#fca5a5'
                  }}
                >
                  <strong>Admin Remarks:</strong> {app.remarks}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
