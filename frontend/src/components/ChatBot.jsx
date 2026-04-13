import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiChatAlt2, HiX, HiPaperAirplane, HiStatusOnline,
  HiChevronDown, HiSparkles, HiTrash, HiMail, HiPhone,
  HiChevronLeft, HiExternalLink, HiQuestionMarkCircle
} from 'react-icons/hi';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const ChatBot = () => {
  const { isChatOpen, setChatOpen } = useUIStore();
  const [view, setView] = useState('menu'); // 'menu' or 'chat'
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Welcome to TrackIQ Support. How can we help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);

  const supportEmail = "support@railwayexam.com";
  const supportPhone = "+91 8639275907";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view, isChatOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat/message', {
        message: userMessage.content,
        history: messages.slice(-6)
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, we are facing some connectivity issues. Please try again later or use our Email support.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Hello! Chat cleared. How else can we help you today?' }
    ]);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="chatbot-container" style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass-card"
            style={{
              width: '380px',
              height: '520px',
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              border: '1px solid var(--border-glow)',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--saffron), var(--primary-dark))',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {view === 'chat' ? (
                  <button
                    onClick={() => setView('menu')}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <HiChevronLeft size={24} />
                  </button>
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HiQuestionMarkCircle size={20} />
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                    {view === 'menu' ? 'TrackIQ Support' : 'Support Chat'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', opacity: 0.9 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></div>
                    Agents Online
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {view === 'chat' && (
                  <button
                    onClick={clearChat}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}
                    title="Clear Chat"
                  >
                    <HiTrash size={18} />
                  </button>
                )}
                <button
                  onClick={() => setChatOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  <HiChevronDown size={24} />
                </button>
              </div>
            </div>

            {view === 'menu' ? (
              /* Support Menu View */
              <div style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'rgba(5,5,5,0.4)',
                overflowY: 'auto'
              }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                  How would you like to connect with us?
                </p>

                {/* Email Support */}
                <div
                  onClick={() => copyToClipboard(supportEmail, "Email")}
                  style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 153, 51, 0.1)', color: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HiMail size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>Email Support</h5>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{supportEmail}</p>
                  </div>
                  <HiExternalLink style={{ color: 'var(--text-tertiary)' }} />
                </div>

                {/* Phone Support */}
                <a
                  href={`tel:${supportPhone.replace(/\s/g, '')}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HiPhone size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>Phone Support</h5>
                      <p style={{ margin: '2px 0 0', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{supportPhone}</p>
                    </div>
                    <HiExternalLink style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </a>

                {/* Chat Support */}
                <div
                  onClick={() => setView('chat')}
                  style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HiChatAlt2 size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>Live Chat</h5>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Start a message session</p>
                  </div>
                  <HiChevronLeft style={{ color: 'var(--text-tertiary)', transform: 'rotate(180deg)' }} />
                </div>

                <div style={{ marginTop: 'auto', textAlign: 'center', padding: '10px' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>
                    Available Mon-Sat: 9 AM - 8 PM
                  </p>
                </div>
              </div>
            ) : (
              /* Chat Interface View */
              <>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  background: 'rgba(5,5,5,0.4)'
                }}>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                        background: msg.role === 'user' ? 'var(--saffron)' : 'rgba(255,255,255,0.08)',
                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)'
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        {msg.role === 'user' ? 'You' : 'Support Agent'}
                      </span>
                    </div>
                  ))}
                  {isLoading && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '10px' }}>
                      <div className="pulse-dot"></div>
                      <div className="pulse-dot" style={{ animationDelay: '0.2s' }}></div>
                      <div className="pulse-dot" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form
                  onSubmit={handleSendMessage}
                  style={{ padding: '15px', borderTop: '1px solid var(--border)', background: 'rgba(5,5,5,0.6)' }}
                >
                  <div style={{ position: 'relative', display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your message..."
                      className="glass-input"
                      style={{ paddingRight: '45px', borderRadius: '25px' }}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isLoading}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: inputValue.trim() ? 'var(--saffron)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: inputValue.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                      }}
                    >
                      <HiPaperAirplane style={{ transform: 'rotate(90deg)' }} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setChatOpen(!isChatOpen)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--saffron), var(--primary-dark))',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(255, 153, 51, 0.4)',
          position: 'relative'
        }}
      >
        {isChatOpen ? <HiX size={28} /> : <HiChatAlt2 size={28} />}
        {!isChatOpen && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '18px',
              height: '18px',
              background: 'var(--accent)',
              borderRadius: '50%',
              border: '3px solid var(--bg-dark)',
              zIndex: 1
            }}
          />
        )}
      </motion.button>
    </div>
  );
};

export default ChatBot;
