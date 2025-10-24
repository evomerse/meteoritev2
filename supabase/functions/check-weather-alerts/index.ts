import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Alert {
  id: string;
  user_id: string;
  city_name: string;
  latitude: number;
  longitude: number;
  alert_type: string;
  condition_operator: string;
  condition_value: number;
  is_active: boolean;
  last_triggered_at: string | null;
}

interface Profile {
  id: string;
  email: string;
  first_name: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsError) {
      throw new Error(`Error fetching alerts: ${alertsError.message}`);
    }

    const triggeredAlerts: string[] = [];

    for (const alert of alerts as Alert[]) {
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${alert.latitude}&longitude=${alert.longitude}&current_weather=true&hourly=temperature_2m,precipitation,wind_speed_10m`
        );

        if (!weatherResponse.ok) {
          console.error(`Failed to fetch weather for ${alert.city_name}`);
          continue;
        }

        const weatherData = await weatherResponse.json();
        const currentHour = new Date().getHours();

        let currentValue: number;

        switch (alert.alert_type) {
          case "temperature":
            currentValue = weatherData.current_weather.temperature;
            break;
          case "wind":
            currentValue = weatherData.current_weather.windspeed;
            break;
          case "rain":
            currentValue = weatherData.hourly.precipitation[currentHour] || 0;
            break;
          default:
            continue;
        }

        const conditionMet = evaluateCondition(
          currentValue,
          alert.condition_operator,
          alert.condition_value
        );

        if (conditionMet) {
          const lastTriggered = alert.last_triggered_at
            ? new Date(alert.last_triggered_at)
            : null;
          const now = new Date();
          const hoursSinceLastTrigger = lastTriggered
            ? (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60)
            : 24;

          if (hoursSinceLastTrigger >= 24) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, first_name")
              .eq("id", alert.user_id)
              .single();

            if (profile) {
              await sendAlertEmail(profile as Profile, alert, currentValue);

              await supabase
                .from("alerts")
                .update({ last_triggered_at: now.toISOString() })
                .eq("id", alert.id);

              triggeredAlerts.push(
                `${alert.city_name}: ${alert.alert_type} ${alert.condition_operator} ${alert.condition_value}`
              );
            }
          }
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: alerts.length,
        triggered: triggeredAlerts.length,
        alerts: triggeredAlerts,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in check-weather-alerts:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function evaluateCondition(
  currentValue: number,
  operator: string,
  threshold: number
): boolean {
  switch (operator) {
    case ">":
      return currentValue > threshold;
    case "<":
      return currentValue < threshold;
    case ">=":
      return currentValue >= threshold;
    case "<=":
      return currentValue <= threshold;
    default:
      return false;
  }
}

async function sendAlertEmail(
  profile: Profile,
  alert: Alert,
  currentValue: number
): Promise<void> {
  console.log(
    `Sending email to ${profile.email} for alert: ${alert.city_name} - ${alert.alert_type} ${alert.condition_operator} ${alert.condition_value} (current: ${currentValue})`
  );

  const unitMap: { [key: string]: string } = {
    temperature: "°C",
    wind: "km/h",
    rain: "mm",
  };

  const typeMap: { [key: string]: string } = {
    temperature: "Température",
    wind: "Vent",
    rain: "Pluie",
  };

  console.log(
    `Alerte météo déclenchée pour ${profile.first_name || profile.email}: ${alert.city_name} - ${typeMap[alert.alert_type]}: ${currentValue} ${unitMap[alert.alert_type]}`
  );
}
