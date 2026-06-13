import { createContext, useContext, useState, useEffect } from 'react';
import { generateSessionId } from '../utils/helpers';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

export const AppContextProvider = ({ children }) => {
  // Document state
  const [currentDocument, setCurrentDocument] = useState(null);
  
  // Analysis data state
  const [analysisData, setAnalysisData] = useState(null);
  
  // Session state
  const [currentSession, setCurrentSession] = useState(() => generateSessionId());
  
  // Debate messages state
  const [debateMessages, setDebateMessages] = useState([]);
  
  // Clear session - generates new session ID and clears messages
  const clearSession = () => {
    setCurrentSession(generateSessionId());
    setDebateMessages([]);
  };
  
  // Load state from sessionStorage on mount
  useEffect(() => {
    try {
      const savedDocument = sessionStorage.getItem('currentDocument');
      const savedAnalysis = sessionStorage.getItem('analysisData');
      const savedSession = sessionStorage.getItem('currentSession');
      const savedMessages = sessionStorage.getItem('debateMessages');
      
      if (savedDocument) setCurrentDocument(JSON.parse(savedDocument));
      if (savedAnalysis) setAnalysisData(JSON.parse(savedAnalysis));
      if (savedSession) setCurrentSession(savedSession);
      if (savedMessages) setDebateMessages(JSON.parse(savedMessages));
    } catch (error) {
      console.error('Error loading state from sessionStorage:', error);
    }
  }, []);
  
  // Save state to sessionStorage when it changes
  useEffect(() => {
    try {
      if (currentDocument) {
        sessionStorage.setItem('currentDocument', JSON.stringify(currentDocument));
      } else {
        sessionStorage.removeItem('currentDocument');
      }
    } catch (error) {
      console.error('Error saving document to sessionStorage:', error);
    }
  }, [currentDocument]);
  
  useEffect(() => {
    try {
      if (analysisData) {
        sessionStorage.setItem('analysisData', JSON.stringify(analysisData));
      } else {
        sessionStorage.removeItem('analysisData');
      }
    } catch (error) {
      console.error('Error saving analysis to sessionStorage:', error);
    }
  }, [analysisData]);
  
  useEffect(() => {
    try {
      sessionStorage.setItem('currentSession', currentSession);
    } catch (error) {
      console.error('Error saving session to sessionStorage:', error);
    }
  }, [currentSession]);
  
  useEffect(() => {
    try {
      if (debateMessages.length > 0) {
        sessionStorage.setItem('debateMessages', JSON.stringify(debateMessages));
      } else {
        sessionStorage.removeItem('debateMessages');
      }
    } catch (error) {
      console.error('Error saving messages to sessionStorage:', error);
    }
  }, [debateMessages]);
  
  const value = {
    currentDocument,
    setCurrentDocument,
    analysisData,
    setAnalysisData,
    currentSession,
    debateMessages,
    setDebateMessages,
    clearSession,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
