import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { timeAgo, truncateText } from '../utils/helpers';

/**
 * ChatGPT-style sessions sidebar.
 * Shows ALL sessions across all documents.
 * Sessions belonging to the current document are active (can chat).
 * Sessions from other documents are read-only (view-only).
 */
const SessionsSidebar = ({ onNewSession }) => {
  const { allSessions, activeSessionId, currentDocument, switchSession, deleteSession } = useAppContext();
  const [hoveredId, setHoveredId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'current'

  const currentFilename = currentDocument?.filename;

  // Filter sessions — match by filename, not document_id
  const visibleSessions = filter === 'current'
    ? allSessions.filter(s => s.documentName === currentFilename)
    : allSessions;

  const grouped = groupSessions(visibleSessions);

  const handleSwitch = (id) => {
    if (id === activeSessionId) return;
    switchSession(id);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirmDelete === id) {
      deleteSession(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* New Session Button */}
      <button
        onClick={onNewSession}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-violet/40 text-sm font-medium text-violet hover:bg-violet/10 hover:border-violet/70 transition-all mb-3 group"
      >
        <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Session
      </button>

      {/* Filter tabs */}
      <div className="flex rounded-lg overflow-hidden border border-white/10 mb-3 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 font-medium transition-colors ${
            filter === 'all' ? 'bg-violet/20 text-violet' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('current')}
          className={`flex-1 py-1.5 font-medium transition-colors border-l border-white/10 ${
            filter === 'current' ? 'bg-violet/20 text-violet' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          This Doc
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-0.5" style={{ scrollbarWidth: 'thin' }}>
        {visibleSessions.length === 0 ? (
          <div className="text-center py-6">
            <svg className="w-8 h-8 text-text-secondary/30 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs text-text-secondary">
              {filter === 'current' ? 'No sessions for this document yet' : 'No sessions yet'}
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">Start a debate to create one</p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, sessions]) =>
            sessions.length > 0 ? (
              <div key={group}>
                <p className="text-xs font-semibold text-text-secondary/50 uppercase tracking-wider mb-1.5 px-1">
                  {group}
                </p>
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === activeSessionId}
                      isCurrentDoc={session.documentName === currentFilename}
                      isHovered={hoveredId === session.id}
                      confirmingDelete={confirmDelete === session.id}
                      onMouseEnter={() => setHoveredId(session.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleSwitch(session.id)}
                      onDelete={(e) => handleDelete(e, session.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
};

// ─── Single session row ───────────────────────────────────────────────────────

const SessionItem = ({
  session,
  isActive,
  isCurrentDoc,
  isHovered,
  confirmingDelete,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDelete,
}) => {
  const messageCount = session.messages?.length ?? 0;
  const isReadOnly = !isCurrentDoc;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        relative flex items-start gap-2 w-full px-3 py-2.5 rounded-lg cursor-pointer
        transition-all duration-150 text-left
        ${isActive
          ? 'bg-violet/15 border border-violet/30'
          : isReadOnly
            ? 'hover:bg-white/3 border border-transparent opacity-70 hover:opacity-90'
            : 'hover:bg-white/5 border border-transparent'
        }
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 
        ${isActive ? 'bg-violet/30' : isReadOnly ? 'bg-white/3' : 'bg-white/5'}`}>
        {isReadOnly ? (
          <svg className="w-3 h-3 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          <svg className={`w-3 h-3 ${isActive ? 'text-violet' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
            {session.title}
          </p>
          {/* Read-only badge */}
          {isReadOnly && (
            <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-text-secondary/50 font-medium tracking-wide">
              VIEW
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <svg className="w-2.5 h-2.5 text-text-secondary/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className={`text-xs truncate ${isReadOnly ? 'text-text-secondary/40' : 'text-text-secondary/50'}`}>
            {truncateText(session.documentName, 16)}
          </p>
          <span className="text-text-secondary/25">·</span>
          <p className="text-xs text-text-secondary/35 flex-shrink-0">{messageCount}Q</p>
        </div>

        <p className="text-xs text-text-secondary/35 mt-0.5">{timeAgo(session.updatedAt)}</p>
      </div>

      {/* Delete button */}
      <AnimatePresence>
        {(isHovered || isActive) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            onClick={onDelete}
            className={`
              flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors mt-0.5
              ${confirmingDelete
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'text-text-secondary/40 hover:text-red-400 hover:bg-red-500/10'
              }
            `}
            title={confirmingDelete ? 'Click again to confirm' : 'Delete session'}
          >
            {confirmingDelete ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Group sessions by recency ────────────────────────────────────────────────

function groupSessions(sessions) {
  const now = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek  = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

  const groups = { Today: [], Yesterday: [], 'Last 7 days': [], Older: [] };

  for (const session of sessions) {
    const d = new Date(session.updatedAt);
    if      (d >= today)     groups.Today.push(session);
    else if (d >= yesterday) groups.Yesterday.push(session);
    else if (d >= lastWeek)  groups['Last 7 days'].push(session);
    else                     groups.Older.push(session);
  }

  return groups;
}

export default SessionsSidebar;
