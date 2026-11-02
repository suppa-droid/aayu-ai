'use client';
import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  BookOpen, 
  ArrowRightCircle, 
  Lightbulb,
  Send
} from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { getUser } from '../lib/auth';

interface Counterfactual {
  missing_criteria: string[];
  actionable_steps: string[];
  qualifying_scenarios: string[];
}

interface EligibilityResultProps {
  evaluation: {
    scheme_id: string;
    scheme_name: string;
    status: 'ELIGIBLE' | 'INELIGIBLE' | 'CONDITIONALLY_ELIGIBLE';
    score: number;
    matched_criteria: string[];
    unmatched_criteria: string[];
    counterfactual: Counterfactual;
    rag_citations: string[];
  };
  citizenId: string;
}

export default function EligibilityResult({ evaluation, citizenId }: EligibilityResultProps) {
  const [showCitations, setShowCitations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const canFile = evaluation.status === 'ELIGIBLE';
  const isConditional = evaluation.status === 'CONDITIONALLY_ELIGIBLE';

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/applications/', {
        citizen_id: citizenId,
        scheme_id: evaluation.scheme_id,
        field_worker_id: getUser()?.username || 'field_worker'
      });
      setSubmitted(true);
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.detail || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (evaluation.status === 'ELIGIBLE') {
      return <span className="badge badge-eligible"><CheckCircle2 size={13} /> ELIGIBLE</span>;
    }
    if (evaluation.status === 'CONDITIONALLY_ELIGIBLE') {
      return <span className="badge badge-warning"><HelpCircle size={13} /> CONDITIONAL</span>;
    }
    return <span className="badge badge-ineligible"><XCircle size={13} /> INELIGIBLE</span>;
  };

  return (
    <div 
      className="card animate-fade-in" 
      style={{ 
        borderLeft: `5px solid ${canFile ? '#10b981' : isConditional ? '#f59e0b' : '#f43f5e'}`,
        marginBottom: '1.25rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{evaluation.scheme_name}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              ({evaluation.scheme_id})
            </span>
          </div>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Match Score Meter */}
      <div style={{ marginTop: '1rem', background: 'rgba(5, 8, 17, 0.6)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Rule & Policy Match Score</span>
          <strong style={{ color: canFile ? '#34d399' : isConditional ? '#fbbf24' : '#fb7185', fontFamily: 'JetBrains Mono' }}>
            {evaluation.score}%
          </strong>
        </div>
        <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${evaluation.score}%`, 
              background: canFile
                ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                : isConditional
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #f43f5e, #fb923c)',
              borderRadius: '4px',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>
      </div>

      {/* Matched Criteria */}
      <div style={{ marginTop: '1rem' }}>
        <h4 style={{ color: '#34d399', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle2 size={16} />
          <span>Satisfied Conditions ({evaluation.matched_criteria?.length || 0})</span>
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
          {(evaluation.matched_criteria || []).map((item, idx) => (
            <span 
              key={idx} 
              style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.25)', 
                color: '#6ee7b7', 
                fontSize: '0.82rem', 
                padding: '0.3rem 0.65rem', 
                borderRadius: 'var(--radius-sm)' 
              }}
            >
              ✓ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Counterfactual Explainability (Why Ineligible & Path to Qualify) */}
      {!canFile && (
        <div 
          style={{ 
            marginTop: '1.2rem', 
            background: 'rgba(244, 63, 94, 0.07)', 
            border: '1px solid rgba(244, 63, 94, 0.22)', 
            padding: '1.2rem', 
            borderRadius: 'var(--radius-md)' 
          }}
        >
          <h4 style={{ color: '#fb7185', fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.8rem' }}>
            <Sparkles size={17} color="#fb7185" />
            <span>Counterfactual Explainability Engine</span>
          </h4>
          
          <div style={{ marginBottom: '0.8rem' }}>
            <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Missing Criteria:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', color: '#fca5a5', fontSize: '0.88rem' }}>
              {(evaluation.counterfactual?.missing_criteria || []).map((crit, idx) => (
                <li key={idx}>{crit}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '0.8rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #f59e0b' }}>
            <strong style={{ color: '#fde047', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lightbulb size={16} />
              <span>What would unlock this scheme?</span>
            </strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', color: '#fef08a', fontSize: '0.86rem' }}>
              {(evaluation.counterfactual?.qualifying_scenarios || []).map((scen, idx) => (
                <li key={idx}>{scen}</li>
              ))}
            </ul>
          </div>

          <div>
            <strong style={{ color: '#38bdf8', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowRightCircle size={16} />
              <span>Actionable Resolution Steps:</span>
            </strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', color: '#bae6fd', fontSize: '0.86rem' }}>
              {(evaluation.counterfactual?.actionable_steps || []).map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Expandable RAG Citations */}
      {evaluation.rag_citations?.length > 0 && (
        <div style={{ marginTop: '1.2rem' }}>
          <button
            onClick={() => setShowCitations(!showCitations)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: 0
            }}
          >
            <BookOpen size={15} />
            <span>{showCitations ? 'Hide Official RAG Citations' : `View ${evaluation.rag_citations.length} Official Scheme RAG Citations`}</span>
            {showCitations ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showCitations && (
            <div 
              className="animate-fade-in" 
              style={{ 
                marginTop: '0.75rem', 
                fontSize: '0.84rem', 
                color: 'var(--text-secondary)', 
                background: 'rgba(5, 8, 17, 0.75)', 
                padding: '1rem', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {evaluation.rag_citations.map((cite, idx) => (
                <p key={idx} style={{ marginTop: idx > 0 ? '0.5rem' : 0, lineHeight: 1.5 }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>[{idx + 1}]</span> {cite}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Submit Application Button for Eligible Schemes */}
      {canFile && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Official Application</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Forward this directly to the District Admin for processing.
            </p>
            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem' }}>{error}</p>}
          </div>
          
          {submitted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle2 size={16} />
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Application Submitted</span>
            </div>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmitApplication} 
              disabled={submitting}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
            >
              {submitting ? (
                <span className="animate-spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
              ) : (
                <Send size={14} />
              )}
              <span>{submitting ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
