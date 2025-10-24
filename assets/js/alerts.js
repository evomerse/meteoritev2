import { supabase } from './supabase-client.js';

export async function getAlerts(userId) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }

  return data;
}

export async function createAlert(userId, cityName, latitude, longitude, alertType, conditionOperator, conditionValue) {
  const { data, error } = await supabase
    .from('alerts')
    .insert([
      {
        user_id: userId,
        city_name: cityName,
        latitude,
        longitude,
        alert_type: alertType,
        condition_operator: conditionOperator,
        condition_value: parseFloat(conditionValue),
        is_active: true
      }
    ])
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating alert:', error);
    throw error;
  }

  return data;
}

export async function updateAlert(alertId, updates) {
  const { data, error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating alert:', error);
    throw error;
  }

  return data;
}

export async function deleteAlert(alertId) {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId);

  if (error) {
    console.error('Error deleting alert:', error);
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
