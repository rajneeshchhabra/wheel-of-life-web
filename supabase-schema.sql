-- Wheel of Life - Supabase Schema

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sections (Life areas)
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  aspiration TEXT,
  aspiration2 TEXT,
  weight FLOAT DEFAULT 1,
  decay_per_day FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, id)
);

-- Goals
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  achieved_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id, section_id) REFERENCES sections(user_id, id)
);

-- Tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  done_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id, section_id) REFERENCES sections(user_id, id)
);

-- Habits (forming habits)
CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_formed BOOLEAN DEFAULT FALSE,
  streak INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  formed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id, section_id) REFERENCES sections(user_id, id)
);

-- Leave Behind (patterns to stop)
CREATE TABLE leave_behind (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_replaced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replaced_at TIMESTAMP WITH TIME ZONE
);

-- Points ledger (audit trail for scoring)
CREATE TABLE points_ledger (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  points FLOAT NOT NULL,
  source TEXT NOT NULL, -- 'goal' | 'task' | 'habit' | 'leave-behind'
  source_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id, section_id) REFERENCES sections(user_id, id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_behind ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can read own sections"
  ON sections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sections"
  ON sections FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals"
  ON goals FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own habits"
  ON habits FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own leave behind"
  ON leave_behind FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own leave behind"
  ON leave_behind FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own ledger"
  ON points_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ledger entries"
  ON points_ledger FOR INSERT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_sections_user_id ON sections(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_section_id ON goals(section_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_section_id ON tasks(section_id);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_section_id ON habits(section_id);
CREATE INDEX idx_leave_behind_user_id ON leave_behind(user_id);
CREATE INDEX idx_ledger_user_id ON points_ledger(user_id);
CREATE INDEX idx_ledger_timestamp ON points_ledger(timestamp);
