import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import TypingIndicator from './TypingIndicator';

// Lazy-load react-markdown so it doesn't bloat the initial bundle
const ReactMarkdown = lazy(() => import('react-markdown'));

const AGENT_CONFIG = {
  summarizer: {
    name: 'Summarizer',
    emoji: '🔵',
    color: '#3b82f6',
    role: 'Factual Analysis',
  },
  critic: {
    name: 'Critic',
    emoji: '🔴',
    color: '#ef4444',
    role: 'Critical Review',
  },
  devils_advocate: {
    name: "Devil's Advocate",
    emoji: '🟡',
    color: '#f59e0b',
    role: 'Alternative View',
  },
  moderator: {
    name: 'Moderator',
    emoji: '🟢',
    color: '#10b981',
    role: 'Final Verdict',
  },
};

// Markdown component overrides — styled to match the dark theme
const markdownComponents = {
  // Paragraphs
  p: ({ children }) => (
    <p className="text-text-primary text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  // Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  // Italic
  em: ({ children }) => (
    <em className="italic text-text-secondary">{children}</em>
  ),
  // Ordered list
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-4 space-y-1 my-2 text-sm text-text-primary">{children}</ol>
  ),
  // Unordered list
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-4 space-y-1 my-2 text-sm text-text-primary">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  // Headings
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-text-primary mt-3 mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-text-primary mt-3 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-text-primary mt-2 mb-1">{children}</h3>
  ),
  // Inline code
  code: ({ inline, children }) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded bg-white/10 text-violet text-xs font-mono">
        {children}
      </code>
    ) : (
      <pre className="bg-white/5 rounded-lg p-3 my-2 overflow-x-auto">
        <code className="text-xs font-mono text-text-secondary">{children}</code>
      </pre>
    ),
  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-white/20 pl-3 my-2 text-text-secondary italic text-sm">
      {children}
    </blockquote>
  ),
  // Horizontal rule
  hr: () => <hr className="border-white/10 my-3" />,
};

const AgentBubble = ({ agent, content, isTyping = false }) => {
  const config = AGENT_CONFIG[agent];
  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-4 border-l-4"
      style={{ borderLeftColor: config.color }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{config.emoji}</span>
        <span className="font-bold text-text-primary">{config.name}</span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${config.color}1A`, color: config.color }}
        >
          {config.role}
        </span>
        {agent === 'moderator' && (
          <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30">
            FINAL VERDICT
          </span>
        )}
      </div>

      {/* Content */}
      <div className="prose-sm max-w-none">
        {isTyping ? (
          <TypingIndicator color={config.color} />
        ) : (
          <Suspense fallback={
            <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          }>
            <ReactMarkdown components={markdownComponents}>
              {content || ''}
            </ReactMarkdown>
          </Suspense>
        )}
      </div>
    </motion.div>
  );
};

export default AgentBubble;
