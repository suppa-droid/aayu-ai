'use client';
import { useState, useEffect } from 'react';
import { login } from '../../lib/auth';
import { wakeApiServer } from '../../lib/api-client';
import { ShieldCheck, UserCheck, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    wakeApiServer();
    if (new URLSearchParams(window.location.search).get('expired') === '1') {
      setError('Your session expired. Sign in again, then register the citizen.');
    }
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!username || !password || !captchaAnswer || loading) return;
    
    if (captchaAnswer.toUpperCase() !== captchaString) {
      setError('Invalid CAPTCHA string. Please type exactly what you see.');
      generateCaptcha();
      return;
    }
    
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (result !== true) {
      setError(result);
      generateCaptcha();
      setLoading(false);
    }
  };

  return (
    <div className="container login-frame animate-fade-in">
      <div className="card login-card">
        <div className="login-brand">
          <div className="login-mark">
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h1>Aayu AI Field Portal</h1>
          <p className="login-lead">
            Multi-Agent Welfare Eligibility Kiosk for Senior Citizens
          </p>
        </div>

        {error && (
          <div className="alert-error" role="alert">
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
          <div className="form-group captcha-box">
            <label>
              <ShieldAlert size={16} color="#2dd4bf" />
              <span>Security Check (CAPTCHA)</span>
            </label>
            <div className="captcha-row">
              <div className="captcha-code">
                {captchaString}
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Type the code"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                aria-label="Security check characters"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            <UserCheck size={18} />
            <span>{loading ? 'Signing in… first login can take up to a minute' : 'Secure Login'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
