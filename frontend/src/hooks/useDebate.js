import { useState } from 'react';
import { sendDebateMessage } from '../services/api';

const useDebate = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingAgents, setTypingAgents] = useState({
    summarizer: false,
    critic: false,
    devils_advocate: false,
    moderator: false,
  });

  const sendMessage = async (sessionId, userMessage, documentId) => {
    if (!userMessage.trim() || !sessionId || !documentId) {
      setError('Missing required parameters');
      return;
    }

    setLoading(true);
    setError(null);

    // Add user message and typing indicators immediately
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
        summarizer: false,
        critic: false,
        devils_advocate: false,
        moderator: false,
      },
    };

    setMessages((prev) => [...prev, newTurn]);

    // Show typing indicators with staggered delays
    setTimeout(() => {
      setTypingAgents((prev) => ({ ...prev, summarizer: true }));
      updateMessageTyping(messages.length, 'summarizer', true);
    }, 0);

    setTimeout(() => {
      setTypingAgents((prev) => ({ ...prev, critic: true }));
      updateMessageTyping(messages.length, 'critic', true);
    }, 600);

    setTimeout(() => {
      setTypingAgents((prev) => ({ ...prev, devils_advocate: true }));
      updateMessageTyping(messages.length, 'devils_advocate', true);
    }, 1200);

    setTimeout(() => {
      setTypingAgents((prev) => ({ ...prev, moderator: true }));
      updateMessageTyping(messages.length, 'moderator', true);
    }, 1800);

    try {
      const response = await sendDebateMessage(sessionId, userMessage, documentId);

      // Clear all typing indicators and update with actual responses
      setTypingAgents({
        summarizer: false,
        critic: false,
        devils_advocate: false,
        moderator: false,
      });

      // Update the message with actual debate responses
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            debate: response.debate,
            isTyping: {
              summarizer: false,
              critic: false,
              devils_advocate: false,
              moderator: false,
            },
          };
        }
        return updated;
      });
    } catch (err) {
      setError(err.message || 'Failed to send message');
      
      // Remove the failed message
      setMessages((prev) => prev.slice(0, -1));
      
      // Clear typing indicators
      setTypingAgents({
        summarizer: false,
        critic: false,
        devils_advocate: false,
        moderator: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMessageTyping = (messageIndex, agent, isTyping) => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[messageIndex]) {
        updated[messageIndex] = {
          ...updated[messageIndex],
          isTyping: {
            ...updated[messageIndex].isTyping,
            [agent]: isTyping,
          },
        };
      }
      return updated;
    });
  };

  const reset = () => {
    setMessages([]);
    setLoading(false);
    setError(null);
    setTypingAgents({
      summarizer: false,
      critic: false,
      devils_advocate: false,
      moderator: false,
    });
  };

  return {
    messages,
    loading,
    error,
    typingAgents,
    sendMessage,
    reset,
  };
};

export default useDebate;
