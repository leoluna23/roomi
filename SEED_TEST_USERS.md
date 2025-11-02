# Seeding Test Users for Matching Feature

The matching feature now reads candidate profiles from the Supabase database instead of the static JSON file.

## To seed test users into your database:

### Option 1: Using the API endpoint (Recommended)

Run this command in your terminal:

```bash
curl -X POST http://localhost:3000/api/seed-users
```

Or if your app is deployed, replace `localhost:3000` with your domain.

### Option 2: Using the Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run this SQL (the test users use placeholder UUIDs that don't conflict with real auth users):

```sql
INSERT INTO user_profiles (
  user_id, name, major, bio, sleep_sched, cleanliness, noise, guests, 
  budget_min, budget_max, interests
) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alex', 'Biology', 'Early riser, likes quiet mornings. Very organized and clean.', 'early', 'high', 'quiet', 'rare', 500, 750, ARRAY['gym', 'hiking', 'cooking']),
  ('00000000-0000-0000-0000-000000000002', 'Sam', 'Computer Science', 'Night owl, into gaming and coffee. Pretty relaxed about cleaning.', 'late', 'medium', 'moderate', 'sometimes', 600, 900, ARRAY['gaming', 'anime', 'boba']),
  ('00000000-0000-0000-0000-000000000003', 'Jordan', 'Psychology', 'Calm, loves plants and tidy spaces. Meditates daily.', 'normal', 'high', 'quiet', 'rare', 550, 800, ARRAY['reading', 'plants', 'yoga']),
  ('00000000-0000-0000-0000-000000000004', 'Morgan', 'Engineering', 'Study-focused, needs quiet time. Organized but not obsessive.', 'normal', 'medium', 'quiet', 'rare', 600, 850, ARRAY['coding', 'reading', 'coffee']),
  ('00000000-0000-0000-0000-000000000005', 'Casey', 'Business', 'Social butterfly, loves hosting friends. Keeps things moderately clean.', 'normal', 'medium', 'moderate', 'often', 700, 1000, ARRAY['networking', 'events', 'travel']),
  ('00000000-0000-0000-0000-000000000006', 'Riley', 'Art', 'Creative and laid-back. Works on projects at all hours.', 'late', 'low', 'moderate', 'sometimes', 500, 700, ARRAY['art', 'music', 'photography']),
  ('00000000-0000-0000-0000-000000000007', 'Taylor', 'Environmental Science', 'Eco-conscious, early to bed early to rise. Very tidy and organized.', 'early', 'high', 'quiet', 'sometimes', 550, 750, ARRAY['sustainability', 'gardening', 'cycling']),
  ('00000000-0000-0000-0000-000000000008', 'Quinn', 'Music', 'Practices instruments daily. Can be loud but respectful of quiet hours.', 'normal', 'medium', 'loud', 'sometimes', 600, 800, ARRAY['music', 'concerts', 'instruments']),
  ('00000000-0000-0000-0000-000000000009', 'Bailey', 'Mathematics', 'Quiet student, prefers minimal distractions. Very clean and organized.', 'early', 'high', 'quiet', 'rare', 650, 850, ARRAY['math', 'puzzles', 'board games']),
  ('00000000-0000-0000-0000-000000000010', 'Skyler', 'Communications', 'Outgoing and friendly. Likes to keep common areas clean.', 'normal', 'medium', 'moderate', 'often', 600, 900, ARRAY['social media', 'photography', 'travel'])
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  major = EXCLUDED.major,
  bio = EXCLUDED.bio,
  sleep_sched = EXCLUDED.sleep_sched,
  cleanliness = EXCLUDED.cleanliness,
  noise = EXCLUDED.noise,
  guests = EXCLUDED.guests,
  budget_min = EXCLUDED.budget_min,
  budget_max = EXCLUDED.budget_max,
  interests = EXCLUDED.interests,
  updated_at = NOW();
```

### Check if users were seeded:

```bash
curl http://localhost:3000/api/seed-users
```

This will return a list of all profiles in the database.

## How it works:

1. When you click "Find Matches" on the matching page, it now sends your `user_id` to the API
2. The API queries the `user_profiles` table for all profiles except yours
3. It matches you against all other users in the database
4. Returns the top 3 matches with AI-generated summaries

## Note:

- The test users use placeholder UUIDs (`00000000-...`) that won't conflict with real Supabase auth users
- Real users who fill out their profile will automatically be included as candidates for matching
- You can always add more test users by creating profiles with unique `user_id` values

