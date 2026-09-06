# Wheel of Life

Your life as a wheel. Balance it, and the ride gets smooth.

A web app for tracking life balance across six core areas: Fitness, Life, Relationships, Financial, Mindset, and Professional. Built with React/Next.js and Tailwind CSS.

## Features

✨ **Animated Wheel** — Visual representation of your life balance with real-time animation based on daily activity

📊 **Scoring System** — Track goals, tasks, habits, and patterns to stop. Points flow into each life area with intelligent scoring and decay mechanics.

🎯 **Goal Tracking** — Set aspirations in each area and track progress toward them

⚡ **Streaks & Habits** — Form habits by marking them complete. Track your momentum with streak bonuses.

🛑 **Leave Behind** — Identify patterns you want to stop and track your progress replacing them

🔒 **Privacy First** — All data stored locally in your browser. No tracking, no selling your data.

⚙️ **Customizable** — Adjust weights for each life area to match your priorities

## Tech Stack

- **Framework:** Next.js 14 with React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom dark theme
- **State:** React Context + useReducer
- **Storage:** Browser localStorage (Phase 1) → Supabase PostgreSQL (Phase 2)
- **Deployment:** Vercel
- **Canvas:** HTML5 Canvas 2D API for wheel animation

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout with StoreProvider
│   └── globals.css        # Global styles
├── components/
│   ├── WheelCanvas.tsx    # Animated wheel visualization
│   ├── Rails.tsx          # Left/right panels for goals, tasks, habits
│   ├── Settings.tsx       # Settings modal
│   └── Onboarding.tsx     # Privacy & setup flow
├── lib/
│   ├── types.ts           # TypeScript interfaces
│   ├── scoring.ts         # Scoring engine (decay, streaks, balance)
│   ├── catalog.ts         # Default sections & leave-behind patterns
│   └── store.tsx          # Global state management
└── tailwind.config.ts     # Custom theme colors
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions including:
- GitHub repository setup
- Supabase database configuration
- Vercel deployment
- Domain connection

## Data Structure

### Sections (Life Areas)
- Fitness, Life, Relationships, Financial, Mindset, Professional
- Each has a color, aspiration, current score, and weight

### Goals
- Long-term objectives in each life area
- Can be marked as achieved
- Award bonus points when completed

### Tasks
- Actionable items toward goals
- Quick wins that add points to a section
- Marked complete individually

### Habits
- New behaviors to form
- Track with streaks
- Multiplier bonus when streak is active

### Leave Behind
- Patterns or behaviors you want to stop
- Pre-loaded with 16 common examples
- Track progress replacing them

### Ledger
- Audit trail of all points awarded
- Timestamps for decay calculations
- Used to compute daily gains and lifetime levels

## Scoring Mechanics

**Points awarded for:**
- Completing a goal: 50 base points
- Completing a task: 10 base points  
- Completing a habit: 15 base points (+ streak multiplier)
- Replacing a pattern to leave behind: 25 points

**Balance bonus:** When wheel equilibrium is low, all points are multiplied by 1.5–2.0x to incentivize neglected areas.

**Decay:** Each section decays 0.5 points/day when not actively worked on.

**Equilibrium:** Calculated 0–100 showing how balanced your wheel is. Traffic-light zones: Red (imbalanced), Yellow (fair), Green (balanced).

## Privacy

- ✅ Data stays in your browser (localStorage)
- ✅ No tracking, no analytics, no third-party code
- ✅ One-click erasure of all data
- ✅ When you sync to Supabase: encrypted in transit, access limited by RLS policies

## Future Phases

### Phase 2: Cloud Sync
- User authentication via Supabase
- Cloud database for data sync across devices
- Export data as JSON/CSV

### Phase 3: Insights
- Weekly balance trends
- AI-powered recommendations
- Share anonymized progress

## Contributing

This is a personal project. For issues or suggestions, open an issue on GitHub.

## License

MIT — See [LICENSE](./LICENSE) file

---

Built with ❤️ to help you build a balanced life.
