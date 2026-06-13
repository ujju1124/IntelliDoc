import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DebatePanel from '../components/DebatePanel';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { useAppContext } from '../context/AppContext';
import useDebate from '../hooks/useDebate';
import { truncateText, copyToClipboard } from '../utils/helpers';

const DebatePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  const { currentDocument, analysisData, currentSession, debateMessages, setDebateMessages, clearSession } = useAppContext();
  const { messages, loading, error, sendMessage } = useDebate();
  
  const [input, setInput] = useState('');

  // Redirect if no document or analysis
  useEffect(() => {
    if (!currentDocument) {
      navigate('/');
      return;
    }
    if (!analysisData) {
      navigate('/dashboard');
    }
  }, [currentDocument, analysisData, navigate]);

  // Sync messages with context
  useEffect(() => {
    if (debateMessages.length > 0 && messages.length === 0) {
      // Load from context
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setDebateMessages(messages);
    }
  }, [messages, setDebateMessages]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(currentSession, userMessage, currentDocument.document_id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  const handleCopySessionId = async () => {
    const success = await copyToClipboard(currentSession);
    if (success) {
      toast.success('Session ID copied');
    } else {
      toast.error('Failed to copy');
    }
  };

  const handleCopyDocId = async () => {
    const success = await copyToClipboard(currentDocument.document_id);
    if (success) {
      toast.success('Document ID copied');
    } else {
      toast.error('Failed to copy');
    }
  };

  const handleNewSession = () => {
    clearSession();
    toast.info('New session started');
  };

  const suggestedQuestions = [
    "What are the main arguments?",
    "What are the weaknesses?",
    "Summarize the key points",
    "What's the opposing view?",
  ];

  const agentLegend = [
    { name: 'Summarizer', color: '#3b82f6', emoji: '🔵', role: 'Provides factual analysis from the document' },
    { name: 'Critic', color: '#ef4444', emoji: '🔴', role: 'Challenges assumptions and finds weaknesses' },
    { name: "Devil's Advocate", color: '#f59e0b', emoji: '🟡', role: 'Argues alternative perspectives' },
    { name: 'Moderator', color: '#10b981', emoji: '🟢', role: 'Synthesizes all views into final verdict' },
  ];

  return (
    <div className="min-h-screen bg-background dot-grid flex flex-col">
      <Navbar showDocument documentName={currentDocument?.filename} />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Left Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* Document Info */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold text-violet uppercase tracking-wider mb-3">
                Document Info
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-text-secondary text-xs mb-1">Filename</p>
                  <p className="text-text-primary font-medium">{truncateText(currentDocument?.filename, 20)}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs mb-1">Document ID</p>
                  <div className="flex items-center justify-between">
                    <p className="text-violet font-mono text-xs">{truncateText(currentDocument?.document_id, 12)}</p>
                    <button onClick={handleCopyDocId} className="p-1 hover:bg-white/5 rounded">
                      <svg className="w-3 h-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-text-secondary text-xs mb-1">Session ID</p>
                  <div className="flex items-center justify-between">
                    <p className="text-blue font-mono text-xs">{truncateText(currentSession, 12)}</p>
                    <button onClick={handleCopySessionId} className="p-1 hover:bg-white/5 rounded">
                      <svg className="w-3 h-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={handleNewSession}
                className="mt-3 w-full px-3 py-2 rounded-lg border border-white/10 text-sm font-medium text-text-primary hover:border-violet/50 hover:bg-violet/5 transition-all"
              >
                New Session
              </button>
            </div>

            {/* Agent Legend */}
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold text-violet uppercase tracking-wider mb-3">
                Agent Panel
              </h3>
              <div className="space-y-3">
                {agentLegend.map((agent) => (
                  <div key={agent.name} className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{agent.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{agent.name}</p>
                      <p className="text-xs text-text-secondary">{agent.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 glass-card p-6 mb-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              {messages.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="w-20 h-20 text-violet/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-text-primary mb-2">Start a Debate</h2>
                  <p className="text-text-secondary mb-6 max-w-md">
                    Ask a question and watch our AI agents debate from different perspectives
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="px-4 py-2 rounded-full border border-violet/30 text-sm text-violet hover:bg-violet/10 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <DebatePanel messages={messages} />
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="glass-card p-4">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={loading}
                  rows={1}
                  className="flex-1 bg-transparent text-text-primary placeholder-text-secondary resize-none outline-none disabled:opacity-50"
                  style={{ maxHeight: '150px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet hover:bg-violet/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-text-secondary">Press Enter to send, Shift+Enter for new line</p>
                <p className="text-xs text-text-secondary">{input.length}/1000</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DebatePage;
