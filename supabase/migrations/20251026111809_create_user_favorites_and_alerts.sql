/*
  # Création des tables favoris et alertes météo

  ## Tables créées
  
  ### `user_favorites` 
  - Table pour stocker les villes favorites des utilisateurs
  - Colonnes: id, user_id, city_name, latitude, longitude, created_at
  - Index sur user_id pour optimisation
  
  ### `weather_alerts`
  - Table pour stocker les alertes météo personnalisées
  - Colonnes: id, user_id, city_name, alert_type, operator, threshold_value, is_active, created_at
  - Contraintes sur alert_type et operator
  
  ## Sécurité RLS
  - RLS activé sur toutes les tables
  - Politiques restrictives: chaque utilisateur accède uniquement à ses données
  - Pas de politique USING(true) - sécurité maximale
*/

-- Table user_favorites
CREATE TABLE user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour user_favorites
CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour optimisation
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_user_city ON user_favorites(user_id, city_name);

-- Table weather_alerts
CREATE TABLE weather_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('rain', 'wind', 'temperature')),
  operator text NOT NULL CHECK (operator IN ('>', '<', '>=', '<=', '=')),
  threshold_value numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour weather_alerts
CREATE POLICY "Users can view their own alerts"
  ON weather_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own alerts"
  ON weather_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON weather_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON weather_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour optimisation
CREATE INDEX idx_weather_alerts_user_id ON weather_alerts(user_id);
CREATE INDEX idx_weather_alerts_active ON weather_alerts(user_id, is_active);
