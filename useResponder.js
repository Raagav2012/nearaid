import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { supabase } from './supabase';
import { registerForPush, onNotificationTap, hadNotificationTap } from './notifications';

// Runs for the whole app, on every tab. Does nothing unless this person
// signed up as a CPR-certified person or medical professional.
export function useResponder(userId) {
  const [eligible, setEligible] = useState(null); // null = still checking
  const [me, setMe] = useState(null);
  const [alertRow, setAlertRow] = useState(null);
  const dismissed = useRef(new Set()); // alerts this person already closed
  const [going, setGoing] = useState(false);

  // Tell the database this responder is going, and keep their location fresh for the sender
  const goingTo = async () => {
    setGoing(true);
    if (!alertRow) return;
    const { error } = await supabase.from('responses').insert({ alert_id: alertRow.id, lat: me?.lat ?? null, lng: me?.lng ?? null });
    if (error && error.code === '23505') {
      await supabase.from('responses').update({ status: 'going' }).eq('alert_id', alertRow.id).eq('responder_id', userId);
    }
  };

  useEffect(() => {
    if (!going || !alertRow || !me) return;
    supabase.from('responses')
      .update({ lat: me.lat, lng: me.lng, updated_at: new Date().toISOString() })
      .eq('alert_id', alertRow.id).eq('responder_id', userId);
  }, [going, me?.lat, me?.lng]);

  const dismiss = async () => {
    if (going && alertRow) {
      await supabase.from('responses').update({ status: 'stopped' }).eq('alert_id', alertRow.id).eq('responder_id', userId);
    }
    if (alertRow) dismissed.current.add(alertRow.id);
    setAlertRow(null);
    setGoing(false);
  };

  // 1. Is this person a responder? (re-checked when Settings changes something)
  const refresh = () =>
    supabase.from('profiles').select('cpr_claimed, medical_claimed, verified').eq('id', userId).single()
      .then(({ data }) => setEligible(!!(data && (data.cpr_claimed || data.medical_claimed || data.verified))));
  useEffect(() => { refresh(); }, [userId]);

  // 2. Share location + register for notifications
  useEffect(() => {
    if (!eligible) return;
    let watcher;
    let heartbeat;
    (async () => {
      try {
        const token = await registerForPush();
        if (token) await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
      } catch (e) { console.warn('Push setup failed:', e.message); }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 20000 },
        async (pos) => {
          const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMe(here);
          await supabase.from('profiles').update({
            lat: here.lat, lng: here.lng, location_updated_at: new Date().toISOString(),
          }).eq('id', userId);
        }
      );
      // iPhone only reports after you MOVE ~25 m, so a phone sitting still would go
      // stale and miss alerts. Refresh once a minute while the app is open.
      heartbeat = setInterval(async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMe(here);
          await supabase.from('profiles').update({
            lat: here.lat, lng: here.lng, location_updated_at: new Date().toISOString(),
          }).eq('id', userId);
        } catch (e) { /* try again next minute */ }
      }, 60000);
    })();
    return () => { watcher?.remove(); clearInterval(heartbeat); };
  }, [eligible, userId]);

  // 3. Show open alerts nearby, then listen for new ones
  useEffect(() => {
    if (!eligible) return;
    // Refresh our location FIRST (the database only shows alerts to people whose
    // saved location is recent), then look for an open alert nearby.
    const loadOpenAlert = async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMe(here);
        await supabase.from('profiles').update({
          lat: here.lat, lng: here.lng, location_updated_at: new Date().toISOString(),
        }).eq('id', userId);
      } catch (e) { /* no location yet, try anyway */ }
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data } = await supabase.from('alerts').select('*').eq('status', 'open').gte('created_at', since)
        .order('created_at', { ascending: false }).limit(1);
      const row = data?.[0];
      if (row && row.created_by !== userId && !dismissed.current.has(row.id)) {
        setAlertRow((cur) => (cur && cur.id === row.id ? cur : row));
      }
    };
    loadOpenAlert();

    // Check again whenever the app comes back to the front...
    const appSub = AppState.addEventListener('change', (s) => { if (s === 'active') loadOpenAlert(); });
    // ...and when someone taps a notification (including opening a closed app from one)
    const tapSub = onNotificationTap(() => loadOpenAlert());
    hadNotificationTap().then((t) => { if (t) loadOpenAlert(); });

    const channel = supabase
      .channel('alerts-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        const row = payload.new;
        if (payload.eventType === 'INSERT' && row.status === 'open' && row.created_by !== userId) {
          setAlertRow(row);
          setGoing(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        if (payload.eventType === 'UPDATE' && row.status !== 'open') {
          setAlertRow((cur) => (cur && cur.id === row.id ? null : cur));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      appSub.remove();
      tapSub.remove();
    };
  }, [eligible, userId]);

  return { eligible, me, alertRow, going, setGoing: (v) => (v ? goingTo() : setGoing(false)), dismiss, refresh };
}