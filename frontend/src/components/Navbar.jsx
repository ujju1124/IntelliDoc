import { Link, useLocation } from 'react-router-dom';
import { truncateText } from '../utils/helpers';

const Navbar = ({ showDocument = false, documentName = '' }) => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 h-14 backdrop-blur-md border-b border-white/5"
      style={{ backgroundColor: 'rgba(8, 8, 16, 0.85)' }}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">

        {/* Left — Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <svg className="w-5 h-5 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-lg font-bold gradient-text">IntelliDoc</span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* History link — always visible */}
          <Link to="/history"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/history'
                ? 'bg-violet/20 text-violet'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </Link>

          {/* Current document chip */}
          {showDocument && documentName && (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card">
                <svg className="w-3.5 h-3.5 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-text-primary font-medium">
                  {truncateText(documentName, 22)}
                </span>
              </div>
              <Link to="/"
                className="px-3 py-1.5 rounded-lg border border-white/10 text-sm font-medium text-text-primary hover:border-violet/50 hover:bg-violet/5 transition-all">
                New Document
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
