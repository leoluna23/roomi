-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  join_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_name)
);

-- Create tasks (chores) table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  freq TEXT NOT NULL CHECK (freq IN ('daily', 'every_other_day', 'weekly', 'biweekly', 'monthly')),
  preferred_day INTEGER CHECK (preferred_day >= 0 AND preferred_day <= 6),
  preferred_time TEXT,
  duration_min INTEGER,
  notes TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  when_ts TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_groups_join_token ON groups(join_token);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_assignments_task_id ON assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_member_id ON assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_assignments_when_ts ON assignments(when_ts);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('groceries', 'utilities', 'rent', 'other')),
  paid_by UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  bill_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_splits table (tracks how much each member owes for a bill)
CREATE TABLE IF NOT EXISTS bill_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bill_id, member_id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE, -- Links to Supabase auth.users.id
  name TEXT,
  major TEXT,
  bio TEXT,
  sleep_sched TEXT CHECK (sleep_sched IN ('early', 'normal', 'late')),
  cleanliness TEXT CHECK (cleanliness IN ('low', 'medium', 'high')),
  noise TEXT CHECK (noise IN ('quiet', 'moderate', 'loud')),
  guests TEXT CHECK (guests IN ('rare', 'sometimes', 'often')),
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  interests TEXT[], -- Array of interests
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bills_group_id ON bills(group_id);
CREATE INDEX IF NOT EXISTS idx_bills_paid_by ON bills(paid_by);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bill_splits_bill_id ON bill_splits(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_member_id ON bill_splits(member_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

