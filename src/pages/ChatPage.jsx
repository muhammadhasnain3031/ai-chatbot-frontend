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
      if (mobile) setSidebarOpen(false); // mobile pe sidebar band by default
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
    if (isMobile) setSidebarOpen(false); // mobile pe chat khulne ke baad sidebar band
  };

  const handleSelectConvo = (convo) => {
    dispatch(fetchMessages({ id: convo._id, token }));
    if (isMobile) setSidebarOpen(false); // mobile pe select ke baad sidebar band
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !activeConvo) return;
    const msg = input;
    setInput('');
    await dispatch(sendMessage({ convId: activeConvo._id, message: msg, token }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0d0d0d',
      color: '#fff',
      fontFamily: '-apple-system, sans-serif',
      flexDirection: isMobile ? 'column' : 'row',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ===== SIDEBAR OVERLAY (mobile) ===== */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      {sidebarOpen && (
        <div style={{
          width:    isMobile ? '75vw' : '260px',
          maxWidth: isMobile ? '300px' : '260px',
          height:   '100vh',
          background: '#111',
          borderRight: '1px solid #222',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: isMobile ? 'fixed' : 'relative',
          left: 0, top: 0,
          zIndex: isMobile ? 20 : 1,
          transition: 'transform 0.25s ease',
        }}>

          {/* New Chat */}
          <div style={{ padding: '12px' }}>
            <button onClick={handleNewChat} style={{
              width: '100%', padding: '11px',
              background: 'transparent',
              border: '1px solid #333', color: '#fff',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', display: 'flex',
              alignItems: 'center', gap: '8px', justifyContent: 'center',
            }}>
              ✏️ New Chat
            </button>
          </div>

          {/* Conversations */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
            <p style={{
              color: '#555', fontSize: '11px',
              padding: '8px 8px 4px',
              fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>Conversations</p>

            {conversations.length === 0 && (
              <p style={{ color: '#444', fontSize: '12px', padding: '8px', textAlign: 'center' }}>
                No chats yet
              </p>
            )}

            {conversations.map(c => (
              <div key={c._id} onClick={() => handleSelectConvo(c)} style={{
                padding: '10px', borderRadius: '8px',
                cursor: 'pointer', marginBottom: '2px',
                background: activeConvo?._id === c._id ? '#1e1e1e' : 'transparent',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '8px',
              }}>
                <span style={{
                  fontSize: '13px', color: '#ccc',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', flex: 1,
                }}>
                  💬 {c.title}
                </span>
                <button onClick={(e) => handleDelete(e, c._id)} style={{
                  background: 'none', border: 'none', color: '#555',
                  cursor: 'pointer', fontSize: '14px',
                  padding: '2px 4px', borderRadius: '4px', flexShrink: 0,
                }}>🗑</button>
              </div>
            ))}
          </div>

          {/* User + Logout */}
          <div style={{
            padding: '12px', borderTop: '1px solid #222',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#10a37f', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700',
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', color: '#ccc' }}>{user?.name}</span>
            </div>
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none', color: '#555',
              cursor: 'pointer', fontSize: '18px',
            }}>⏻</button>
          </div>
        </div>
      )}

      {/* ===== MAIN CHAT ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: isMobile ? '12px 16px' : '14px 20px',
          borderBottom: '1px solid #222',
          display: 'flex', alignItems: 'center', gap: '10px',
          flexShrink: 0,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: 'none', border: 'none', color: '#888',
            cursor: 'pointer', fontSize: '20px', padding: '2px',
            lineHeight: 1,
          }}>☰</button>
          <span style={{
            fontWeight: '600',
            fontSize: isMobile ? '14px' : '15px',
            color: '#fff', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activeConvo ? activeConvo.title : '🤖 AI Assistant'}
          </span>
          <span style={{
            fontSize: '11px', color: '#444', background: '#1a1a1a',
            padding: '3px 10px', borderRadius: '12px', border: '1px solid #333',
            flexShrink: 0,
          }}>GPT-3.5</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px' : '20px' }}>

          {!activeConvo && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: '12px', padding: '20px',
            }}>
              <p style={{ fontSize: isMobile ? '32px' : '40px' }}>🤖</p>
              <h2 style={{
                color: '#fff',
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: '600', textAlign: 'center',
              }}>How can I help you today?</h2>

              <div style={{
                display: 'flex', flexWrap: 'wrap',
                gap: '8px', justifyContent: 'center', marginTop: '8px',
              }}>
                {[
                  'Explain React hooks',
                  'Write a REST API',
                  'Debug my code',
                  'System design basics',
                ].map(s => (
                  <button key={s} onClick={async () => {
                    const result = await dispatch(createConversation(token));
                    if (result.payload?._id) {
                      dispatch(sendMessage({ convId: result.payload._id, message: s, token }));
                      if (isMobile) setSidebarOpen(false);
                    }
                  }} style={{
                    padding: '9px 14px', background: '#1a1a1a',
                    border: '1px solid #333', color: '#ccc',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', marginBottom: '20px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: isMobile ? '30px' : '36px',
                height: isMobile ? '30px' : '36px',
                borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? '#10a37f' : '#333',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: msg.role === 'user' ? '13px' : '16px',
                fontWeight: '700',
              }}>
                {msg.role === 'user' ? user?.name?.charAt(0).toUpperCase() : '🤖'}
              </div>

              <div style={{
                maxWidth: isMobile ? '82%' : '75%',
                padding: isMobile ? '10px 12px' : '14px 18px',
                borderRadius: '12px',
                background: msg.role === 'user' ? '#10a37f' : '#1a1a1a',
                border: msg.role === 'assistant' ? '1px solid #222' : 'none',
                fontSize: isMobile ? '13px' : '14px',
                lineHeight: '1.7',
                wordBreak: 'break-word',
              }}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark} language={match[1]} PreTag="div"
                          customStyle={{ fontSize: isMobile ? '11px' : '13px', borderRadius: '8px' }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code style={{
                          background: '#333', padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: isMobile ? '11px' : '13px',
                        }} {...props}>{children}</code>
                      );
                    },
                    p: ({ children }) => (
                      <p style={{ margin: '0 0 8px', color: '#ddd', lineHeight: '1.7' }}>{children}</p>
                    ),
                    li: ({ children }) => (
                      <li style={{ color: '#ddd', marginBottom: '4px' }}>{children}</li>
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
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-start' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#333', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              }}>🤖</div>
              <div style={{
                padding: '14px 18px', borderRadius: '12px',
                background: '#1a1a1a', border: '1px solid #222',
              }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#10a37f',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: '#2a1515', color: '#ff6b6b',
              padding: '12px 16px', borderRadius: '8px',
              marginBottom: '16px', fontSize: '13px', textAlign: 'center',
            }}>⚠️ {error}</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: isMobile ? '10px 12px' : '16px 20px',
          borderTop: '1px solid #222', flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            background: '#1a1a1a', border: '1px solid #333',
            borderRadius: '12px',
            padding: isMobile ? '10px 12px' : '12px 16px',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeConvo ? 'Message AI...' : 'New Chat banao pehle'}
              disabled={!activeConvo || sending}
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: '#fff', fontSize: isMobile ? '13px' : '14px',
                resize: 'none', outline: 'none',
                maxHeight: '150px', overflowY: 'auto', lineHeight: '1.6',
                opacity: !activeConvo ? 0.4 : 1,
              }}
            />
            <button onClick={handleSend}
              disabled={!input.trim() || sending || !activeConvo}
              style={{
                width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                background: input.trim() && activeConvo && !sending ? '#10a37f' : '#333',
                color: '#fff', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
              }}>
              {sending ? '⏳' : '↑'}
            </button>
          </div>
          <p style={{
            color: '#444', fontSize: '11px',
            textAlign: 'center', marginTop: '6px',
          }}>
            AI can make mistakes — verify important info
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
    </div>
  );
}