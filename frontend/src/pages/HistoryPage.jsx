import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { useAppContext } from '../context/AppContext';
import { fetchDocuments, deleteDocument } from '../services/api';
import { timeAgo } from '../utils/helpers';

const HistoryPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { setCurrentDocument, setAnalysisData } = useAppContext();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      toast.error('Failed to load document history');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (doc) => {
    // Set document as current — clear old analysis so dashboard re-analyzes
    setAnalysisData(null);
    setCurrentDocument({
      document_id: doc.document_id,
      filename: doc.filename,
      chunk_count: doc.chunk_count,
      strategy: doc.strategy,
    });
    navigate('/dashboard');
  };

  const handleDelete = async (docId) => {
    if (confirmDelete !== docId) {
      setConfirmDelete(docId);
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    try {
      setDeletingId(docId);
      await deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.document_id !== docId));
      toast.success('Document removed');
    } catch (err) {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background dot-grid">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-1">Document History</h1>
              <p className="text-text-secondary text-sm">
                {documents.length} document{documents.length !== 1 ? 's' : ''} ingested
              </p>
            </div>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-button text-white text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              New Document
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" />
            <p className="text-text-secondary mt-4 text-sm animate-pulse">Loading history...</p>
          </div>
        ) : documents.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-16 h-16 text-violet/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold text-text-primary mb-2">No documents yet</h2>
            <p className="text-text-secondary mb-6">Upload your first document to get started</p>
            <button onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-lg gradient-button text-white font-medium">
              Upload Document
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-3">
            <AnimatePresence>
              {documents.map((doc, i) => (
                <motion.div key={doc.document_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-5 flex items-center gap-4 hover:border-violet/20 transition-all group">

                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-semibold truncate">{doc.filename}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-text-secondary">
                        {doc.chunk_count} chunks
                      </span>
                      <span className="text-text-secondary/30 text-xs">·</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet/10 text-violet capitalize">
                        {doc.strategy}
                      </span>
                      <span className="text-text-secondary/30 text-xs">·</span>
                      <span className="text-xs text-text-secondary/60">
                        {timeAgo(doc.upload_time)}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-text-secondary/40 mt-1 truncate">
                      {doc.document_id}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleResume(doc)}
                      className="px-4 py-1.5 rounded-lg bg-violet/15 hover:bg-violet/25 text-violet text-sm font-medium transition-colors flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Analyze
                    </button>
                    <button
                      onClick={() => handleDelete(doc.document_id)}
                      disabled={deletingId === doc.document_id}
                      className={`p-1.5 rounded-lg transition-colors ${
                        confirmDelete === doc.document_id
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'text-text-secondary/40 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={confirmDelete === doc.document_id ? 'Click again to confirm' : 'Delete'}
                    >
                      {deletingId === doc.document_id ? (
                        <Spinner size="sm" />
                      ) : confirmDelete === doc.document_id ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
