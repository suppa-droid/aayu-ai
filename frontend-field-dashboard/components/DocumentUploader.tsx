'use client';
import React, { useState } from 'react';
import { apiClient } from '../lib/api-client';
import { Camera, UploadCloud, CheckCircle2, AlertTriangle, FileCheck, Sparkles, Trash2 } from 'lucide-react';

export default function DocumentUploader() {
  const [docType, setDocType] = useState('Aadhaar Card');
  const [citizenName, setCitizenName] = useState('Ramesh Kumar');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);

  // ─── File Selection via native input ───────────────────────────────────────
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result as string);
    reader.readAsDataURL(f);
  };

  // ─── Drag & Drop ───────────────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) {
      setSelectedFile(f);
      setResult(null);
      const reader = new FileReader();
      reader.onload = () => setPreviewSrc(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  // ─── Verify ────────────────────────────────────────────────────────────────
  const verify = async (fileOverride?: File) => {
    const f = fileOverride || selectedFile;
    if (!f) { alert('Upload an image first'); return; }
    setIsVerifying(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('document_type', docType);
      fd.append('citizen_name', citizenName);
      fd.append('file', f);
      const res = await apiClient.post('/admin/field/verify-document', fd, {
        headers: { 'Content-Type': undefined },
      });
      setResult(res.data);
    } catch {
      setResult({
        is_valid: false,
        status: 'CONNECTION_ERROR',
        issue: 'Cannot reach verification server.',
        action: 'Check backend is running on port 8000.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Demo presets ──────────────────────────────────────────────────────────
  const loadPreset = (label: string, name: string, imgUrl: string) => {
    setCitizenName(name);
    setPreviewSrc(imgUrl);
    const blob = new Blob([`${label} demo`], { type: 'image/jpeg' });
    const demoFile = new File([blob], `demo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    setSelectedFile(demoFile);
    setResult(null);
    verify(demoFile);
  };

  // ─── Clear ────────────────────────────────────────────────────────────────
  const clear = () => { setPreviewSrc(null); setSelectedFile(null); setResult(null); };

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>

      {/* ── LEFT: Upload Panel ─────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#2dd4bf' }}>
          <Camera size={20} /> Upload / Capture Document
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Doc type */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Document Category</label>
            <select className="form-control" value={docType} onChange={e => setDocType(e.target.value)}>
              <option>Aadhaar Card</option>
              <option>BPL Ration Card</option>
              <option>Income Certificate</option>
              <option>Age Proof Certificate</option>
            </select>
          </div>

          {/* Citizen name */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Citizen Name</label>
            <input className="form-control" value={citizenName} onChange={e => setCitizenName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
          </div>

          {/* ── DIRECT FILE INPUT ── guaranteed to work ── */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.45rem' }}>
              Select or Take Photo
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFileSelected}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.8rem',
                background: 'rgba(13,148,136,0.08)',
                border: '1.5px solid rgba(45,212,191,0.45)',
                borderRadius: '8px',
                color: '#f8fafc',
                cursor: 'pointer',
                fontSize: '0.92rem',
              }}
            />
          </div>

          {/* Drag-drop zone (secondary) */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`scanner-container ${isVerifying ? 'scanner-active' : ''}`}
            style={{
              borderColor: dragging ? '#2dd4bf' : 'rgba(45,212,191,0.3)',
              background: dragging ? 'rgba(13,148,136,0.15)' : 'rgba(13,148,136,0.03)',
              minHeight: '100px',
              transition: 'all 0.2s',
            }}
          >
            {isVerifying && <div className="scanner-line" />}
            {previewSrc ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={previewSrc}
                  alt="preview"
                  style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', border: '2px solid #2dd4bf', borderRadius: '8px', background: '#000' }}
                />
                <div style={{ marginTop: '0.6rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={clear}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem', color: '#fb7185', borderColor: 'rgba(244,63,94,0.4)' }}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud size={26} color="#2dd4bf" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#94a3b8' }}>
                  {dragging ? 'Drop here!' : 'Or drag & drop a document photo here'}
                </p>
              </div>
            )}
          </div>

          {/* Verify button */}
          <button
            className="btn btn-primary"
            onClick={() => verify()}
            disabled={isVerifying || !selectedFile}
            style={{ padding: '0.85rem', fontSize: '1rem' }}
          >
            {isVerifying
              ? <><Sparkles size={17} className="animate-spin" /><span>AI Scanning...</span></>
              : <><FileCheck size={17} /><span>Run AI Vision Verification</span></>}
          </button>

          {/* Demo presets */}
          <div style={{ background: 'rgba(5,8,17,0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.8rem' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2dd4bf', marginBottom: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ⚡ 1-Click Demo Samples
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button type="button" className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem', justifyContent: 'flex-start', borderColor: 'rgba(45,212,191,0.3)' }}
                onClick={() => loadPreset('matching', 'Ramesh Kumar', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg')}>
                ✅ Matching Aadhaar (Auto Approve)
              </button>
              <button type="button" className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem', justifyContent: 'flex-start', borderColor: 'rgba(244,63,94,0.3)' }}
                onClick={() => loadPreset('mismatch', 'Ramesh Kumar', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg')}>
                ⚠️ Name Mismatch (Escalate L2)
              </button>
              <button type="button" className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem', justifyContent: 'flex-start', borderColor: 'rgba(245,158,11,0.3)' }}
                onClick={() => loadPreset('blurry', 'Ramesh Kumar', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg')}>
                🔍 Blurry Photo (Escalate L1)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: OCR Results Panel ───────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38bdf8' }}>
          <Sparkles size={20} /> AI Vision OCR Output &amp; Fraud Analysis
        </h3>

        {!result && !isVerifying && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <FileCheck size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, fontSize: '1rem', color: '#94a3b8' }}>Awaiting Document Scan</p>
            <p style={{ fontSize: '0.84rem', maxWidth: '280px', margin: '0.4rem auto 0' }}>
              Upload a document or use a 1-Click demo to run AI optical verification.
            </p>
          </div>
        )}

        {isVerifying && (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Sparkles size={34} color="#2dd4bf" style={{ margin: '0 auto 0.75rem', display: 'block' }} className="animate-spin" />
            <h4 style={{ color: '#2dd4bf', fontSize: '1.1rem' }}>Scanning Document...</h4>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '0.35rem' }}>Groq LPU Vision Model running OCR extraction</p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Status */}
            <div style={{
              padding: '1.1rem 1.3rem',
              borderRadius: '12px',
              background: result.is_valid ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              border: `1px solid ${result.is_valid ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: result.is_valid ? '#34d399' : '#fb7185', fontSize: '1.1rem' }}>
                  {result.is_valid ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                  {result.status}
                </h4>
                <span className={`badge ${result.is_valid ? 'badge-eligible' : 'badge-ineligible'}`}>
                  {result.is_valid ? 'Verified ✓' : `Escalate L${result.escalate_level || 1}`}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.45rem' }}>{result.action}</p>
            </div>

            {/* Metadata */}
            <div style={{ background: 'rgba(5,8,17,0.65)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem 1.1rem' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                📋 Parsed OCR Metadata
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#94a3b8' }}>Citizen Profile:</span>
                  <strong style={{ color: '#f8fafc' }}>{citizenName}</strong>
                </div>
                {result.extracted_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Extracted Name:</span>
                    <strong style={{ color: result.is_valid ? '#34d399' : '#fb7185' }}>{result.extracted_name}</strong>
                  </div>
                )}
                {result.document_number && result.document_number !== 'N/A' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Document ID:</span>
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>{result.document_number}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Name Match:</span>
                  <span className={`badge ${result.is_valid ? 'badge-eligible' : 'badge-ineligible'}`} style={{ fontSize: '0.7rem' }}>
                    {result.is_valid ? '✓ Match' : '✗ Mismatch'}
                  </span>
                </div>
              </div>
            </div>

            {result.issue && (
              <div style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '8px', padding: '0.9rem 1rem', fontSize: '0.86rem', color: '#fca5a5' }}>
                <strong style={{ display: 'block', color: '#fb7185', marginBottom: '0.2rem' }}>⚠️ Flagged Anomaly:</strong>
                {result.issue}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
