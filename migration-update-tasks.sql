-- Migration: Update tasks table to support all frequency options and date ranges
-- Run this SQL in your Supabase SQL editor if your tasks table already exists

-- Step 1: Update the CHECK constraint to allow all frequency options
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_freq_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_freq_check CHECK (freq IN ('daily', 'every_other_day', 'weekly', 'biweekly', 'monthly'));

-- Step 2: Add start_date and end_date columns if they don't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date DATE;

