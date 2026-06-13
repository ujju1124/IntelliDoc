import axios from 'axios';

// Use environment variable in production, fall back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Ingest a document file
 * @param {File} file - The document file to upload
 * @param {string} strategy - Chunking strategy ('fixed' or 'sentence')
 * @returns {Promise<Object>} - {document_id, filename, chunk_count, strategy}
 */
export const ingestDocument = async (file, strategy = 'sentence') => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/ingest?strategy=${strategy}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to upload document';
    throw new Error(message);
  }
};

/**
 * Analyze a document and get intelligence dashboard data
 * @param {string} documentId - The document ID to analyze
 * @returns {Promise<Object>} - {summary, insights, mindmap}
 */
export const analyzeDocument = async (documentId) => {
  try {
    const response = await api.post('/analyze', {
      document_id: documentId,
    });

    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to analyze document';
    throw new Error(message);
  }
};

/**
 * Send a message to the multi-agent debate system
 * @param {string} sessionId - Session identifier
 * @param {string} userMessage - User's question/message
 * @param {string} documentId - Document ID to query against
 * @returns {Promise<Object>} - {session_id, user_message, debate: {summarizer, critic, devils_advocate, moderator}}
 */
export const sendDebateMessage = async (sessionId, userMessage, documentId) => {
  try {
    const response = await api.post('/debate', {
      session_id: sessionId,
      user_message: userMessage,
      document_id: documentId,
    });

    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to send message to debate';
    throw new Error(message);
  }
};

/**
 * Send a message to the conversational chat (simple RAG, no agents)
 */
export const sendChatMessage = async (sessionId, userMessage, documentId) => {
  try {
    const response = await api.post('/chat', {
      session_id: sessionId,
      user_message: userMessage,
      document_id: documentId,
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to send chat message';
    throw new Error(message);
  }
};

/**
 * Fetch all ingested documents
 */
export const fetchDocuments = async () => {
  try {
    const response = await api.get('/documents');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch documents';
    throw new Error(message);
  }
};

/**
 * Delete a document record
 */
export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to delete document';
    throw new Error(message);
  }
};

export default api;
