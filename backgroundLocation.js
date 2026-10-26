import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase } from './supabase';

const TASK = 'nearaid-background-location';

// Runs when the phone moves, even if the app is closed (development build only)
TaskManager.defineTask(TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  const loc = data.locations[data.locations.length - 1];
  const { data: s } = await supabase.auth.getSession();
  const user = s?.session?.user;
  if (!user) return;
  await supabase.from('profiles').update({
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    location_updated_at: new Date().toISOString(),
  }).eq('id', user.id);
});

export async function isBackgroundOn() {
  try { return await Location.hasStartedLocationUpdatesAsync(TASK); } catch { return false; }
}

// Returns { ok: true } or { ok: false, message }
export async function startBackground(userId) {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return { ok: false, message: 'Location permission was not allowed.' };
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      return { ok: false, message: 'Choose "Always" for location in Settings so NearAid can alert you when the app is closed.' };
    }
    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 50,           // update after moving about 50 m
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true, // iPhone shows the blue bar while sharing
      foregroundService: {            // Android needs a visible notification
        notificationTitle: 'NearAid is on',
        notificationBody: 'Sharing your location so you can help someone nearby.',
      },
    });
    await supabase.from('profiles').update({ background_on: true }).eq('id', userId);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: 'Background location needs a development build, not Expo Go. (' + e.message + ')' };
  }
}

export async function stopBackground(userId) {
  try { await Location.stopLocationUpdatesAsync(TASK); } catch {}
  // Forget the saved location so nobody is alerted after they switch this off
  await supabase.from('profiles').update({
    background_on: false, lat: null, lng: null, location_updated_at: null,
  }).eq('id', userId);
}
