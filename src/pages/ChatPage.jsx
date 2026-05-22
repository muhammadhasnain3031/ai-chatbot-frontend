import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { logout } from '../store/authSlice';
import {
  fetchConversations, fetchMessages, sendMessage,
  createConversation, deleteConversation
} from '../store/chatSlice';

export default function ChatPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token }     = useSelector(s => s.auth);
  const { conversations, messages, sending, error, activeConvo } = useSelector(s => s.chat);
  const [input, setInput]         = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Mobile resize detect
  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handler);
    if (window.innerWidth < 768) setSidebarOpen(false);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    if (token) dispatch(fetchConversations(token));
  }, [token, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleNewChat = async () => {
    await dispatch(createConversation(token));
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectConvo = (convo) => {
    dispatch(fetchMessages({ id: convo._id, token }));
    if (isMobile) setSidebarOpen(false);
  };

  // ✅ DIRECT CHAT START — agar koi conversation active nahi, pehle bana lo phir bhej do
  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input;
    setInput('');

    let convId = activeConvo?._id;
    if (!convId) {
      const result = await dispatch(createConversation(token));
      convId = result.payload?._id;
      if (!convId) return; // conversation ban hi nahi paya
      if (isMobile) setSidebarOpen(false);
    }

    await dispatch(sendMessage({ convId, message: msg, token }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Welcome screen suggestion par bhi direct chat start
  const handleSuggestion = async (text) => {
    if (sending) return;
    let convId = activeConvo?._id;
    if (!convId) {
      const result = await dispatch(createConversation(token));
      convId = result.payload?._id;
      if (!convId) return;
      if (isMobile) setSidebarOpen(false);
    }
    dispatch(sendMessage({ convId, message: text, token }));
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    dispatch(deleteConversation({ id, token }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const canSend = input.trim() && !sending;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0a0a0f',
      color: '#f5f5f0',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      flexDirection: isMobile ? 'column' : 'row',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* Ambient gradient orbs (background atmosphere) */}
      <div style={{
        position: 'fixed', top: '-15%', left: '20%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,138,76,0.12), transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '5%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,255,0.10), transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ===== SIDEBAR OVERLAY (mobile) ===== */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)', zIndex: 10 }}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      {sidebarOpen && (
        <div style={{
          width:    isMobile ? '78vw' : '270px',
          maxWidth: isMobile ? '320px' : '270px',
          height:   '100vh',
          background: 'rgba(18,18,26,0.85)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: isMobile ? 'fixed' : 'relative',
          left: 0, top: 0,
          zIndex: isMobile ? 20 : 2,
        }}>

          {/* Brand */}
          <div style={{ padding: '20px 18px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff8a4c, #ff5e7e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', boxShadow: '0 4px 14px rgba(255,94,126,0.4)',
            }}>🤖</div>
            <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.3px' }}>Nova AI</span>
          </div>

          {/* New Chat */}
          <div style={{ padding: '4px 14px 14px' }}>
            <button onClick={handleNewChat} style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #ff8a4c, #ff5e7e)',
              border: 'none', color: '#fff',
              borderRadius: '12px', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255,94,126,0.3)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,94,126,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,94,126,0.3)'; }}
            >
              ✦ New Chat
            </button>
          </div>

          {/* Conversations */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
            <p style={{
              color: 'rgba(245,245,240,0.35)', fontSize: '11px',
              padding: '8px 8px 6px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '1px',
            }}>Conversations</p>

            {conversations.length === 0 && (
              <p style={{ color: 'rgba(245,245,240,0.25)', fontSize: '12.5px', padding: '10px', textAlign: 'center' }}>
                No chats yet — start typing!
              </p>
            )}

            {conversations.map(c => {
              const active = activeConvo?._id === c._id;
              return (
                <div key={c._id} onClick={() => handleSelectConvo(c)} style={{
                  padding: '11px 12px', borderRadius: '11px',
                  cursor: 'pointer', marginBottom: '3px',
                  background: active ? 'rgba(255,138,76,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(255,138,76,0.25)' : '1px solid transparent',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '8px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    fontSize: '13.5px', color: active ? '#ffd9c2' : 'rgba(245,245,240,0.8)',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {c.title}
                  </span>
                  <button onClick={(e) => handleDelete(e, c._id)} style={{
                    background: 'none', border: 'none', color: 'rgba(245,245,240,0.3)',
                    cursor: 'pointer', fontSize: '13px',
                    padding: '2px 4px', borderRadius: '4px', flexShrink: 0,
                  }}>🗑</button>
                </div>
              );
            })}
          </div>

          {/* User + Logout */}
          <div style={{
            padding: '14px', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff8a4c, #ff5e7e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#fff',
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '13.5px', color: 'rgba(245,245,240,0.85)' }}>{user?.name}</span>
            </div>
            <button onClick={handleLogout} title="Logout" style={{
              background: 'none', border: 'none', color: 'rgba(245,245,240,0.4)',
              cursor: 'pointer', fontSize: '18px',
            }}>⏻</button>
          </div>
        </div>
      )}

      {/* ===== MAIN CHAT ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, zIndex: 1 }}>

        {/* Header */}
        <div style={{
          padding: isMobile ? '13px 16px' : '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '12px',
          flexShrink: 0, background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(10px)',
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', color: 'rgba(245,245,240,0.6)',
            cursor: 'pointer', fontSize: '20px', padding: '2px', lineHeight: 1,
          }}>☰</button>
          <span style={{
            fontWeight: 600, fontSize: isMobile ? '14.5px' : '15.5px',
            color: '#f5f5f0', flex: 1, letterSpacing: '-0.2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activeConvo ? activeConvo.title : 'Nova AI'}
          </span>
          <span style={{
            fontSize: '11px', color: '#ffb38a',
            background: 'rgba(255,138,76,0.12)',
            padding: '4px 12px', borderRadius: '20px',
            border: '1px solid rgba(255,138,76,0.2)', flexShrink: 0, fontWeight: 600,
          }}>Llama 3.1</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 0' }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', padding: isMobile ? 0 : '0 24px', height: '100%' }}>

            {!activeConvo && messages.length === 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: '16px', padding: '20px',
              }}>
                <div style={{
                  width: isMobile ? '64px' : '78px', height: isMobile ? '64px' : '78px',
                  borderRadius: '22px',
                  background: 'linear-gradient(135deg, #ff8a4c, #ff5e7e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isMobile ? '34px' : '42px',
                  boxShadow: '0 10px 40px rgba(255,94,126,0.4)',
                  animation: 'float 3s ease-in-out infinite',
                }}>🤖</div>
                <h2 style={{
                  margin: 0,
                  fontSize: isMobile ? '22px' : '30px', fontWeight: 700,
                  textAlign: 'center', letterSpacing: '-0.6px',
                  background: 'linear-gradient(135deg, #fff, #ffb38a)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Assalam-o-Alaikum{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</h2>
                <p style={{
                  margin: 0, color: 'rgba(245,245,240,0.5)',
                  fontSize: isMobile ? '13.5px' : '15px', textAlign: 'center', maxWidth: '420px', lineHeight: 1.6,
                }}>
                  Type karna shuru karein — main English aur Roman Urdu dono mein baat kar sakta hun.
                </p>

                <div style={{
                  display: 'flex', flexWrap: 'wrap',
                  gap: '10px', justifyContent: 'center', marginTop: '12px', maxWidth: '480px',
                }}>
                  {[
                    '👋 Mujhse Roman Urdu mein baat karo',
                    '💻 React hooks samjhao',
                    '🐛 Mera code debug karo',
                    '🏗️ System design basics',
                  ].map(s => (
                    <button key={s} onClick={() => handleSuggestion(s.replace(/^\S+\s/, ''))} style={{
                      padding: '11px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(245,245,240,0.85)',
                      borderRadius: '12px', cursor: 'pointer',
                      fontSize: isMobile ? '12.5px' : '13.5px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,138,76,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,138,76,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', marginBottom: '22px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                animation: 'fadeUp 0.35s ease',
              }}>
                <div style={{
                  width: isMobile ? '30px' : '36px', height: isMobile ? '30px' : '36px',
                  borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #7c5cff, #5e7eff)'
                    : 'linear-gradient(135deg, #ff8a4c, #ff5e7e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: msg.role === 'user' ? '13px' : '16px', fontWeight: 700, color: '#fff',
                }}>
                  {msg.role === 'user' ? user?.name?.charAt(0).toUpperCase() : '🤖'}
                </div>

                <div style={{
                  maxWidth: isMobile ? '82%' : '76%',
                  padding: isMobile ? '11px 14px' : '14px 18px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #7c5cff, #6b5cff)'
                    : 'rgba(255,255,255,0.04)',
                  border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  fontSize: isMobile ? '13.5px' : '14.5px',
                  lineHeight: 1.7, wordBreak: 'break-word',
                  boxShadow: msg.role === 'user' ? '0 4px 16px rgba(124,92,255,0.25)' : 'none',
                }}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark} language={match[1]} PreTag="div"
                            customStyle={{ fontSize: isMobile ? '11px' : '13px', borderRadius: '10px', margin: '8px 0' }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code style={{
                            background: 'rgba(255,138,76,0.15)', color: '#ffb38a',
                            padding: '2px 6px', borderRadius: '5px',
                            fontSize: isMobile ? '11px' : '13px',
                          }} {...props}>{children}</code>
                        );
                      },
                      p: ({ children }) => (
                        <p style={{ margin: '0 0 8px', color: 'rgba(245,245,240,0.9)', lineHeight: 1.7 }}>{children}</p>
                      ),
                      li: ({ children }) => (
                        <li style={{ color: 'rgba(245,245,240,0.9)', marginBottom: '4px' }}>{children}</li>
                      ),
                    }}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p style={{ margin: 0, color: '#fff', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '22px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff8a4c, #ff5e7e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                }}>🤖</div>
                <div style={{
                  padding: '16px 18px', borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: '#ff8a4c', animation: 'bounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(255,94,94,0.1)', color: '#ff8a8a',
                padding: '12px 16px', borderRadius: '12px',
                border: '1px solid rgba(255,94,94,0.2)',
                marginBottom: '16px', fontSize: '13px', textAlign: 'center',
              }}>⚠️ {error}</div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{
          padding: isMobile ? '12px' : '16px 24px 22px', flexShrink: 0,
        }}>
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'flex-end',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '18px',
              padding: isMobile ? '10px 12px' : '12px 16px',
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.2s',
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Nova... (English ya Roman Urdu)"
                disabled={sending}
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#f5f5f0', fontSize: isMobile ? '14px' : '14.5px',
                  resize: 'none', outline: 'none',
                  maxHeight: '150px', overflowY: 'auto', lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              />
              <button onClick={handleSend} disabled={!canSend}
                style={{
                  width: '38px', height: '38px', borderRadius: '12px', border: 'none',
                  background: canSend ? 'linear-gradient(135deg, #ff8a4c, #ff5e7e)' : 'rgba(255,255,255,0.08)',
                  color: '#fff', cursor: canSend ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '17px', flexShrink: 0, transition: 'all 0.15s',
                  boxShadow: canSend ? '0 4px 14px rgba(255,94,126,0.35)' : 'none',
                }}>
                {sending ? '…' : '↑'}
              </button>
            </div>
            <p style={{
              color: 'rgba(245,245,240,0.3)', fontSize: '11px',
              textAlign: 'center', marginTop: '8px',
            }}>
              Nova kabhi galti kar sakta hai — ahem maloomat verify zaroor karein
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        textarea::placeholder { color: rgba(245,245,240,0.35); }
      `}</style>
    </div>
  );
}