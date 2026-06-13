import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateSessionId } from '../utils/helpers';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

// ─── localStorage helpers ───────────────────────────────────────────────────

const LS_SESSIONS_KEY = 'intellidoc_sessions';
const LS_ACTIVE_KEY   = 'intellidoc_active_session';
const SS_DOCUMENT_KEY = 'currentDocument';
const SS_ANALYSIS_KEY = 'analysisData';

const loadSessions = () => {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions) => {
  try {
    // Cap: keep at most 100 sessions, drop the oldest first
    const capped = sessions.slice(0, 100);
    const serialised = JSON.stringify(capped);

    // Guard against exceeding ~4MB to leave headroom in the 5MB localStorage limit
    if (serialised.length > 4 * 1024 * 1024) {
      // Trim oldest half and try again
      const trimmed = capped.slice(0, Math.floor(capped.length / 2));
      localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(trimmed));
      console.warn('[Sessions] localStorage near limit — trimmed to', trimmed.length, 'sessions');
    } else {
      localStorage.setItem(LS_SESSIONS_KEY, serialised);
    }
  } catch (e) {
    console.error('Error saving sessions:', e);
  }
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const AppContextProvider = ({ children }) => {
  // Current document being analyzed / debated
  const [currentDocument, setCurrentDocument] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SS_DOCUMENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // Intelligence dashboard analysis
  const [analysisData, setAnalysisData] = useState(() => {
    try {
      const raw = sessionStorage.getItem(SS_ANALYSIS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  // All saved debate sessions
  const [allSessions, setAllSessions] = useState(() => loadSessions());

  // The currently active session id
  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem(LS_ACTIVE_KEY) || generateSessionId();
  });

  // Active session messages (live, in-memory)
  const [activeMessages, setActiveMessages] = useState(() => {
    const sessions = loadSessions();
    const active = sessions.find(s => s.id === localStorage.getItem(LS_ACTIVE_KEY));
    return active ? active.messages : [];
  });

  // ── Persist document & analysis to sessionStorage ──────────────────────────
  useEffect(() => {
    try {
      if (currentDocument) sessionStorage.setItem(SS_DOCUMENT_KEY, JSON.stringify(currentDocument));
      else sessionStorage.removeItem(SS_DOCUMENT_KEY);
    } catch {}
  }, [currentDocument]);

  useEffect(() => {
    try {
      if (analysisData) sessionStorage.setItem(SS_ANALYSIS_KEY, JSON.stringify(analysisData));
      else sessionStorage.removeItem(SS_ANALYSIS_KEY);
    } catch {}
  }, [analysisData]);

  // ── Persist sessions & active id to localStorage ───────────────────────────
  useEffect(() => {
    saveSessions(allSessions);
  }, [allSessions]);

  useEffect(() => {
    localStorage.setItem(LS_ACTIVE_KEY, activeSessionId);
  }, [activeSessionId]);

  // ── Upsert the active session in allSessions whenever messages change ──────
  const flushActiveSession = useCallback((messages, sessionId, document) => {
    if (!messages || messages.length === 0) return;

    const title = messages[0]?.userMessage
      ? messages[0].userMessage.slice(0, 50) + (messages[0].userMessage.length > 50 ? '…' : '')
      : 'Untitled session';

    setAllSessions(prev => {
      const existing = prev.find(s => s.id === sessionId);
      if (existing) {
        return prev.map(s =>
          s.id === sessionId
            ? { ...s, messages, title, updatedAt: new Date().toISOString() }
            : s
        );
      }
      return [
        {
          id: sessionId,
          title,
          documentName: document?.filename || 'Unknown document',
          documentId: document?.document_id || null,
          messages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, []);

  // Flush whenever messages or active session change
  useEffect(() => {
    if (activeMessages.length > 0) {
      flushActiveSession(activeMessages, activeSessionId, currentDocument);
    }
  }, [activeMessages, activeSessionId, flushActiveSession, currentDocument]);

  // ── Create a brand new session ─────────────────────────────────────────────
  const newSession = useCallback(() => {
    const id = generateSessionId();
    setActiveSessionId(id);
    setActiveMessages([]);
  }, []);

  // ── Switch to an existing session ─────────────────────────────────────────
  const switchSession = useCallback((sessionId) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;
    setActiveSessionId(sessionId);
    setActiveMessages(session.messages);
    // Also restore the document context if switching to a different-document session
    // so the top bar shows the right document name (read-only indicator handled in UI)
  }, [allSessions]);

  // ── Check if active session belongs to current document ───────────────────
  // Matches by filename (stable) rather than document_id (changes on every re-upload)
  const isActiveSessionReadOnly = useCallback(() => {
    const session = allSessions.find(s => s.id === activeSessionId);
    if (!session) return false; // brand new unsaved session — not read-only
    if (!session.documentName) return false; // old session with no doc stored

    const currentFilename = currentDocument?.filename;
    if (!currentFilename) return false; // no document loaded yet

    // Same filename = same document (user re-uploaded the same file)
    return session.documentName !== currentFilename;
  }, [allSessions, activeSessionId, currentDocument]);

  // ── Delete a session ───────────────────────────────────────────────────────
  const deleteSession = useCallback((sessionId) => {
    setAllSessions(prev => prev.filter(s => s.id !== sessionId));
    // If we deleted the active session, start fresh
    if (sessionId === activeSessionId) {
      newSession();
    }
  }, [activeSessionId, newSession]);

  // ── Legacy clearSession alias (keeps existing code working) ───────────────
  const clearSession = useCallback(() => {
    newSession();
  }, [newSession]);

  // Expose debateMessages as alias so DebatePage still compiles
  const debateMessages = activeMessages;
  const setDebateMessages = setActiveMessages;
  const currentSession = activeSessionId;

  const value = {
    // Document
    currentDocument,
    setCurrentDocument,
    // Analysis
    analysisData,
    setAnalysisData,
    // Sessions — new API
    allSessions,
    activeSessionId,
    activeMessages,
    setActiveMessages,
    newSession,
    switchSession,
    deleteSession,
    isActiveSessionReadOnly,
    // Legacy aliases (keeps DebatePage working without changes)
    currentSession,
    debateMessages,
    setDebateMessages,
    clearSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
