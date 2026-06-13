import { useState } from 'react';
import { sendChatMessage } from '../services/api';

const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (sessionId, userMessage, documentId) => {
    if (!userMessage.trim()) return;
    setLoading(true);
    setError(null);

    // Optimistic user message
    const userTurn = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userTurn]);

    try {
      const data = await sendChatMessage(sessionId, userMessage, documentId);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response, timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setMessages([]); setLoading(false); setError(null); };

  return { messages, loading, error, sendMessage, reset };
};

export default useChat;
