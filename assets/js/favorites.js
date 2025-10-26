import { supabase } from './supabase-client.js';

export async function getFavorites(userId) {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function addFavorite(userId, cityName, latitude, longitude) {
  const { data, error } = await supabase
    .from('user_favorites')
    .insert([
      {
        user_id: userId,
        city_name: cityName,
        latitude,
        longitude
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function removeFavorite(favoriteId) {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('id', favoriteId);

  if (error) {
    throw error;
  }
}

export async function isFavorite(userId, cityName) {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('city_name', cityName)
    .maybeSingle();

  if (error) {
    return false;
  }

  return !!data;
}
