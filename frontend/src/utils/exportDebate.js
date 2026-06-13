/**
 * Export a debate session as a Markdown file download.
 */
export const exportDebateAsMarkdown = (messages, sessionTitle, documentName) => {
  if (!messages || messages.length === 0) return;

  const date = new Date().toLocaleString();
  const lines = [];

  lines.push(`# Debate Export: ${sessionTitle || 'Session'}`);
  lines.push(`**Document:** ${documentName || 'Unknown'}`);
  lines.push(`**Exported:** ${date}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  messages.forEach((turn, i) => {
    lines.push(`## Question ${i + 1}`);
    lines.push('');
    lines.push(`**You:** ${turn.userMessage}`);
    lines.push('');

    if (turn.debate) {
      const { summarizer, critic, devils_advocate, moderator } = turn.debate;

      if (summarizer) {
        lines.push('### 🔵 Summarizer — Factual Analysis');
        lines.push('');
        lines.push(summarizer);
        lines.push('');
      }
      if (critic) {
        lines.push('### 🔴 Critic — Critical Review');
        lines.push('');
        lines.push(critic);
        lines.push('');
      }
      if (devils_advocate) {
        lines.push("### 🟡 Devil's Advocate — Alternative View");
        lines.push('');
        lines.push(devils_advocate);
        lines.push('');
      }
      if (moderator) {
        lines.push('### 🟢 Moderator — Final Verdict');
        lines.push('');
        lines.push(moderator);
        lines.push('');
      }
    }

    if (i < messages.length - 1) {
      lines.push('---');
      lines.push('');
    }
  });

  lines.push('');
  lines.push('---');
  lines.push('*Exported from IntelliDoc — Multi-Agent Document Intelligence*');

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `debate-${(sessionTitle || 'session').slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
