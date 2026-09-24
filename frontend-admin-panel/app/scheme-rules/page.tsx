'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/admin-api';
import { ScrollText, ShieldCheck, Code, BookOpen, Layers } from 'lucide-react';

export default function SchemeRulesPage() {
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await adminApi.get('/admin/system/rules');
      setRules(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ScrollText size={28} color="#c084fc" />
          <span>Deterministic Scheme Rules Engine Matrix (Level 3)</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
          Inspect active deterministic scheme rule specifications loaded into the evaluation engine.
        </p>
      </div>

      <div className="grid-2">
        {rules.map((scheme) => (
          <div key={scheme.scheme_id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#c084fc', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  {scheme.scheme_id}
                </span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.15rem', color: 'var(--text-primary)' }}>
                  {scheme.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.2rem' }}>
                  {scheme.sponsoring_agency}
                </p>
              </div>

              <span className="badge badge-violet">
                {scheme.category}
              </span>
            </div>

            {/* Rules Code List */}
            <div 
              style={{ 
                marginTop: '1.25rem', 
                background: 'rgba(5, 8, 17, 0.85)', 
                padding: '1.1rem', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                <Code size={15} />
                <span>Deterministic Logic Criteria ({scheme.rules?.length || 0}):</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scheme.rules?.map((r: any, idx: number) => (
                  <div 
                    key={idx} 
                    style={{ 
                      fontSize: '0.85rem', 
                      background: 'rgba(255, 255, 255, 0.03)', 
                      padding: '0.6rem 0.8rem', 
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <code style={{ color: '#38bdf8', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
                      {r.operator === 'any'
                        ? `ANY (${(r.conditions || []).map((c: any) => `${c.field} ${c.operator} ${String(c.value)}`).join(' OR ')})`
                        : `${r.field} ${r.operator} ${String(r.value)}`}
                    </code>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      ↳ {r.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
