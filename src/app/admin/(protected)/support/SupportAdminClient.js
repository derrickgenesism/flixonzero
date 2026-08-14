'use client';

import { useState, useEffect, useRef } from 'react';
import { updateTelegramSettings, getThreadMessages, replyToThread, deleteThread } from './actions';
import { createClient } from '@/utils/supabase/client';

export default function SupportAdminClient({ data }) {
  const { config, threads } = data;
  
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  
  const [replyInput, setReplyInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeThread) return;

    const channel = supabase
      .channel(`admin_support_thread_${activeThread.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `thread_id=eq.${activeThread.id}`
      }, (payload) => {
        setMessages(prev => {
          // Check if message already exists (e.g. from our optimistic UI/state)
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread, supabase]);

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);

  const handleSettingsSubmit = async (formData) => {
    setSettingsLoading(true);
    setSettingsMessage(null);
    const res = await updateTelegramSettings(formData);
    setSettingsLoading(false);
    if (res.success) setSettingsMessage('Telegram settings saved!');
  };

  const handleSelectThread = async (thread) => {
    setActiveThread(thread);
    setLoadingMessages(true);
    const msgs = await getThreadMessages(thread.id);
    setMessages(msgs);
    setLoadingMessages(false);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeThread) return;
    
    setIsReplying(true);
    const res = await replyToThread(activeThread.id, replyInput);
    if (res.success) {
      setReplyInput('');
      const msgs = await getThreadMessages(activeThread.id);
      setMessages(msgs);
    } else {
      alert('Failed to send reply');
    }
    setIsReplying(false);
  };

  const handleClearThread = async () => {
    if (!activeThread) return;
    if (!confirm('Are you sure you want to resolve and delete this ticket? All messages will be permanently cleared for both you and the user.')) return;
    
    const res = await deleteThread(activeThread.id);
    if (res.success) {
      setActiveThread(null);
      setMessages([]);
      alert('Ticket resolved and cleared.');
    } else {
      alert('Failed to clear ticket.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Support & Tickets</h1>

      {/* Telegram Settings */}
      <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Telegram Bot Integration</h2>
        <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '20px' }}>
          Get instantly notified in your Telegram Group whenever a user sends a support message.
        </p>
        {settingsMessage && <div style={{ color: '#4ade80', marginBottom: '16px' }}>{settingsMessage}</div>}
        <form action={handleSettingsSubmit} style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Bot Token</label>
            <input 
              type="text" 
              name="telegram_bot_token" 
              defaultValue={config.telegram_bot_token || ''}
              placeholder="123456789:ABCdefGHIjkl..."
              className="flx-form-input" 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Chat ID</label>
            <input 
              type="text" 
              name="telegram_chat_id" 
              defaultValue={config.telegram_chat_id || ''}
              placeholder="-100123456789"
              className="flx-form-input" 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="gms-btn gms-btn--primary" disabled={settingsLoading}>
              Save Integration
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
        {/* Thread List */}
        <div style={{ width: '350px', background: 'var(--bg2)', borderRadius: '12px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, background: 'var(--bg2)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Active Tickets</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {threads.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--text3)', textAlign: 'center' }}>No tickets found.</div>
            ) : threads.map(thread => (
              <div 
                key={thread.id} 
                onClick={() => handleSelectThread(thread)}
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  cursor: 'pointer',
                  background: activeThread?.id === thread.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {thread.user_profiles?.username}
                    {thread.unreadCount > 0 && (
                      <span style={{ background: '#e50914', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {new Date(thread.last_message_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {thread.subject}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' }}>
          {activeThread ? (
            <>
              {/* Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Chat with {activeThread.user_profiles?.username}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{activeThread.user_profiles?.email}</div>
                </div>
                <button 
                  onClick={handleClearThread}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Resolve & Clear Ticket
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loadingMessages ? (
                  <div style={{ color: 'var(--text3)' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ color: 'var(--text3)' }}>No messages yet.</div>
                ) : (
                  messages.map(msg => {
                    const isAdmin = msg.sender_role === 'admin';
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          background: isAdmin ? 'var(--acc)' : 'rgba(255,255,255,0.05)',
                          color: isAdmin ? '#fff' : 'var(--text)',
                          padding: '12px 16px',
                          borderRadius: '16px',
                          borderBottomRightRadius: isAdmin ? '4px' : '16px',
                          borderBottomLeftRadius: isAdmin ? '16px' : '4px',
                          maxWidth: '80%',
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          {msg.content}
                          <div style={{ fontSize: '10px', color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text3)', marginTop: '4px', textAlign: isAdmin ? 'right' : 'left' }}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <form onSubmit={handleReplySubmit} style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="Type your reply..."
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    disabled={isReplying}
                  />
                  <button type="submit" className="gms-btn gms-btn--primary" disabled={isReplying || !replyInput.trim()}>
                    Reply
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
              Select a thread to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
