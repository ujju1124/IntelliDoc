import { useState } from 'react';
import { analyzeDocument } from '../services/api';

const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const analyzeDoc = async (documentId) => {
    if (!documentId) {
      setError('Document ID is required');
      return null;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await analyzeDocument(documentId);
      setData(response);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze document';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return {
    loading,
    error,
    data,
    analyzeDoc,
    reset,
  };
};

export default useAnalysis;
