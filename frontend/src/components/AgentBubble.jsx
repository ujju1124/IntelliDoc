import { motion } from 'framer-motion';
import TypingIndicator from './TypingIndicator';

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

const AgentBubble = ({ agent, content, isTyping = false }) => {
  const config = AGENT_CONFIG[agent];
  
  if (!config) {
    return null;
  }

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
          style={{
            backgroundColor: `${config.color}1A`,
            color: config.color,
          }}
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
      <div className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
        {isTyping ? (
          <TypingIndicator color={config.color} />
        ) : (
          <p>{content}</p>
        )}
      </div>
    </motion.div>
  );
};

export default AgentBubble;
