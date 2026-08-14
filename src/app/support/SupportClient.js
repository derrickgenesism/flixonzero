'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function SupportClient({ initialMessages, threadId, userProfile }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const messageText = input;
    setInput('');
    setIsSending(true);

    // Optimistically add to UI
    const tempId = Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      thread_id: threadId,
      sender_role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    }]);

    try {
      const res = await fetch('/api/support/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content: messageText, userProfile })
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      // Fetch the latest messages from DB or just rely on optimistic UI for now.
      // Usually, we'd use Supabase real-time here.
    } catch (err) {
      alert('Failed to send message. Please try again.');
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(messageText);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '80px', paddingBottom: '60px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg2)', zIndex: 10 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Support Chat</h1>
          <p style={{ color: 'var(--text3)', fontSize: '13px', margin: '4px 0 0' }}>We typically reply within a few hours.</p>
        </div>

        {/* Chat Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: '40px' }}>
              Send us a message and we'll get back to you as soon as possible!
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender_role === 'user';
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: isUser ? 'var(--acc)' : 'var(--bg2)',
                    color: isUser ? '#fff' : 'var(--text)',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomRightRadius: isUser ? '4px' : '16px',
                    borderBottomLeftRadius: isUser ? '16px' : '4px',
                    maxWidth: '80%',
                    fontSize: '15px',
                    lineHeight: '1.4'
                  }}>
                    {msg.content}
                    <div style={{ 
                      fontSize: '10px', 
                      color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--text3)', 
                      marginTop: '4px',
                      textAlign: isUser ? 'right' : 'left'
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ padding: '20px', background: 'var(--bg)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                background: 'var(--bg2)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 16px',
                borderRadius: '24px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none'
              }}
              disabled={isSending}
            />
            <button 
              type="submit" 
              disabled={isSending || !input.trim()}
              style={{
                background: 'var(--acc)',
                border: 'none',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !isSending ? 1 : 0.5,
                color: '#fff'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
