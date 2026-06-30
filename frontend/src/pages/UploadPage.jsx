import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import FileUpload from '../components/FileUpload';
import Spinner from '../components/Spinner';
import { useToast } from '../components/Toast';
import { useAppContext } from '../context/AppContext';
import useUpload from '../hooks/useUpload';
import { copyToClipboard } from '../utils/helpers';

const UploadPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { setCurrentDocument, setAnalysisData } = useAppContext();
  const {
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
  } = useUpload();

  const onUpload = async () => {
    const uploadResult = await handleUpload();
    if (uploadResult) {
      // Clear old analysis data when uploading new document
      setAnalysisData(null);
      setCurrentDocument(uploadResult);
      toast.success('Document uploaded successfully!');
    }
  };

  const handleCopyDocId = async () => {
    if (result?.document_id) {
      const success = await copyToClipboard(result.document_id);
      if (success) {
        toast.success('Document ID copied to clipboard');
      } else {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleAnalyze = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background dot-grid">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold gradient-text mb-4">
              IntelliDoc
            </h1>
            <p className="text-xl text-text-secondary mb-6">
              Multi-Agent Document Intelligence
            </p>
            <p className="text-base text-text-secondary max-w-2xl mx-auto">
              Upload any document and get instant AI-powered analysis with multi-agent debate, 
              intelligent insights, and interactive mind maps — all powered by advanced RAG technology
            </p>
          </div>

          {/* What is IntelliDoc Section */}
          {!result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What is IntelliDoc?
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                IntelliDoc uses <span className="text-violet font-medium">4 specialized AI agents</span> to analyze your documents from multiple perspectives:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-400">Summarizer</p>
                    <p className="text-xs text-text-secondary">Factual analysis grounded in your document</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400">Critic</p>
                    <p className="text-xs text-text-secondary">Challenges assumptions and finds weaknesses</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-400 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">Devil's Advocate</p>
                    <p className="text-xs text-text-secondary">Argues opposite perspectives</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-400 text-xs font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-400">Moderator</p>
                    <p className="text-xs text-text-secondary">Synthesizes all views into balanced verdict</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* How It Works Section */}
          {!result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                How It Works (3 Simple Steps)
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Upload Your Document</p>
                    <p className="text-xs text-text-secondary">
                      Upload any PDF or TXT file (max 10MB). Choose between sentence-based or fixed-size chunking strategy.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Get Instant Analysis</p>
                    <p className="text-xs text-text-secondary">
                      View auto-generated summary, 5 key insights, interactive mind map, and document-specific debate questions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Start Multi-Agent Debate</p>
                    <p className="text-xs text-text-secondary">
                      Ask questions and watch 4 AI agents debate different perspectives in real-time. Export full debates as markdown.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upload Card */}
          <div className="glass-card p-8">
            {!result ? (
              <>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Upload Your Document
                </h2>
                <p className="text-text-secondary mb-6">
                  Supports PDF and TXT files (max 10MB)
                </p>

                <FileUpload
                  file={file}
                  onFileSelect={handleFileSelect}
                  onDrop={handleDrop}
                  onRemove={handleRemoveFile}
                  strategy={strategy}
                  onStrategyChange={handleStrategyChange}
                  disabled={loading}
                />

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/20">
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={onUpload}
                  disabled={!file || loading}
                  className="mt-6 w-full gradient-button py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" color="white" />
                      <span>Uploading & Processing...</span>
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </button>

                {/* Note for first-time users */}
                <p className="mt-4 text-xs text-text-secondary text-center">
                  💡 First upload may take 60-90 seconds while the AI model initializes
                </p>
              </>
            ) : (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Success Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  Upload Successful!
                </h3>
                <p className="text-text-secondary mb-6">
                  Your document is ready for analysis
                </p>

                {/* Document Info */}
                <div className="glass-card p-4 mb-6 text-left space-y-3">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Filename</p>
                    <p className="text-sm font-medium text-text-primary">{result.filename}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Document ID</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-mono text-violet">{result.document_id}</p>
                      <button
                        onClick={handleCopyDocId}
                        className="p-1 hover:bg-white/5 rounded transition-colors"
                        aria-label="Copy document ID"
                      >
                        <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-text-secondary mb-1">Chunks</p>
                      <p className="text-sm font-medium text-text-primary">{result.chunk_count}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-text-secondary mb-1">Strategy</p>
                      <p className="text-sm font-medium text-text-primary capitalize">{result.strategy}</p>
                    </div>
                  </div>
                </div>

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  className="w-full gradient-button py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 group"
                >
                  <span>Analyze Document</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default UploadPage;
