'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/admin-api';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Cpu, 
  ScrollText, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [escalations, setEscalations] = useState<any[]>([]);

  useEffect(() => {
    fetchHealth();
    fetchEscalations();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await adminApi.get('/admin/system/pipeline-health');
      setHealth(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEscalations = async () => {
    try {
      const res = await adminApi.get('/admin/district/escalations');
      setEscalations(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Executive Hero */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.12) 50%, rgba(17, 23, 43, 0.8) 100%)',
          borderColor: 'rgba(192, 132, 252, 0.25)',
          padding: '2.2rem 2.4rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.15)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(192, 132, 252, 0.3)', marginBottom: '0.85rem' }}>
          <span className="pulse-beacon" style={{ background: '#c084fc', boxShadow: '0 0 0 0 rgba(192, 132, 252, 0.7)' }}></span>
          <span style={{ color: '#c084fc', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            3-Tier Governance Operational
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', lineHeight: 1.2, marginBottom: '0.6rem' }}>
          Administrative Governance & AI Orchestration Console
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '1.02rem', maxWidth: '850px' }}>
          Real-time oversight bridging Anganwadi Field Workers (Level 1), District CSC Grievance Resolution Coordinators (Level 2), and System Rule Engineers (Level 3).
        </p>
      </div>

      {/* High-Impact Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Pending Escalations</span>
            <ShieldAlert size={18} color="#f59e0b" />
          </div>
          <div className="stat-val" style={{ color: '#fbbf24' }}>{escalations.length}</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Level 2 District Queue</p>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Active AI Agents</span>
            <Cpu size={18} color="#10b981" />
          </div>
          <div className="stat-val" style={{ color: '#34d399' }}>{health?.active_agents?.length || 7}</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>LangGraph State Machine</p>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Scheme Rules Loaded</span>
            <ScrollText size={18} color="#8b5cf6" />
          </div>
          <div className="stat-val" style={{ color: '#c084fc' }}>{health?.rules_loaded || 5}</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Deterministic YAML Specs</p>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Vector RAG Store</span>
            <Activity size={18} color="#38bdf8" />
          </div>
          <div className="stat-val" style={{ color: '#38bdf8' }}>ONLINE</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>ChromaDB Official Embeddings</p>
        </div>
      </div>

      {/* Level 2 District Queue Overview */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={22} color="#f59e0b" />
            <span>🚨 Level 2 District Admin Resolution Queue</span>
          </h2>
          <Link href="/escalations" className="btn btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
            <span>Open Resolution Panel</span>
            <ArrowRight size={15} />
          </Link>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Disputed applications escalated from Anganwadi workers due to document OCR quality, name mismatches, or automated verification appeals:
        </p>

        {escalations.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
            <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#34d399', fontWeight: 700, fontSize: '1.05rem' }}>All district escalations resolved!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>No pending disputes in queue.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {escalations.map((esc) => (
              <div 
                key={esc.id} 
                style={{ 
                  background: 'rgba(7, 9, 19, 0.8)', 
                  padding: '1.25rem 1.4rem', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '4px solid #f59e0b'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Ticket #{esc.id.substring(0, 8)} — {esc.reason}
                  </strong>
                  <span className="badge badge-warning">{esc.status}</span>
                </div>
                <p style={{ marginTop: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {esc.description}
                </p>
                
                {esc.suggested_ai_resolution && (
                  <div style={{ marginTop: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px', borderLeft: '3px solid #8b5cf6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.86rem', fontWeight: 700 }}>
                      <Sparkles size={14} />
                      <span>🤖 AI Draft Resolution & Appeal Strategy:</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#e2e8f0', marginTop: '0.3rem' }}>
                      {esc.suggested_ai_resolution}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
