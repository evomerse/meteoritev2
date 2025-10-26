import { supabase } from './supabase-client.js';

export async function getAlerts(userId) {
  const { data, error } = await supabase
    .from('weather_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function createAlert(userId, cityName, latitude, longitude, alertType, conditionOperator, conditionValue) {
  const { data, error } = await supabase
    .from('weather_alerts')
    .insert([
      {
        user_id: userId,
        city_name: cityName,
        alert_type: alertType,
        operator: conditionOperator,
        threshold_value: parseFloat(conditionValue),
        is_active: true
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAlert(alertId, updates) {
  const { data, error } = await supabase
    .from('weather_alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAlert(alertId) {
  const { error} = await supabase
    .from('weather_alerts')
    .delete()
    .eq('id', alertId);

  if (error) {
    throw error;
  }
}

export async function toggleAlert(alertId, isActive) {
  return updateAlert(alertId, { is_active: isActive });
}

export function getAlertTypeLabel(alertType) {
  const labels = {
    rain: 'Pluie',
    wind: 'Vent',
    temperature: 'Température'
  };
  return labels[alertType] || alertType;
}

export function getAlertUnit(alertType) {
  const units = {
    rain: 'mm',
    wind: 'km/h',
    temperature: '°C'
  };
  return units[alertType] || '';
}
