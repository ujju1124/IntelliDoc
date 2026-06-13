import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import DashboardSkeleton from '../components/DashboardSkeleton';
import InsightCard from '../components/InsightCard';
import MindMap from '../components/MindMap';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { useAppContext } from '../context/AppContext';
import useAnalysis from '../hooks/useAnalysis';
import useChat from '../hooks/useChat';
import { timeAgo } from '../utils/helpers';

const TABS = ['Analysis', 'Chat'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentDocument, analysisData, setAnalysisData, currentSession } = useAppContext();
  const { loading, error, analyzeDoc } = useAnalysis();
  const chat = useChat();

  const [activeTab, setActiveTab] = useState('Analysis');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);
  const chatTextareaRef = useRef(null);

  // ── Guards ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentDocument) navigate('/');
  }, [currentDocument, navigate]);

  // ── Auto-analyze ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      currentDocument &&
      (!analysisData || analysisData.document_id !== currentDocument.document_id)
    ) {
      analyzeDoc(currentDocument.document_id).then(result => {
        if (result) setAnalysisData(result);
      });
    }
  }, [currentDocument]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // ── Chat auto-scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRegenerate = async () => {
    setAnalysisData(null);
    const result = await analyzeDoc(currentDocument.document_id);
    if (result) setAnalysisData(result);
    else toast.error('Regeneration failed');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chat.loading) return;
    const msg = chatInput.trim();
    setChatInput('');
    if (chatTextareaRef.current) chatTextareaRef.current.style.height = 'auto';
    await chat.sendMessage(currentSession, msg, currentDocument.document_id);
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
  };

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
    if (chatTextareaRef.current) {
      chatTextareaRef.current.style.height = 'auto';
      chatTextareaRef.current.style.height =
        Math.min(chatTextareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading || (!analysisData && !error)) {
    return (
      <div className="min-h-screen bg-background dot-grid">
        <Navbar showDocument documentName={currentDocument?.filename} />
        <DashboardSkeleton />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && !analysisData) {
    return (
      <div className="min-h-screen bg-background dot-grid">
        <Navbar showDocument documentName={currentDocument?.filename} />
        <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Analysis Failed</h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button onClick={() => navigate('/')}
              className="px-6 py-2 rounded-lg bg-violet hover:bg-violet/90 text-white font-medium transition-colors">
              Upload New Document
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dot-grid">
      <Navbar showDocument documentName={currentDocument?.filename} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* ── Tab bar + Regenerate ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-violet text-white shadow-lg shadow-violet/20'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-text-secondary hover:border-violet/40 hover:text-violet hover:bg-violet/5 transition-all disabled:opacity-40"
          >
            {loading ? <Spinner size="sm" /> : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Regenerate
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* ════════════ ANALYSIS TAB ════════════ */}
          {activeTab === 'Analysis' && (
            <motion.div key="analysis"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

              {/* Summary */}
              <div className="glass-card p-6 border-l-4 border-violet mb-8">
                <p className="text-xs font-bold text-violet uppercase tracking-wider mb-3">
                  Document Summary
                </p>
                <p className="text-text-primary text-base leading-relaxed">
                  {analysisData?.summary}
                </p>
              </div>

              {/* Insights + Mind map */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="text-xs font-bold text-violet uppercase tracking-wider mb-4">
                    Key Insights
                  </h2>
                  <div className="space-y-3">
                    {analysisData?.insights?.map((insight, i) => (
                      <InsightCard key={i} number={i + 1} insight={insight} delay={i * 0.08} />
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-bold text-violet uppercase tracking-wider mb-4">
                    Mind Map
                  </h2>
                  <div className="glass-card p-4">
                    <MindMap data={analysisData?.mindmap} />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="glass-card p-8 max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Ready to go deeper?</h2>
                <p className="text-text-secondary mb-6">
                  Ask our AI agents to debate and analyze this document
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => navigate('/debate')}
                    className="gradient-button px-8 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 group">
                    <span>Start Agent Debate</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button onClick={() => setActiveTab('Chat')}
                    className="px-8 py-3 rounded-lg font-semibold border border-white/10 text-text-primary hover:border-violet/40 hover:bg-violet/5 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Quick Chat
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════ CHAT TAB ════════════ */}
          {activeTab === 'Chat' && (
            <motion.div key="chat"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1" style={{ scrollbarWidth: 'thin' }}>
                {chat.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <svg className="w-14 h-14 text-violet/25 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-text-primary font-semibold mb-1">Ask anything about this document</p>
                    <p className="text-text-secondary text-sm mb-6">Simple Q&A — no agents, just direct answers</p>
                    {/* Suggested questions from analysis */}
                    {analysisData?.suggested_questions?.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                        {analysisData.suggested_questions.map((q, i) => (
                          <button key={i} onClick={() => setChatInput(q)}
                            className="px-4 py-2 rounded-full border border-violet/30 text-sm text-violet hover:bg-violet/10 transition-colors text-left">
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto w-full space-y-4">
                    {chat.messages.map((msg, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'user' ? (
                          <div className="max-w-[75%]">
                            <div className="gradient-button rounded-xl px-4 py-3">
                              <p className="text-white text-sm">{msg.content}</p>
                            </div>
                            <p className="text-xs text-text-secondary mt-1 text-right">{timeAgo(msg.timestamp)}</p>
                          </div>
                        ) : (
                          <div className="max-w-[80%] glass-card p-4 border-l-4 border-violet/50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-violet/30 flex items-center justify-center">
                                <svg className="w-3 h-3 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                              </div>
                              <span className="text-xs font-semibold text-violet">IntelliDoc</span>
                            </div>
                            <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {chat.loading && (
                      <div className="flex justify-start">
                        <div className="glass-card px-4 py-3 flex items-center gap-2">
                          <Spinner size="sm" />
                          <span className="text-xs text-text-secondary">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="max-w-3xl mx-auto w-full">
                <div className="glass-card p-3 flex gap-3 items-end">
                  <textarea
                    ref={chatTextareaRef}
                    value={chatInput}
                    onChange={handleChatInputChange}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask a question about this document..."
                    disabled={chat.loading}
                    rows={1}
                    className="flex-1 bg-transparent text-text-primary placeholder-text-secondary resize-none outline-none text-sm disabled:opacity-50"
                    style={{ maxHeight: '120px' }}
                  />
                  <button onClick={handleSendChat}
                    disabled={!chatInput.trim() || chat.loading}
                    className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet hover:bg-violet/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                    {chat.loading ? <Spinner size="sm" color="white" /> : (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-text-secondary/50 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default DashboardPage;
