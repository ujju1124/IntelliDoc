import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import { ToastProvider } from './components/Toast';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import DebatePage from './pages/DebatePage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContextProvider>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/debate" element={<DebatePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppContextProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
