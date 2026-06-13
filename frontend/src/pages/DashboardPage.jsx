import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import InsightCard from '../components/InsightCard';
import MindMap from '../components/MindMap';
import { useToast } from '../components/Toast';
import { useAppContext } from '../context/AppContext';
import useAnalysis from '../hooks/useAnalysis';

const DashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentDocument, analysisData, setAnalysisData } = useAppContext();
  const { loading, error, data, analyzeDoc } = useAnalysis();

  // Redirect if no document
  useEffect(() => {
    if (!currentDocument) {
      navigate('/');
    }
  }, [currentDocument, navigate]);

  // Analyze document on mount if not already analyzed OR if document changed
  useEffect(() => {
    if (currentDocument && (!analysisData || analysisData.document_id !== currentDocument.document_id)) {
      analyzeDoc(currentDocument.document_id).then((result) => {
        if (result) {
          setAnalysisData(result);
        } else if (error) {
          toast.error('Failed to analyze document');
        }
      });
    }
  }, [currentDocument, analysisData]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  // Show loading state
  if (loading || (!analysisData && !error)) {
    return (
      <div className="min-h-screen bg-background dot-grid">
        <Navbar showDocument documentName={currentDocument?.filename} />
        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Spinner size="lg" />
            <p className="text-text-secondary mt-4 text-lg animate-pulse">
              Analyzing your document...
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error && !analysisData) {
    return (
      <div className="min-h-screen bg-background dot-grid">
        <Navbar showDocument documentName={currentDocument?.filename} />
        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Analysis Failed</h2>
              <p className="text-text-secondary mb-4">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 rounded-lg bg-violet hover:bg-violet/90 text-white font-medium transition-colors"
              >
                Upload New Document
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleStartDebate = () => {
    navigate('/debate');
  };

  return (
    <div className="min-h-screen bg-background dot-grid">
      <Navbar showDocument documentName={currentDocument?.filename} />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Section 1: Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="glass-card p-6 border-l-4 border-violet">
            <p className="text-xs font-bold text-violet uppercase tracking-wider mb-3">
              DOCUMENT SUMMARY
            </p>
            <p className="text-text-primary text-base leading-relaxed">
              {analysisData?.summary}
            </p>
          </div>
        </motion.div>

        {/* Section 2: Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Key Insights */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className="text-xs font-bold text-violet uppercase tracking-wider mb-4">
              KEY INSIGHTS
            </h2>
            <div className="space-y-3">
              {analysisData?.insights?.map((insight, index) => (
                <InsightCard
                  key={index}
                  number={index + 1}
                  insight={insight}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </motion.div>

          {/* Right Column: Mind Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-xs font-bold text-violet uppercase tracking-wider mb-4">
              MIND MAP
            </h2>
            <div className="glass-card p-4">
              <MindMap data={analysisData?.mindmap} />
            </div>
          </motion.div>
        </div>

        {/* Section 3: CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Ready to go deeper?
            </h2>
            <p className="text-text-secondary mb-6">
              Ask our AI agents to debate and analyze this document
            </p>
            <button
              onClick={handleStartDebate}
              className="gradient-button px-8 py-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 mx-auto group relative overflow-hidden"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            >
              <span>Start Agent Debate</span>
              <svg 
                className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;
