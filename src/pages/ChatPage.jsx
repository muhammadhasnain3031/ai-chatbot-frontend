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
  const { user, token }                         = useSelector(s => s.auth);
  const { conversations, messages, sending,
          error, activeConvo }                  = useSelector(s => s.chat);
  const [input, setInput]   = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
  if (token) dispatch(fetchConversations(token));
}, [token, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleNewChat = async () => {
    await dispatch(createConversation(token));
  };

  const handleSelectConvo = (convo) => {
    dispatch(fetchMessages({ id: convo._id, token }));
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

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0d0d0d', color:'#fff', fontFamily:'-apple-system, sans-serif' }}>

      {/* ===== SIDEBAR ===== */}
      {sidebarOpen && (
        <div style={{ width:'260px', background:'#111', borderRight:'1px solid #222', display:'flex', flexDirection:'column', flexShrink:0 }}>

          {/* New Chat Button */}
          <div style={{ padding:'12px' }}>
            <button onClick={handleNewChat}
              style={{ width:'100%', padding:'11px', background:'transparent', border:'1px solid #333', color:'#fff', borderRadius:'8px', cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}>
              ✏️ New Chat
            </button>
          </div>

          {/* Conversations */}
          <div style={{ flex:1, overflowY:'auto', padding:'0 8px' }}>
            <p style={{ color:'#555', fontSize:'11px', padding:'8px 8px 4px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Conversations
            </p>
            {conversations.length === 0 && (
              <p style={{ color:'#444', fontSize:'12px', padding:'8px', textAlign:'center' }}>
                No chats yet — click New Chat
              </p>
            )}
            {conversations.map(c => (
              <div key={c._id}
                onClick={() => handleSelectConvo(c)}
                style={{
                  padding:'10px 10px', borderRadius:'8px', cursor:'pointer', marginBottom:'2px',
                  background: activeConvo?._id === c._id ? '#1e1e1e' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px',
                  transition:'background .15s'
                }}>
                <span style={{ fontSize:'13px', color:'#ccc', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                  💬 {c.title}
                </span>
                <button onClick={(e) => handleDelete(e, c._id)}
                  style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:'14px', padding:'2px 4px', borderRadius:'4px', flexShrink:0 }}
                  title="Delete">
                  🗑
                </button>
              </div>
            ))}
          </div>

          {/* User info + Logout */}
          <div style={{ padding:'12px', borderTop:'1px solid #222', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#10a37f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize:'13px', color:'#ccc' }}>{user?.name}</span>
            </div>
            <button onClick={handleLogout}
              style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:'18px' }}
              title="Logout">
              ⏻
            </button>
          </div>
        </div>
      )}

      {/* ===== MAIN CHAT AREA ===== */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #222', display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:'18px', padding:'4px' }}>
            ☰
          </button>
          <span style={{ fontWeight:'600', fontSize:'15px', color:'#fff' }}>
            {activeConvo ? activeConvo.title : '🤖 AI Assistant'}
          </span>
          <span style={{ marginLeft:'auto', fontSize:'11px', color:'#444', background:'#1a1a1a', padding:'3px 10px', borderRadius:'12px', border:'1px solid #333' }}>
            GPT-3.5 Turbo
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

          {/* No active conversation */}
          {!activeConvo && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'16px' }}>
              <p style={{ fontSize:'40px' }}>🤖</p>
              <h2 style={{ color:'#fff', fontSize:'20px', fontWeight:'600' }}>How can I help you today?</h2>
              <p style={{ color:'#666', fontSize:'14px', textAlign:'center', maxWidth:'400px' }}>
                Start a new conversation from the sidebar
              </p>

              {/* Suggestion chips */}
              {[
                'Explain React hooks with examples',
                'Write a Node.js REST API',
                'Debug my JavaScript code',
                'What is system design?'
              ].map(s => (
                <button key={s} onClick={async () => {
                  const result = await dispatch(createConversation(token));
                  if (result.payload?._id) {
                    dispatch(sendMessage({ convId: result.payload._id, message: s, token }));
                    setInput('');
                  }
                }}
                  style={{ padding:'10px 18px', background:'#1a1a1a', border:'1px solid #333', color:'#ccc', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg, i) => (
            <div key={i} style={{
              display:'flex', gap:'14px', marginBottom:'24px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems:'flex-start'
            }}>
              {/* Avatar */}
              <div style={{
                width:'36px', height:'36px', borderRadius:'50%', flexShrink:0,
                background: msg.role === 'user' ? '#10a37f' : '#444',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'16px', fontWeight:'700'
              }}>
                {msg.role === 'user' ? user?.name?.charAt(0).toUpperCase() : '🤖'}
              </div>

              {/* Message bubble */}
              <div style={{
                maxWidth:'75%', padding:'14px 18px', borderRadius:'12px',
                background: msg.role === 'user' ? '#10a37f' : '#1a1a1a',
                border: msg.role === 'assistant' ? '1px solid #222' : 'none',
                fontSize:'14px', lineHeight:'1.7',
              }}>
                {msg.role === 'assistant' ? (
                  // ✅ Markdown + Code highlighting for AI responses
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code style={{ background:'#333', padding:'2px 6px', borderRadius:'4px', fontSize:'13px' }} {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p style={{ margin:'0 0 8px', color:'#ddd' }}>{children}</p>,
                      li: ({ children }) => <li style={{ color:'#ddd', marginBottom:'4px' }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ color:'#fff' }}>{children}</strong>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p style={{ margin:0, color:'#fff', whiteSpace:'pre-wrap' }}>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* AI typing indicator */}
          {sending && (
            <div style={{ display:'flex', gap:'14px', marginBottom:'24px', alignItems:'flex-start' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'#444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🤖</div>
              <div style={{ padding:'14px 18px', borderRadius:'12px', background:'#1a1a1a', border:'1px solid #222' }}>
                <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width:'8px', height:'8px', borderRadius:'50%', background:'#10a37f',
                      animation:'bounce 1.2s infinite',
                      animationDelay: `${i * 0.2}s`
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background:'#2a1515', color:'#ff6b6b', padding:'12px 16px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px', textAlign:'center' }}>
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding:'16px 20px', borderTop:'1px solid #222' }}>
          {!activeConvo && (
            <p style={{ color:'#555', fontSize:'12px', textAlign:'center', marginBottom:'8px' }}>
              Create a new chat to start messaging
            </p>
          )}
          <div style={{ display:'flex', gap:'10px', alignItems:'flex-end', background:'#1a1a1a', border:'1px solid #333', borderRadius:'12px', padding:'12px 16px' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeConvo ? "Message AI Assistant... (Enter to send, Shift+Enter for new line)" : "Create a new chat first"}
              disabled={!activeConvo || sending}
              rows={1}
              style={{
                flex:1, background:'transparent', border:'none', color:'#fff',
                fontSize:'14px', resize:'none', outline:'none', maxHeight:'200px',
                overflowY:'auto', lineHeight:'1.6',
                opacity: !activeConvo ? 0.4 : 1
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || !activeConvo}
              style={{
                width:'36px', height:'36px', borderRadius:'8px', border:'none',
                background: input.trim() && activeConvo && !sending ? '#10a37f' : '#333',
                color:'#fff', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'16px', flexShrink:0, transition:'background .2s'
              }}>
              {sending ? '⏳' : '↑'}
            </button>
          </div>
          <p style={{ color:'#444', fontSize:'11px', textAlign:'center', marginTop:'8px' }}>
            AI can make mistakes — verify important information
          </p>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}