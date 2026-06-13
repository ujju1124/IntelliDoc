import AgentBubble from './AgentBubble';
import { timeAgo } from '../utils/helpers';

const DebatePanel = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {messages.map((turn, turnIndex) => (
        <div key={turnIndex} className="space-y-3">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[80%]">
              <div className="gradient-button rounded-lg px-4 py-3 shadow-lg">
                <p className="text-white text-sm font-medium">{turn.userMessage}</p>
              </div>
              {turn.timestamp && (
                <p className="text-xs text-text-secondary mt-1 text-right">
                  {timeAgo(turn.timestamp)}
                </p>
              )}
            </div>
          </div>

          {/* Agent responses */}
          {turn.debate && (
            <div className="space-y-3">
              <AgentBubble
                agent="summarizer"
                content={turn.debate.summarizer}
                isTyping={turn.isTyping?.summarizer}
              />
              <AgentBubble
                agent="critic"
                content={turn.debate.critic}
                isTyping={turn.isTyping?.critic}
              />
              <AgentBubble
                agent="devils_advocate"
                content={turn.debate.devils_advocate}
                isTyping={turn.isTyping?.devils_advocate}
              />
              <AgentBubble
                agent="moderator"
                content={turn.debate.moderator}
                isTyping={turn.isTyping?.moderator}
              />
            </div>
          )}

          {/* Divider between turns */}
          {turnIndex < messages.length - 1 && (
            <div className="border-t border-white/5 my-6" />
          )}
        </div>
      ))}
    </div>
  );
};

export default DebatePanel;
