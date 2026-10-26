import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';
import { supabase } from './supabase';

function metersBetween(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const CPR_STEPS = [
  'Call 911 (or your local emergency number) if you have not already. Follow the dispatcher.',
  'Please clear the area, and make sure the person is safe.',
  'If the person is bleeding, lift the wound above their head, and ask someone else to try to find a cloth to make a tourniquet',
  'Stay with the person until the responder arrives',
  'Have someone else try to locate an AED',
  'Check if they are breathing and if their heart is beating by placing your ear directly above their nose while tilting their head up and look for their chest moving up and down while keeping two finger on their nex to try to find a pulse',
];

export default function SentPanel({ alertInfo, onCancel }) {
  const [people, setPeople] = useState([]);
  const [showCpr, setShowCpr] = useState(false);

  useEffect(() => {
    if (!alertInfo) return;
    const load = async () => {
      const { data } = await supabase.from('responses').select('*')
        .eq('alert_id', alertInfo.id).eq('status', 'going').order('created_at');
      setPeople(data ?? []);
    };
    load();
    const channel = supabase
      .channel('responses-' + alertInfo.id)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'responses', filter: `alert_id=eq.${alertInfo.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [alertInfo?.id]);

  const n = people.length;
  return (
    <View style={{ width: '100%', paddingBottom: 24 }}>
      <View style={styles.head}>
        <Text style={styles.headSmall}>Alert sent</Text>
        <Text style={styles.headTitle}>
          {n === 0 ? 'Alerting responders nearby' : n === 1 ? '1 responder is coming' : `${n} responders are coming`}
        </Text>
        <Text style={styles.headBody}>Call 911 now if you haven't. Stay with the person.</Text>
      </View>

      {people.map((p) => {
        const m = p.lat != null && alertInfo
          ? metersBetween({ lat: p.lat, lng: p.lng }, { lat: alertInfo.lat, lng: alertInfo.lng }) : null;
        return (
          <View key={p.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.skill}>{p.skill}</Text>
              <Text style={styles.meta}>{p.verified ? 'Verified' : 'Not yet verified'}{m != null ? ` · ${m} m` : ''}</Text>
            </View>
            <Text style={styles.eta}>{m != null ? `${Math.max(1, Math.round(m / 80))} min` : '...'}</Text>
          </View>
        );
      })}

      <Pressable style={styles.cprBtn} onPress={() => setShowCpr(!showCpr)}>
        <Text style={styles.cprBtnText}>{showCpr ? 'Hide CPR steps' : 'Show CPR steps'}</Text>
      </Pressable>
      {showCpr && (
        <View style={styles.cpr}>
          {CPR_STEPS.map((s, i) => <Text key={i} style={styles.step}>{i + 1}. {s}</Text>)}
        </View>
      )}

      <Pressable style={styles.cancel} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel alert</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: colors.emergency, borderRadius: 18, padding: 18, marginTop: 8 },
  headSmall: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 },
  headBody: { color: '#fff', fontSize: 15, marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 14, marginTop: 10 },
  skill: { fontSize: 17, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginTop: 2 },
  eta: { fontSize: 17, fontWeight: '800', color: colors.responder },
  cprBtn: { marginTop: 16, height: 52, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  cprBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cpr: { marginTop: 10, backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 8 },
  step: { fontSize: 16, lineHeight: 22, color: colors.ink },
  cancel: { marginTop: 12, height: 48, borderRadius: 14, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: colors.ink },
});