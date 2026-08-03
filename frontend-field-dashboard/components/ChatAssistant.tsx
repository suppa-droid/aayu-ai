'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { apiClient } from '../lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am Aayu AI. Ask me any questions about welfare schemes, eligibility rules, or documentation.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (id: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      // Clean any markdown formatting for cleaner speech synthesis
      const cleanText = text.replace(/[*_#`~\[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await apiClient.post('/ask', { query: userMsg.content });
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: res.data.answer || 'Sorry, I could not generate an answer.' 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: 'Error: Could not connect to the Aayu AI backend.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      
      {/* Chat Window */}
      {isOpen && (
        <div style={{ 
          width: '380px', 
          height: '500px', 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '16px', 
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fade-in 0.2s ease-out forwards'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '1rem', 
            background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Bot size={20} /> Ask Aayu AI
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.2rem' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                gap: '0.5rem',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? '#334155' : 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div style={{
                  position: 'relative',
                  background: msg.role === 'user' ? '#1e293b' : 'rgba(45, 212, 191, 0.1)',
                  border: msg.role === 'user' ? '1px solid #334155' : '1px solid rgba(45, 212, 191, 0.2)',
                  padding: msg.role === 'user' ? '0.75rem 1rem' : '0.75rem 2.2rem 0.75rem 1rem',
                  borderRadius: msg.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  color: msg.role === 'user' ? '#e2e8f0' : '#cbd5e1',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        top: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: speakingId === msg.id ? '#2dd4bf' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'color 0.2s'
                      }}
                      title={speakingId === msg.id ? 'Stop audio assist' : 'Listen to answer'}
                    >
                      {speakingId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Bot size={14} />
                </div>
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(45, 212, 191, 0.1)', borderRadius: '2px 12px 12px 12px', border: '1px solid rgba(45, 212, 191, 0.2)' }}>
                  <Loader2 size={16} className="lucide-spin" style={{ color: '#2dd4bf' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Ask about schemes or rules..."
                disabled={isLoading}
                style={{ 
                  flex: 1, 
                  background: 'var(--bg-input)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '24px', 
                  padding: '0.6rem 1rem',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                style={{ 
                  background: (!inputValue.trim() || isLoading) ? '#334155' : 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: (!inputValue.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  transition: '0.2s all'
                }}
              >
                <Send size={16} style={{ marginLeft: '2px' }} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(13, 148, 136, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .lucide-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
