'use client';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../lib/api-client';
import CitizenCard from '../components/CitizenCard';
import EligibilityResult from '../components/EligibilityResult';
import SchemeRoadmap from '../components/SchemeRoadmap';
import { 
  Sparkles, 
  Search, 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Filter, 
  Volume2, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Download
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBplOnly, setFilterBplOnly] = useState(false);
  const autoEvaluated = useRef<string | null>(null);

  useEffect(() => {
    fetchCitizens();
  }, []);

  useEffect(() => {
    if (!citizens.length || typeof window === 'undefined') return;
    const citizenId = new URLSearchParams(window.location.search).get('citizen');
    if (!citizenId || autoEvaluated.current === citizenId) return;
    if (!citizens.some((c) => c.id === citizenId)) return;
    autoEvaluated.current = citizenId;
    handleEvaluate(citizenId);
  }, [citizens]);

  const fetchCitizens = async () => {
    try {
      const res = await apiClient.get('/citizens/');
      setCitizens(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedCitizen) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF report.');
      return;
    }

    const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (ch) => (
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[ch]
    ));
    const eligibleSchemes = evaluations.filter(e => e.status === 'ELIGIBLE' || e.status === 'CONDITIONALLY_ELIGIBLE');
    const ineligibleSchemes = evaluations.filter(e => e.status === 'INELIGIBLE');

    const htmlContent = `
      <html>
        <head>
          <title>Aayu AI - Eligibility Report - ${selectedCitizen.name}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1e293b;
              padding: 40px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #0d9488;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              color: #0d9488;
              margin: 0;
            }
            .subtitle {
              font-size: 14px;
              color: #64748b;
              margin-top: 5px;
            }
            .citizen-info {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              border: 1px solid #e2e8f0;
            }
            .citizen-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .info-item strong {
              color: #475569;
            }
            .section-title {
              font-size: 18px;
              color: #0f172a;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 8px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .scheme-card {
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 15px;
            }
            .scheme-card.eligible {
              border-left: 5px solid #10b981;
              background: #f0fdf4;
            }
            .scheme-card.ineligible {
              border-left: 5px solid #ef4444;
              background: #fdf2f2;
            }
            .scheme-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .badge {
              font-size: 12px;
              padding: 3px 8px;
              border-radius: 12px;
              color: white;
            }
            .badge.eligible { background: #10b981; }
            .badge.ineligible { background: #ef4444; }
            .criteria-list {
              font-size: 13px;
              margin: 5px 0;
              padding-left: 20px;
            }
            .explainability {
              background: #fffbeb;
              border: 1px solid #fde68a;
              padding: 12px;
              border-radius: 6px;
              margin-top: 10px;
              font-size: 13px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print();" style="background: #0d9488; color: white; border: none; padding: 10px 20px; font-size: 14px; border-radius: 4px; cursor: pointer; font-weight: bold;">
              Print / Save as PDF
            </button>
          </div>

          <div class="header">
            <h1 class="title">Aayu AI (आयु) - Welfare Eligibility Report</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-IN')} | Powered by LangGraph & FAISS RAG</div>
          </div>

          <div class="citizen-info">
            <div class="citizen-grid">
              <div class="info-item"><strong>Name:</strong> ${esc(selectedCitizen.name)}</div>
              <div class="info-item"><strong>Mobile:</strong> ${esc(selectedCitizen.mobile_number)}</div>
              <div class="info-item"><strong>Age:</strong> ${esc(selectedCitizen.age)} Years</div>
              <div class="info-item"><strong>BPL Status:</strong> ${selectedCitizen.is_bpl ? 'Yes' : 'No'}</div>
              <div class="info-item"><strong>Monthly Income:</strong> ₹${esc(selectedCitizen.monthly_income?.toLocaleString())}</div>
              <div class="info-item"><strong>Location:</strong> ${esc(selectedCitizen.district)}, ${esc(selectedCitizen.state)}</div>
            </div>
          </div>

          <h2 class="section-title">Eligible Schemes (${eligibleSchemes.length})</h2>
          ${eligibleSchemes.length === 0 ? '<p>No eligible schemes found.</p>' : eligibleSchemes.map((ev: any) => `
            <div class="scheme-card eligible">
              <div class="scheme-header">
                <span>${esc(ev.scheme_name)} (${esc(ev.scheme_id)})</span>
                <span class="badge eligible">${ev.status}</span>
              </div>
              <div><strong>Match Score:</strong> ${ev.score}%</div>
              <div><strong>Satisfied Conditions:</strong></div>
              <ul class="criteria-list">
                ${(ev.matched_criteria || []).map((c: string) => `<li>${esc(c)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}

          <h2 class="section-title">Ineligible Schemes (${ineligibleSchemes.length})</h2>
          ${ineligibleSchemes.length === 0 ? '<p>No ineligible schemes found.</p>' : ineligibleSchemes.map((ev: any) => `
            <div class="scheme-card ineligible">
              <div class="scheme-header">
                <span>${esc(ev.scheme_name)} (${esc(ev.scheme_id)})</span>
                <span class="badge ineligible">${ev.status}</span>
              </div>
              <div><strong>Match Score:</strong> ${ev.score}%</div>
              
              <div class="explainability">
                <strong>Missing Criteria:</strong>
                <ul class="criteria-list" style="color: #b91c1c;">
                  ${(ev.counterfactual?.missing_criteria || ev.unmatched_criteria || []).map((c: string) => `<li>${esc(c)}</li>`).join('')}
                </ul>
                <strong style="margin-top: 5px; display: block;">Actionable Steps to Unlock:</strong>
                <ul class="criteria-list">
                  ${(ev.counterfactual?.actionable_steps || []).map((s: string) => `<li>${esc(s)}</li>`).join('')}
                </ul>
              </div>
            </div>
          `).join('')}

          <div class="footer">
            © ${new Date().getFullYear()} Aayu AI. This is a computer-generated verification report grounded in official scheme policy definitions.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleEvaluate = async (citizenId: string) => {
    setLoading(true);
    setEvaluations([]);
    setRecommendation(null);
    setRoadmaps([]);
    const found = citizens.find((c) => c.id === citizenId);
    if (!found) {
      setLoading(false);
      return;
    }
    setSelectedCitizen(found);

    try {
      const res = await apiClient.post(`/eligibility/evaluate-full/${citizenId}`);
      setEvaluations(res.data.evaluations || []);
      setRecommendation(res.data.recommendation_package || null);
      setRoadmaps(res.data.roadmaps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCitizens = citizens.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (c.name || '').toLowerCase().includes(query) ||
                          (c.district || '').toLowerCase().includes(query) ||
                          (c.mobile_number || '').includes(searchQuery);
    const matchesBpl = filterBplOnly ? c.is_bpl : true;
    return matchesSearch && matchesBpl;
  });

  const totalCitizens = citizens.length;
  const bplCitizens = citizens.filter(c => c.is_bpl).length;
  const eligibleCount = evaluations.filter(e => e.status === 'ELIGIBLE').length;

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(45, 212, 191, 0.15)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(45, 212, 191, 0.3)', marginBottom: '0.85rem' }}>
            <span className="pulse-beacon"></span>
            <span style={{ color: '#2dd4bf', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              LangGraph Multi-Agent Orchestrator Active
            </span>
          </div>
          <h1 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Senior Citizen Welfare & Scheme Engine
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Empowering Anganwadi & CSC field workers with instant optical document verification, deterministic scheme evaluation, counterfactual explainability, and multi-lingual voice briefings.
          </p>
        </div>
      </div>

      {/* Quick KPI Stats */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Assigned Citizens</span>
            <Users size={18} color="#0d9488" />
          </div>
          <div className="stat-val" style={{ color: '#2dd4bf' }}>{totalCitizens}</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Registered in local sector</p>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>BPL Card Holders</span>
            <TrendingUp size={18} color="#f59e0b" />
          </div>
          <div className="stat-val" style={{ color: '#fbbf24' }}>{bplCitizens}</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>High-priority welfare category</p>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Schemes Evaluated</span>
            <Sparkles size={18} color="#38bdf8" />
          </div>
          <div className="stat-val" style={{ color: '#38bdf8' }}>{evaluations.length > 0 ? evaluations.length : '5 Active'}</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>State & Central deterministic rules</p>
        </div>
      </div>

      {/* 2-Column Responsive Layout: Left: Citizen Selector, Right: AI Evaluation Output */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Citizen List with Search */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
              <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#2dd4bf" />
                <span>Beneficiary Registry</span>
              </h2>
              <Link href="/register" className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                + Onboard New
              </Link>
            </div>

            {/* Search and Filters */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search by name, district, or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.4rem', fontSize: '0.88rem' }}
                />
              </div>
              <button 
                onClick={() => setFilterBplOnly(!filterBplOnly)}
                className={`btn ${filterBplOnly ? 'btn-warning' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
                title="Toggle BPL only filter"
              >
                <Filter size={14} />
                <span>BPL Only</span>
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Showing {filteredCitizens.length} senior citizens. Click to run instant AI evaluation:
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {filteredCitizens.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No matching citizens found.</p>
              </div>
            ) : (
              filteredCitizens.map((c) => (
                <CitizenCard 
                  key={c.id} 
                  citizen={c} 
                  onEvaluate={handleEvaluate} 
                  isEvaluating={loading && selectedCitizen?.id === c.id} 
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: AI Multi-Agent Evaluation Results */}
        <div>
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: '#2dd4bf'
                }}
              >
                <Sparkles size={32} className="animate-spin" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                Executing Multi-Agent LangGraph Pipeline...
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '440px', margin: '0.5rem auto 0', fontSize: '0.92rem' }}>
                Rule Verification Agent ➔ Explainability Engine ➔ RAG Knowledge Retriever ➔ Recommendation & Voice Summarizer
              </p>
            </div>
          ) : selectedCitizen && evaluations.length > 0 ? (
            <div className="animate-fade-in">
              {/* Citizen Header Result */}
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.18) 0%, rgba(15, 23, 42, 0.8) 100%)', borderColor: 'rgba(45, 212, 191, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      Evaluation Complete
                    </span>
                    <h2 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>{selectedCitizen.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                      {selectedCitizen.age} Yrs • {selectedCitizen.district}, {selectedCitizen.state} • Monthly Income: ₹{selectedCitizen.monthly_income?.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      onClick={handleDownloadPDF}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Download size={14} />
                      <span>Download PDF</span>
                    </button>
                    <span className="badge badge-eligible">
                      {eligibleCount} / {evaluations.length} Schemes Eligible
                    </span>
                  </div>
                </div>

                {/* AI Executive Summary */}
                {recommendation && (
                  <div style={{ marginTop: '1.25rem', background: 'rgba(5, 8, 17, 0.75)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ color: '#2dd4bf', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                      <Sparkles size={16} />
                      <span>AI Multi-Scheme Recommendation Package</span>
                    </h4>
                    <p style={{ color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {recommendation.summary}
                    </p>

                    {recommendation.voice_briefing_script && (
                      <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <Volume2 size={18} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ fontSize: '0.85rem', color: '#bae6fd' }}>
                          <strong>Anganwadi Local Dialect Script:</strong> &ldquo;{recommendation.voice_briefing_script}&rdquo;
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Evaluation Results List */}
              <h3 style={{ fontSize: '1.25rem', margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={19} color="#2dd4bf" />
                <span>Deterministic Scheme Evaluation Matrix</span>
              </h3>

              {evaluations.map((ev, idx) => (
                <EligibilityResult key={idx} evaluation={ev} citizenId={selectedCitizen.id} />
              ))}

              {/* Scheme Roadmaps */}
              {roadmaps.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={19} color="#2dd4bf" />
                    <span>Actionable Fulfillment Roadmaps</span>
                  </h3>
                  {roadmaps.map((rm, idx) => (
                    <SchemeRoadmap key={idx} roadmap={rm} citizenId={selectedCitizen.id} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4.5rem 2rem' }}>
              <div 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: 'var(--text-muted)'
                }}
              >
                <Sparkles size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                No Citizen Selected for AI Evaluation
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px', margin: '0.5rem auto 0' }}>
                Select any beneficiary from the left registry or onboard a new senior citizen to trigger real-time AI eligibility matching.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
