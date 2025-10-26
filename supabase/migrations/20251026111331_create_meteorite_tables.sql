/*
  # Création des tables Météorite

  ## Nouvelles Tables
  
  ### `profiles`
  - `id` (uuid, clé primaire, référence auth.users)
  - `email` (text)
  - `first_name` (text, optionnel)
  - `theme_preference` (text, défaut 'dark')
  - `created_at` (timestamptz, auto)
  - `updated_at` (timestamptz, auto)

  ### `favorites`
  - `id` (uuid, clé primaire, auto-généré)
  - `user_id` (uuid, référence auth.users)
  - `city_name` (text, nom de la ville)
  - `latitude` (numeric, coordonnées)
  - `longitude` (numeric, coordonnées)
  - `created_at` (timestamptz, auto)

  ### `alerts`
  - `id` (uuid, clé primaire, auto-généré)
  - `user_id` (uuid, référence auth.users)
  - `city_name` (text, nom de la ville)
  - `alert_type` (text, type: rain/wind/temperature)
  - `operator` (text, opérateur: >/</>=/<=/=)
  - `threshold_value` (numeric, valeur seuil)
  - `is_active` (boolean, défaut true)
  - `created_at` (timestamptz, auto)

  ## Sécurité
  - RLS activé sur toutes les tables
  - Les utilisateurs peuvent uniquement voir/modifier leurs propres données
  - Les profils sont créés automatiquement via trigger lors de l'inscription
*/

-- Table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  theme_preference text DEFAULT 'dark',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Table favorites
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_city ON favorites(user_id, city_name);

-- Table alerts
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('rain', 'wind', 'temperature')),
  operator text NOT NULL CHECK (operator IN ('>', '<', '>=', '<=', '=')),
  threshold_value numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

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

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(user_id, is_active);

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
