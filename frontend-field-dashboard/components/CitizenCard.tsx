'use client';
import React from 'react';
import { MapPin, Phone, IndianRupee, Sparkles, ShieldCheck, HeartPulse } from 'lucide-react';

interface CitizenCardProps {
  citizen: {
    id: string;
    name: string;
    age: number;
    gender: string;
    monthly_income: number;
    is_bpl: boolean;
    caste_category?: string;
    disability_percentage?: number;
    state: string;
    district: string;
    mobile_number: string;
  };
  onEvaluate?: (id: string) => void;
  isEvaluating?: boolean;
}

export default function CitizenCard({ citizen, onEvaluate, isEvaluating }: CitizenCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="card card-interactive">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center' }}>
          <div 
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.4) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '1px solid rgba(45, 212, 191, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#2dd4bf',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            {getInitials(citizen.name)}
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {citizen.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <MapPin size={13} color="#06b6d4" />
              <span>{citizen.district}, {citizen.state}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="badge badge-info">
            {citizen.age} Yrs ({citizen.gender})
          </span>
          {citizen.is_bpl && (
            <span className="badge badge-eligible">
              BPL
            </span>
          )}
        </div>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '0.75rem', 
          margin: '1.1rem 0',
          padding: '0.85rem 1rem',
          background: 'rgba(5, 8, 17, 0.6)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <IndianRupee size={14} color="#f59e0b" />
          <span>Income: <strong style={{ color: 'var(--text-primary)' }}>₹{citizen.monthly_income?.toLocaleString()}</strong>/mo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Phone size={14} color="#38bdf8" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{citizen.mobile_number}</span>
        </div>
        {citizen.caste_category && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={14} color="#a855f7" />
            <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{citizen.caste_category}</strong></span>
          </div>
        )}
        {citizen.disability_percentage !== undefined && citizen.disability_percentage > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb7185' }}>
            <HeartPulse size={14} color="#fb7185" />
            <span>Disability: <strong>{citizen.disability_percentage}%</strong></span>
          </div>
        )}
      </div>

      {onEvaluate && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '0.92rem', padding: '0.8rem' }}
          onClick={() => onEvaluate(citizen.id)}
          disabled={isEvaluating}
        >
          <Sparkles size={16} />
          <span>{isEvaluating ? 'Evaluating Multi-Agent Engine...' : 'Run Multi-Agent Eligibility Engine'}</span>
        </button>
      )}
    </div>
  );
}
