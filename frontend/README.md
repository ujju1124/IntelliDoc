# IntelliDoc Frontend

React frontend for the IntelliDoc Multi-Agent Document Intelligence Platform.

## Tech Stack

- **React** (Vite) — Fast, modern UI framework
- **Tailwind CSS** — Utility-first styling, no component libraries
- **Framer Motion** — Smooth animations and transitions
- **Axios** — API integration
- **React Router v6** — Client-side routing

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Frontend runs at `http://localhost:5173`

3. **Ensure the backend is running** at `http://localhost:8000`

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Navbar.jsx       # Top navigation bar
│   ├── FileUpload.jsx   # Drag-and-drop file upload zone
│   ├── Spinner.jsx      # Loading spinner (sm/md/lg)
│   ├── Toast.jsx        # Global toast notification system
│   ├── MindMap.jsx      # Interactive SVG mind map
│   ├── InsightCard.jsx  # Single insight display card
│   ├── AgentBubble.jsx  # Agent response bubble with colors
│   ├── DebatePanel.jsx  # Full debate thread renderer
│   └── TypingIndicator.jsx  # Animated typing dots
├── pages/             # Page components
│   ├── UploadPage.jsx   # / — File upload entry point
│   ├── DashboardPage.jsx # /dashboard — Intelligence dashboard
│   ├── DebatePage.jsx   # /debate — Multi-agent debate
│   └── NotFound.jsx     # * — 404 page
├── hooks/             # Custom React hooks
│   ├── useUpload.js     # File upload logic and state
│   ├── useAnalysis.js   # Document analysis logic
│   └── useDebate.js     # Debate messaging with typing indicators
├── context/
│   └── AppContext.jsx   # Global state (document, session, messages)
├── services/
│   └── api.js           # Axios API calls to backend
└── utils/
    └── helpers.js       # Utility functions
```

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#080810` | Page backgrounds |
| Surface | `#0f0f1a` | Cards, panels |
| Violet | `#7c3aed` | Primary accent |
| Blue | `#3b82f6` | Summarizer agent |
| Error/Red | `#ef4444` | Critic agent, errors |
| Amber | `#f59e0b` | Devil's Advocate |
| Green | `#10b981` | Moderator, success |

### Agent Colors
- 🔵 **Summarizer** → `#3b82f6` blue
- 🔴 **Critic** → `#ef4444` red
- 🟡 **Devil's Advocate** → `#f59e0b` amber
- 🟢 **Moderator** → `#10b981` green

### Shared CSS Classes
- `.glass-card` — Glassmorphism card style
- `.gradient-text` — Violet-to-blue gradient text
- `.gradient-button` — Violet gradient button with hover
- `.dot-grid` — Subtle dot grid background pattern

## Pages

### Upload Page (`/`)
- Drag-and-drop or browse file upload
- Supports PDF and TXT files (max 10MB)
- Fixed Size vs Sentence Based chunking strategy toggle
- Success state with document ID copy button

### Dashboard Page (`/dashboard`)
- Auto-analyzes document on mount
- Summary with violet accent border
- 5 key insights with staggered animations
- Interactive SVG mind map (click branches to expand/collapse)
- CTA to start multi-agent debate

### Debate Page (`/debate`)
- Left sidebar with document info and agent legend
- Empty state with suggested questions as pills
- Typing indicators with staggered agent appearance
- Full debate thread with all four agents
- Auto-scroll, Enter to send, Shift+Enter for newline

## Build

```bash
npm run build   # Production build
npm run preview # Preview production build
```
