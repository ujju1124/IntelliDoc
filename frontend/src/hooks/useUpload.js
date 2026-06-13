import { useState } from 'react';
import { ingestDocument } from '../services/api';
import { validateFileType, validateFileSize } from '../utils/helpers';

const useUpload = () => {
  const [file, setFile] = useState(null);
  const [strategy, setStrategy] = useState('sentence'); // 'fixed' or 'sentence'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileSelect = (selectedFile) => {
    setError(null);
    setResult(null);

    // Validate file type
    if (!validateFileType(selectedFile)) {
      setError('Invalid file type. Please upload a PDF or TXT file.');
      return false;
    }

    // Validate file size (max 10MB)
    if (!validateFileSize(selectedFile, 10)) {
      setError('File size exceeds 10MB limit.');
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ingestDocument(file, strategy);
      setResult(response);
      return response;
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyChange = (newStrategy) => {
    setStrategy(newStrategy);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setResult(null);
  };

  const reset = () => {
    setFile(null);
    setStrategy('sentence');
    setLoading(false);
    setError(null);
    setResult(null);
  };

  return {
    file,
    strategy,
    loading,
    error,
    result,
    handleFileSelect,
    handleUpload,
    handleStrategyChange,
    handleDrop,
    handleRemoveFile,
    reset,
  };
};

export default useUpload;
