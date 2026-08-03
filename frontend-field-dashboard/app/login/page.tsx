'use client';
import { useState, useEffect } from 'react';
import { login } from '../../lib/auth';
import { ShieldCheck, UserCheck, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // CAPTCHA State
  const [captchaString, setCaptchaString] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed ambiguous characters like I, O, 0, 1
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaString(result);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!username || !password || !captchaAnswer) return;
    
    if (captchaAnswer.toUpperCase() !== captchaString) {
      setError('Invalid CAPTCHA string. Please type exactly what you see.');
      generateCaptcha();
      return;
    }
    
    setError('');
    
    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '520px', marginTop: '6vh' }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 24px var(--primary-glow)',
              fontSize: '2rem'
            }}
          >
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.03em' }}>Aayu AI Field Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
            Multi-Agent Welfare Eligibility Kiosk for Senior Citizens
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter your username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* CAPTCHA Field */}
          <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
              <ShieldAlert size={16} color="#2dd4bf" />
              <span>Security Check (CAPTCHA)</span>
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <div style={{ 
                background: 'rgba(45, 212, 191, 0.15)', 
                padding: '0.6rem 1rem', 
                borderRadius: '6px', 
                fontWeight: 800, 
                fontSize: '1.25rem',
                color: '#2dd4bf',
                letterSpacing: '4px',
                fontFamily: 'monospace',
                textDecoration: 'line-through',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                userSelect: 'none'
              }}>
                {captchaString}
              </div>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type the characters" 
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                style={{ flex: 1, fontSize: '1.1rem', textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.95rem', fontSize: '1.02rem', marginTop: '0.5rem' }}
          >
            <UserCheck size={18} style={{ marginRight: '8px' }} />
            <span>Secure Login</span>
          </button>
        </form>
      </div>
    </div>
  );
}
