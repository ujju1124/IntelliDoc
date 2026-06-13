import { useState } from 'react';
import { sendDebateMessage } from '../services/api';

const useDebate = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Load stored messages when switching to a session ──────────────────────
  const loadMessages = (stored) => {
    if (Array.isArray(stored)) {
      setMessages(stored);
    } else {
      setMessages([]);
    }
  };

  // ── Send a new debate message ──────────────────────────────────────────────
  const sendMessage = async (sessionId, userMessage, documentId) => {
    if (!userMessage.trim() || !sessionId || !documentId) {
      setError('Missing required parameters');
      return;
    }

    setLoading(true);
    setError(null);

    // Optimistically add the user turn with empty agent slots
    const newTurn = {
      userMessage,
      timestamp: new Date().toISOString(),
      debate: {
        summarizer: '',
        critic: '',
        devils_advocate: '',
        moderator: '',
      },
      isTyping: {
        summarizer: true,
        critic: false,
        devils_advocate: false,
        moderator: false,
      },
    };

    setMessages((prev) => [...prev, newTurn]);

    // Staggered typing indicators
    const timers = [];
    timers.push(setTimeout(() => showTyping(true, false, false, false), 0));
    timers.push(setTimeout(() => showTyping(true, true, false, false), 600));
    timers.push(setTimeout(() => showTyping(true, true, true, false), 1200));
    timers.push(setTimeout(() => showTyping(true, true, true, true), 1800));

    try {
      const response = await sendDebateMessage(sessionId, userMessage, documentId);

      // Clear all timers
      timers.forEach(clearTimeout);

      // Replace the optimistic entry with the real response
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.length - 1;
        if (last >= 0) {
          updated[last] = {
            ...updated[last],
            debate: response.debate,
            isTyping: { summarizer: false, critic: false, devils_advocate: false, moderator: false },
          };
        }
        return updated;
      });
    } catch (err) {
      timers.forEach(clearTimeout);
      setError(err.message || 'Failed to send message');
      // Remove the failed optimistic turn
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const showTyping = (s, c, d, m) => {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated.length - 1;
      if (last >= 0) {
        updated[last] = {
          ...updated[last],
          isTyping: { summarizer: s, critic: c, devils_advocate: d, moderator: m },
        };
      }
      return updated;
    });
  };

  const reset = () => {
    setMessages([]);
    setLoading(false);
    setError(null);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadMessages,
    reset,
  };
};

export default useDebate;
