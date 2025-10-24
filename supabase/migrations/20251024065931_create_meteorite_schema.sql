/*
  # Météorite Database Schema

  ## Overview
  Creates the complete database schema for the Météorite weather application with authentication, favorites, and alerts management.

  ## New Tables
  
  ### 1. `profiles`
  Extended user profile information linked to Supabase Auth users
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `first_name` (text) - User first name
  - `created_at` (timestamptz) - Account creation timestamp
  - `theme_preference` (text) - Light or dark theme choice (default: 'light')
  
  ### 2. `favorites`
  Stores user's favorite cities for quick weather access
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `city_name` (text) - Name of the city
  - `latitude` (numeric) - City latitude
  - `longitude` (numeric) - City longitude
  - `created_at` (timestamptz) - When favorite was added
  
  ### 3. `alerts`
  Weather alert configurations for automated notifications
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `city_name` (text) - City to monitor
  - `latitude` (numeric) - City latitude
  - `longitude` (numeric) - City longitude
  - `alert_type` (text) - Type of alert: 'rain', 'wind', 'temperature'
  - `condition_operator` (text) - Comparison operator: '>', '<', '>=', '<='
  - `condition_value` (numeric) - Threshold value for alert
  - `is_active` (boolean) - Whether alert is enabled (default: true)
  - `created_at` (timestamptz) - When alert was created
  - `last_triggered_at` (timestamptz) - Last time alert was sent

  ## Security
  
  Row Level Security (RLS) is enabled on all tables with the following policies:
  
  ### profiles table
  - Users can view their own profile
  - Users can insert their own profile
  - Users can update their own profile
  
  ### favorites table
  - Users can view their own favorites
  - Users can insert their own favorites
  - Users can update their own favorites
  - Users can delete their own favorites
  
  ### alerts table
  - Users can view their own alerts
  - Users can insert their own alerts
  - Users can update their own alerts
  - Users can delete their own alerts
  
  ## Notes
  1. All tables use UUID primary keys with automatic generation
  2. Timestamps use timestamptz for timezone awareness
  3. Foreign key constraints ensure data integrity
  4. Indexes added on user_id columns for query performance
  5. Default values provided for booleans and timestamps
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  theme_preference text DEFAULT 'light',
  created_at timestamptz DEFAULT now()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('rain', 'wind', 'temperature')),
  condition_operator text NOT NULL CHECK (condition_operator IN ('>', '<', '>=', '<=')),
  condition_value numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_triggered_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Favorites policies
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites"
  ON favorites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Alerts policies
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active) WHERE is_active = true;