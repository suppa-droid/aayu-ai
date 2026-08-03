'use client';
import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  Camera, FileCheck, Sparkles, CheckCircle2, AlertTriangle,
  Trash2, ScanLine, ShieldCheck, FileCheck2, UploadCloud, Zap, Eye
} from 'lucide-react';

const CARD: React.CSSProperties = {
  background: 'rgba(15,23,42,0.92)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '16px',
  padding: '1.75rem',
  boxShadow: '0 12px 32px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
};

const STAT: React.CSSProperties = {
  background: 'rgba(15,23,42,0.92)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '14px',
  padding: '1.25rem 1.4rem',
  borderLeft: '3px solid #2dd4bf',
  boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5)',
};

export default function DocumentVerificationPage() {
  const [docType, setDocType]     = useState('Aadhaar Card');
  const [citizenName, setCName]   = useState('Ramesh Kumar');
  const [imgSrc, setImgSrc]       = useState<string | null>(null);
  const [fileName, setFileName]   = useState('');
  const [theFile, setTheFile]     = useState<File | null>(null);
  const [busy, setBusy]           = useState(false);
  const [res, setRes]             = useState<any>(null);
  const [dragOver, setDragOver]   = useState(false);

  /** Central function — called from file input, drag-drop, or paste */
  function applyFile(f: File) {
    if (!f.type.startsWith('image/')) return;
    setTheFile(f);
    setFileName(f.name);
    setImgSrc(URL.createObjectURL(f));
    setRes(null);
  }

  /** Native <input type=file> change — fires after user picks from dialog */
  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  }

  /** Drag & drop */
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) applyFile(f);
  }

  /** Ctrl+V / paste image from clipboard */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) applyFile(new File([blob], `pasted_${Date.now()}.png`, { type: blob.type }));
          break;
        }
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearFile() {
    setImgSrc(null); setFileName(''); setTheFile(null); setRes(null);
  }

  async function doVerify(fileOverride?: File) {
    const f = fileOverride ?? theFile;
    if (!f) { alert('Please select a document image first'); return; }
    setBusy(true); setRes(null);
    try {
      const fd = new FormData();
      fd.append('document_type', docType);
      fd.append('citizen_name', citizenName);
      fd.append('file', f);
      const r = await apiClient.post('/admin/field/verify-document', fd, {
        headers: { 'Content-Type': undefined },
      });
      const result = r.data;
      setRes(result);

      // ── Auto-save escalation to DB so admin panel sees it immediately ──
      if (result.escalate_level) {
        try {
          // Map OCR status to a valid EscalationReason enum value
          const reasonMap: Record<string, string> = {
            FLAGGED_MISMATCH:       'NAME_MISMATCH',
            FLAGGED_QUALITY:        'DOCUMENT_DAMAGED',
            FRAUD_ALERT:            'DOCUMENT_DAMAGED',
            VISION_AI_UNAVAILABLE:  'SYSTEM_PIPELINE_ERROR',
          };
          const reason = reasonMap[result.status] ?? 'SYSTEM_PIPELINE_ERROR';

          // We need a placeholder application_id — use a dummy sentinel UUID
          // that the admin can see maps to a document-only verification (no application)
          const SENTINEL_APP_ID = '00000000-0000-0000-0000-000000000001';

          await apiClient.post('/admin/district/escalate', {
            application_id: SENTINEL_APP_ID,
            reason,
            description: `[Document Verification] Citizen: "${citizenName}" | Doc: ${docType} | AI finding: ${result.issue ?? result.status}`,
            field_worker_id: 'FW-KIOSK',
          });
        } catch (escErr) {
          // Non-fatal — the UI result is still shown; escalation save failed silently
          console.warn('Escalation save failed:', escErr);
        }
      }
    } catch {
      setRes({ is_valid: false, status: 'BACKEND UNREACHABLE', issue: 'Cannot connect to verification server', action: 'Ensure the backend is running on port 8000' });
    } finally {
      setBusy(false);
    }
  }

  function demoPreset(key: string) {
    const blob = new Blob([key], { type: 'image/jpeg' });
    const f = new File([blob], `${key}.jpg`, { type: 'image/jpeg' });
    setTheFile(f); setFileName(f.name);
    setImgSrc(URL.createObjectURL(f));
    setCName('Ramesh Kumar'); setRes(null);
    doVerify(f);
  }

  return (
    <div className="animate-fade-in">

      {/* HERO */}
      <div className="hero-banner" style={{ marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(45,212,191,0.12)', padding:'0.35rem 0.9rem', borderRadius:'999px', border:'1px solid rgba(45,212,191,0.35)', marginBottom:'0.9rem' }}>
            <span className="pulse-beacon" />
            <span style={{ color:'#2dd4bf', fontSize:'0.78rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Gemini Vision AI Engine Active (gemini-2.5-flash)
            </span>
          </div>
          <h1 style={{ fontSize:'2.1rem', lineHeight:1.2, marginBottom:'0.7rem', display:'flex', alignItems:'center', gap:'0.65rem' }}>
            <ScanLine size={32} color="#2dd4bf" />
            AI Vision Document &amp; Fraud Sentinel
          </h1>
          <p style={{ color:'#94a3b8', fontSize:'0.97rem', maxWidth:'680px' }}>
            Instant multi-modal OCR extraction, Aadhaar &amp; Ration Card name matching, blur quality control, and automated Level&nbsp;1&nbsp;/&nbsp;Level&nbsp;2 governance escalations.
          </p>
        </div>
      </div>

      {/* KPI STATS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem', marginBottom:'1.75rem' }}>
        {([
          { label:'OCR Vision Model',      value:'Gemini 2.5 Flash', sub:'Google AI Accelerated',    color:'#2dd4bf', icon:<Sparkles size={17} color="#2dd4bf" /> },
          { label:'Verification Pipeline', value:'3-Tier HITL',       sub:'Auto / L1 Recapt / L2 District', color:'#38bdf8', icon:<ShieldCheck size={17} color="#38bdf8" /> },
          { label:'Accepted Credentials',  value:'UIDAI & NFSA',      sub:'Aadhaar, BPL Ration & Income',   color:'#fbbf24', icon:<FileCheck2 size={17} color="#f59e0b" /> },
        ] as const).map(s => (
          <div key={s.label} style={{ ...STAT, borderLeftColor: s.color }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
              <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#94a3b8' }}>{s.label}</span>
              {s.icon}
            </div>
            <div style={{ fontSize:'1.45rem', fontWeight:800, color:s.color, lineHeight:1.1, marginBottom:'0.25rem' }}>{s.value}</div>
            <div style={{ fontSize:'0.78rem', color:'#64748b' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* MAIN 2-COL */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.75rem', alignItems:'start' }}>

        {/* ── LEFT: Upload ─────────────────────────────────────────── */}
        <div style={CARD}>
          <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'1.1rem', color:'#2dd4bf', marginBottom:'1.25rem' }}>
            <Camera size={19} /> Upload / Capture Document
          </h3>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

            <div className="form-group" style={{ margin:0 }}>
              <label>Document Category</label>
              <select className="form-control" value={docType} onChange={e => setDocType(e.target.value)}>
                <option>Aadhaar Card</option>
                <option>BPL Ration Card</option>
                <option>Income Certificate</option>
                <option>Age Proof Certificate</option>
              </select>
            </div>

            <div className="form-group" style={{ margin:0 }}>
              <label>Profile Citizen Name</label>
              <input className="form-control" value={citizenName} onChange={e => setCName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
            </div>

            {/*
              ████████████████████████████████████████████████████████
              UPLOAD BUTTON — input INSIDE label (most reliable)
              ████████████████████████████████████████████████████████
            */}
            <label style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:'0.6rem',
              width:'100%', padding:'0.95rem 1rem',
              background:'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
              border:'1.5px solid rgba(45,212,191,0.6)',
              borderRadius:'10px', cursor:'pointer',
              color:'#fff', fontWeight:700, fontSize:'1rem',
              boxShadow:'0 4px 20px rgba(13,148,136,0.5)',
              userSelect:'none', transition:'all 0.2s',
            }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow='0 8px 28px rgba(13,148,136,0.65)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(13,148,136,0.5)'; }}
            >
              {/* input INSIDE label — no JS required, browser handles click natively */}
              <input
                type="file"
                accept="image/*"
                onChange={onInputChange}
                style={{ display:'none' }}
              />
              <UploadCloud size={20} />
              {imgSrc ? 'Change Document Photo' : '📎 Upload Document Photo'}
            </label>

            {/* Paste hint */}
            <p style={{ textAlign:'center', fontSize:'0.76rem', color:'#64748b', marginTop:'-0.3rem' }}>
              or press <kbd style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'4px', padding:'0.1rem 0.35rem', fontSize:'0.74rem' }}>Ctrl + V</kbd> to paste an image from clipboard
            </p>

            {/* Drag & Drop zone */}
            {!imgSrc && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{
                  padding:'1.6rem 1rem',
                  border:`2px dashed ${dragOver ? '#2dd4bf' : 'rgba(45,212,191,0.3)'}`,
                  borderRadius:'10px',
                  background: dragOver ? 'rgba(13,148,136,0.12)' : 'rgba(13,148,136,0.03)',
                  textAlign:'center', transition:'all 0.2s',
                }}
              >
                <UploadCloud size={22} color={dragOver ? '#2dd4bf' : '#475569'} style={{ margin:'0 auto 0.4rem', display:'block' }} />
                <p style={{ fontSize:'0.83rem', color:'#94a3b8', margin:0, fontWeight:500 }}>
                  {dragOver ? 'Release to upload' : 'Or drag & drop a photo here'}
                </p>
                <p style={{ fontSize:'0.73rem', color:'#64748b', marginTop:'0.15rem' }}>JPG, PNG, WEBP · Max 10MB</p>
              </div>
            )}

            {/* Preview */}
            {imgSrc && (
              <div style={{ border:'2px solid #2dd4bf', borderRadius:'12px', background:'rgba(0,0,0,0.5)', padding:'0.75rem', textAlign:'center' }}>
                <img src={imgSrc} alt="preview" style={{ maxHeight:'185px', maxWidth:'100%', objectFit:'contain', borderRadius:'8px', display:'block', margin:'0 auto' }} />
                <div style={{ marginTop:'0.6rem', display:'flex', justifyContent:'center', gap:'0.6rem', alignItems:'center' }}>
                  <span style={{ fontSize:'0.76rem', color:'#2dd4bf', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                    <CheckCircle2 size={12} /> {fileName.length > 26 ? fileName.slice(0,24)+'…' : (fileName || 'image')}
                  </span>
                  <button type="button" onClick={clearFile}
                    style={{ display:'flex', alignItems:'center', gap:'0.2rem', background:'rgba(244,63,94,0.12)', border:'1px solid rgba(244,63,94,0.4)', borderRadius:'6px', color:'#fb7185', fontSize:'0.74rem', padding:'0.2rem 0.5rem', cursor:'pointer' }}>
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              </div>
            )}

            {/* Verify */}
            <button type="button" className="btn btn-primary" disabled={busy || !theFile} onClick={() => doVerify()}
              style={{ padding:'0.9rem', fontSize:'0.97rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
              {busy
                ? <><Sparkles size={16} className="animate-spin" /><span>AI Scanning...</span></>
                : <><Zap size={16} /><span>Run AI Vision Verification</span></>}
            </button>

            {/* Demo presets */}
            <div style={{ background:'rgba(5,8,17,0.7)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'10px', padding:'0.9rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.6rem' }}>
                <Zap size={12} color="#2dd4bf" />
                <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#2dd4bf', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  1-Click Demo Samples
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.38rem' }}>
                {([
                  { label:'✅ Matching Aadhaar (Auto Approve)',     key:'matching_aadhaar', c:'#34d399', b:'rgba(16,185,129,0.4)' },
                  { label:'⚠️ Name Mismatch (Escalate L2 District)',key:'name_mismatch',    c:'#fb7185', b:'rgba(244,63,94,0.4)' },
                  { label:'🔍 Blurry Photo (Escalate L1 Recapt)',  key:'blurry_image',     c:'#fbbf24', b:'rgba(245,158,11,0.4)' },
                ] as const).map(d => (
                  <button key={d.key} type="button" onClick={() => demoPreset(d.key)}
                    style={{ textAlign:'left', width:'100%', padding:'0.45rem 0.85rem', background:'rgba(255,255,255,0.03)', border:`1px solid ${d.b}`, borderRadius:'7px', color:d.c, fontSize:'0.8rem', cursor:'pointer', transition:'background 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.background='rgba(255,255,255,0.07)')}
                    onMouseOut={e => (e.currentTarget.style.background='rgba(255,255,255,0.03)')}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: OCR Results ───────────────────────────────────── */}
        <div style={CARD}>
          <h3 style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'1.1rem', color:'#38bdf8', marginBottom:'1.25rem' }}>
            <Eye size={19} /> AI Vision OCR Output &amp; Fraud Analysis
          </h3>

          {!res && !busy && (
            <div style={{ textAlign:'center', padding:'3.5rem 1.5rem' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                <FileCheck size={26} color="#38bdf8" style={{ opacity:0.6 }} />
              </div>
              <p style={{ fontWeight:700, color:'#94a3b8', fontSize:'1rem', marginBottom:'0.4rem' }}>Awaiting Document Scan</p>
              <p style={{ fontSize:'0.83rem', color:'#64748b', maxWidth:'260px', margin:'0 auto' }}>
                Upload a document photo or press a 1-Click Demo sample to trigger AI verification.
              </p>
            </div>
          )}

          {busy && (
            <div style={{ textAlign:'center', padding:'3.5rem 1.5rem' }}>
              <Sparkles size={34} color="#2dd4bf" style={{ margin:'0 auto 0.8rem', display:'block' }} className="animate-spin" />
              <h4 style={{ color:'#2dd4bf', marginBottom:'0.3rem' }}>Scanning Document...</h4>
              <p style={{ fontSize:'0.83rem', color:'#94a3b8' }}>Gemini Vision Model running OCR</p>
            </div>
          )}

          {res && (
            <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ padding:'1rem 1.2rem', borderRadius:'12px', background: res.is_valid ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', border:`1.5px solid ${res.is_valid ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                  <h4 style={{ display:'flex', alignItems:'center', gap:'0.45rem', color: res.is_valid ? '#34d399' : '#fb7185', fontSize:'1rem', margin:0 }}>
                    {res.is_valid ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}
                    {res.status}
                  </h4>
                  <span className={`badge ${res.is_valid ? 'badge-eligible' : res.status === 'FRAUD_ALERT' ? 'badge-ineligible' : 'badge-ineligible'}`}
                    style={res.status === 'FRAUD_ALERT' ? { background: 'rgba(244,63,94,0.25)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.6)' } : {}}>
                    {res.is_valid ? 'Verified ✓' : res.status === 'FRAUD_ALERT' ? '🚨 FRAUD ALERT' : `Escalate L${res.escalate_level || 1}`}
                  </span>
                </div>
                <p style={{ fontSize:'0.83rem', color:'#94a3b8', margin:0 }}>{res.action}</p>
              </div>

              <div style={{ background:'rgba(5,8,17,0.7)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'10px', padding:'1rem' }}>
                <div style={{ fontSize:'0.71rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.75rem' }}>📋 Parsed OCR Metadata</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', fontSize:'0.88rem' }}>
                  {([
                    { k:'Citizen Profile', v:citizenName,         c:'#f8fafc' },
                    ...(res.extracted_name ? [{ k:'Extracted Name', v:res.extracted_name, c: res.is_valid ? '#34d399' : '#fb7185' }] : []),
                    ...(res.document_number && res.document_number !== 'N/A' ? [{ k:'Document ID', v:res.document_number, c:'#38bdf8', mono:true }] : []),
                    { k:'Name Match', v: res.is_valid ? '✓ Confirmed' : '✗ Mismatch', c: res.is_valid ? '#34d399' : '#fb7185' },
                  ]).map((row, i, arr) => (
                    <div key={row.k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom: i < arr.length-1 ? '0.45rem' : 0, borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <span style={{ color:'#64748b', fontSize:'0.82rem' }}>{row.k}</span>
                      <strong style={{ color:row.c, fontFamily:(row as any).mono ? 'monospace' : 'inherit' }}>{row.v}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {res.issue && (
                <div style={{ background:'rgba(244,63,94,0.07)', border:'1px solid rgba(244,63,94,0.28)', borderRadius:'10px', padding:'0.9rem', fontSize:'0.84rem', color:'#fca5a5' }}>
                  <strong style={{ display:'block', color:'#fb7185', marginBottom:'0.25rem' }}>⚠️ Flagged Anomaly</strong>
                  {res.issue}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
