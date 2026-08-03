'use client';
import { TrendingUp, Users, CheckCircle2, RefreshCw, BarChart3, MapPin } from 'lucide-react';

export default function AnalyticsPage() {
  const districtData = [
    { district: 'Varanasi', onboarded: 4120, enrolled: 3650, escalations: 45, rate: 88.5 },
    { district: 'Gorakhpur', onboarded: 3890, enrolled: 3210, escalations: 62, rate: 82.5 },
    { district: 'Prayagraj', onboarded: 3450, enrolled: 2840, escalations: 78, rate: 82.3 },
    { district: 'Ayodhya', onboarded: 2820, enrolled: 2490, escalations: 31, rate: 88.2 },
    { district: 'Lucknow Rural', onboarded: 5200, enrolled: 4610, escalations: 89, rate: 88.6 },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <TrendingUp size={28} color="#c084fc" />
          <span>District Scheme Analytics & Telemetry</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
          Welfare conversion performance, district-level saturation rates, and automated life-certificate renewal telemetry.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Total Beneficiaries Onboarded</span>
            <Users size={18} color="#8b5cf6" />
          </div>
          <div className="stat-val" style={{ color: '#c084fc' }}>19,480</div>
          <p style={{ fontSize: '0.82rem', color: '#34d399', marginTop: '0.2rem' }}>+14.2% MoM growth across all districts</p>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Schemes Successfully Disbursed</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div className="stat-val" style={{ color: '#34d399' }}>16,800</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>86.2% overall conversion saturation</p>
        </div>

        <div className="stat-card" style={{ borderLeftColor: '#ec4899' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Proactive Renewals Automated</span>
            <RefreshCw size={18} color="#ec4899" />
          </div>
          <div className="stat-val" style={{ color: '#f472b6' }}>4,920</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Zero-friction auto-verification</p>
        </div>
      </div>

      {/* District Breakdown Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={20} color="#c084fc" />
          <span>District-Wise Saturation & Escalation Rates</span>
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>District / Block</th>
                <th>Onboarded Citizens</th>
                <th>Enrolled in Schemes</th>
                <th>Escalations</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {districtData.map((d, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <MapPin size={14} color="#a855f7" />
                    <span>{d.district}</span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>{d.onboarded.toLocaleString()}</td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: '#34d399' }}>{d.enrolled.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-warning">{d.escalations}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '100px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${d.rate}%`, 
                            background: 'linear-gradient(90deg, #8b5cf6, #10b981)',
                            borderRadius: '3px'
                          }} 
                        />
                      </div>
                      <span style={{ fontWeight: 700, color: '#34d399', fontFamily: 'JetBrains Mono' }}>{d.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
