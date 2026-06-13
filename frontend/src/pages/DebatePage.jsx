import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import DebatePanel from '../components/DebatePanel';
import Spinner from '../components/Spinner';
import SessionsSidebar from '../components/SessionsSidebar';
import { useToast } from '../components/Toast';
import { useAppContext } from '../context/AppContext';
import useDebate from '../hooks/useDebate';
import { truncateText } from '../utils/helpers';

const DebatePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    currentDocument,
    analysisData,
    currentSession,
    activeMessages,
    setActiveMessages,
    newSession,
    allSessions,
    activeSessionId,
    isActiveSessionReadOnly,
  } = useAppContext();

  const { messages, loading, error, sendMessage, reset, loadMessages } = useDebate();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Is the viewed session from a different document?
  const readOnly = isActiveSessionReadOnly();

  // ── Guards ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentDocument) { navigate('/'); return; }
    if (!analysisData)    { navigate('/dashboard'); }
  }, [currentDocument, analysisData, navigate]);

  // ── Sync stored messages → hook when switching sessions ───────────────────
  useEffect(() => {
    loadMessages(activeMessages);
  }, [currentSession]); // re-load on session switch

  // ── Persist live messages back to context ─────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setActiveMessages(messages);
    }
  }, [messages, setActiveMessages]);

  // ── Errors ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(currentSession, userMessage, currentDocument.document_id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  const handleNewSession = () => {
    reset();
    newSession();
    toast.success('New session started');
  };

  const handleSuggestedQuestion = (q) => {
    setInput(q);
    textareaRef.current?.focus();
  };

  // ── Data ───────────────────────────────────────────────────────────────────
  const suggestedQuestions = [
    'What are the main arguments?',
    'What are the weaknesses?',
    'Summarize the key points',
    "What's the opposing view?",
  ];

  const agentLegend = [
    { name: 'Summarizer',       color: '#3b82f6', emoji: '🔵', role: 'Factual analysis from the document' },
    { name: 'Critic',           color: '#ef4444', emoji: '🔴', role: 'Challenges assumptions and weaknesses' },
    { name: "Devil's Advocate", color: '#f59e0b', emoji: '🟡', role: 'Argues alternative perspectives' },
    { name: 'Moderator',        color: '#10b981', emoji: '🟢', role: 'Synthesizes all views into final verdict' },
  ];

  return (
    <div className="min-h-screen bg-background dot-grid flex flex-col">
      <Navbar showDocument documentName={currentDocument?.filename} />

      <main className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

        {/* ── Sessions Sidebar ─────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-shrink-0 overflow-hidden border-r border-white/5"
            >
              <div className="w-[260px] h-full flex flex-col p-3 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-violet uppercase tracking-wider">
                    Sessions
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                    title="Close sidebar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                <SessionsSidebar onNewSession={handleNewSession} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Area ────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top bar with sidebar toggle + doc info */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                title="Open sessions sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <svg className="w-3.5 h-3.5 text-text-secondary/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-text-secondary truncate">
                {truncateText(currentDocument?.filename, 40)}
              </span>
            </div>

            {/* Agent pills */}
            <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
              {agentLegend.map(a => (
                <span
                  key={a.name}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: a.color + '22', color: a.color }}
                >
                  {a.name}
                </span>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'thin' }}>
            {/* Read-only banner for sessions from other documents */}
            {readOnly && messages.length > 0 && (
              <div className="max-w-4xl mx-auto mb-4">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>
                    This session was from <strong className="font-semibold">
                      {allSessions.find(s => s.id === activeSessionId)?.documentName || 'another document'}
                    </strong>. Viewing read-only.
                  </span>
                  <button
                    onClick={handleNewSession}
                    className="ml-auto flex-shrink-0 px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium transition-colors"
                  >
                    New Session
                  </button>
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <EmptyState questions={suggestedQuestions} onSelect={handleSuggestedQuestion} />
            ) : (
              <div className="max-w-4xl mx-auto">
                <DebatePanel messages={messages} />
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/5">
            <div className="max-w-4xl mx-auto">
              {readOnly ? (
                /* Read-only state — show prompt to start new session */
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/3 border border-white/10">
                  <svg className="w-4 h-4 text-text-secondary/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm text-text-secondary/60 flex-1">
                    Read-only — upload the original document to continue this debate
                  </span>
                  <button
                    onClick={handleNewSession}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-violet/20 hover:bg-violet/30 text-violet text-sm font-medium transition-colors"
                  >
                    New Session
                  </button>
                </div>
              ) : (
                /* Active input */
                <>
                  <div className="glass-card p-3 flex gap-3 items-end">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question..."
                      disabled={loading}
                      rows={1}
                      className="flex-1 bg-transparent text-text-primary placeholder-text-secondary resize-none outline-none text-sm disabled:opacity-50"
                      style={{ maxHeight: '150px' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet hover:bg-violet/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      {loading ? (
                        <Spinner size="sm" color="white" />
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <p className="text-xs text-text-secondary/50">Enter to send · Shift+Enter for new line</p>
                    <p className="text-xs text-text-secondary/50">{input.length}/1000</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Info Panel ─────────────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col w-[200px] flex-shrink-0 border-l border-white/5 p-3 gap-4">
          {/* Agent Legend */}
          <div>
            <p className="text-xs font-bold text-violet uppercase tracking-wider mb-3">Agents</p>
            <div className="space-y-3">
              {agentLegend.map((agent) => (
                <div key={agent.name} className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0 mt-0.5">{agent.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary">{agent.name}</p>
                    <p className="text-xs text-text-secondary leading-snug">{agent.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current session info */}
          <div className="mt-auto pt-3 border-t border-white/5">
            <p className="text-xs font-bold text-violet uppercase tracking-wider mb-2">Current</p>
            <p className="text-xs text-text-secondary mb-1">Document</p>
            <p className="text-xs text-text-primary/70 truncate">
              {readOnly
                ? allSessions.find(s => s.id === activeSessionId)?.documentName || '—'
                : truncateText(currentDocument?.filename, 20)
              }
            </p>
            {readOnly && (
              <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium tracking-wide">
                VIEW ONLY
              </span>
            )}
            <p className="text-xs text-text-secondary mt-2 mb-1">Messages</p>
            <p className="text-xs text-text-primary">{messages.length} question{messages.length !== 1 ? 's' : ''}</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ questions, onSelect }) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-20">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg className="w-16 h-16 text-violet/25 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
      <h2 className="text-xl font-bold text-text-primary mb-2">Start a Debate</h2>
      <p className="text-text-secondary text-sm mb-6 max-w-sm">
        Ask a question and watch our AI agents debate from different perspectives
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="px-4 py-2 rounded-full border border-violet/30 text-sm text-violet hover:bg-violet/10 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  </div>
);

export default DebatePage;
