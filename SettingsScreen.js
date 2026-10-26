import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabase';
import { colors, extra } from './theme';
import { parseUsDate, toUsDate, daysUntil } from './dates';

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      {!!title && <Text style={styles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
}

function Pill({ text, tone }) {
  const t = {
    good: [extra.successSoft, '#1F6B4A'], warn: [extra.warnSoft, extra.warn],
    bad: ['#F9DADF', colors.emergency], plain: [colors.responderSoft, colors.responder],
  }[tone || 'plain'];
  return <View style={[styles.pill, { backgroundColor: t[0] }]}><Text style={[styles.pillText, { color: t[1] }]}>{text}</Text></View>;
}

export default function SettingsScreen({ session, onAddCard, onGoTutorials }) {
  const [p, setP] = useState(null);
  const [cert, setCert] = useState(null);
  const [cardUrl, setCardUrl] = useState(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setP(prof);
    setName(prof?.full_name ?? ''); setDob(toUsDate(prof?.date_of_birth)); setPhone(prof?.phone ?? '');
    const { data: c } = await supabase.from('certifications').select('*').order('created_at', { ascending: false }).limit(1);
    const row = c?.[0] ?? null;
    setCert(row);
    if (row?.image_path) {
      const { data: u } = await supabase.storage.from('cert-cards').createSignedUrl(row.image_path, 600);
      setCardUrl(u?.signedUrl ?? null);
    } else setCardUrl(null);
  }, [session.user.id]);
  useEffect(() => { load(); }, [load]);

  const saveDetails = async () => {
    setMsg('');
    if (!name.trim()) return setMsg('Enter your full name.');
    const iso = dob ? parseUsDate(dob) : null;
    if (dob && !iso) return setMsg('Enter your date of birth like 03/25/2008.');
    setSaving(true);
    const { error } = await supabase.from('profiles')
      .update({ full_name: name.trim(), date_of_birth: iso, phone: phone.trim() || null }).eq('id', session.user.id);
    setSaving(false);
    setMsg(error ? error.message : 'Saved.');
  };

  const setFlag = async (key, val) => {
    setP((cur) => ({ ...cur, [key]: val }));
    await supabase.from('profiles').update({ [key]: val }).eq('id', session.user.id);
  };

  if (!p) return <SafeAreaView style={styles.screen} />;

  const verified = p.verified;
  const status = verified ? ['Verified', 'good']
    : cert?.status === 'pending' ? ['In review', 'warn']
    : cert?.status === 'rejected' ? ['Not approved', 'bad']
    : p.cpr_claimed ? ['Card needed', 'warn'] : ['Not a responder', 'plain'];

  let expiry = null;
  if (cert?.expires_on) {
    const d = daysUntil(cert.expires_on);
    expiry = d < 0 ? ['Expired', 'bad'] : d <= 60 ? [`Expires in ${d} days`, 'warn'] : [`Valid until ${toUsDate(cert.expires_on)}`, 'good'];
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.email}>{session.user.email}</Text>

        <Card title="Your CPR card">
          {(p.cpr_claimed || cert) ? (
            <View style={styles.wallet}>
              <View style={styles.walletTop}>
                <Ionicons name="heart-circle" size={34} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletName}>{p.full_name || 'Add your name below'}</Text>
                  <Text style={styles.walletSub}>{cert?.issuer || 'CPR certified'}</Text>
                </View>
              </View>
              <View style={styles.pills}>
                <Pill text={status[0]} tone={status[1]} />
                {expiry && <Pill text={expiry[0]} tone={expiry[1]} />}
              </View>
            </View>
          ) : (
            <Text style={styles.hint}>Add your CPR card to become a verified responder. You can do this anytime.</Text>
          )}
          {cardUrl && <Image source={{ uri: cardUrl }} style={styles.thumb} resizeMode="cover" />}
          <View style={styles.vidNote}>
            <Text style={styles.vidNoteText}>Before adding your card, watch the 2 required videos in Tutorials.</Text>
            <Pressable onPress={onGoTutorials}><Text style={styles.vidNoteLink}>Open Tutorials</Text></Pressable>
          </View>
          <Pressable style={styles.primary} onPress={onAddCard}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.primaryText}>{cert ? 'Replace CPR card' : 'Add CPR card'}</Text>
          </Pressable>
        </Card>

        <Card title="Personal details">
          <Text style={styles.label}>Full name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="As shown on your ID" autoCapitalize="words" />
          <Text style={styles.label}>Date of birth</Text>
          <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" />
          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="For account recovery" keyboardType="phone-pad" />
          {!!msg && <Text style={[styles.msg, msg === 'Saved.' && { color: extra.success }]}>{msg}</Text>}
          <Pressable style={[styles.secondary, saving && { opacity: 0.6 }]} onPress={saveDetails} disabled={saving}>
            <Text style={styles.secondaryText}>{saving ? 'Saving...' : 'Save details'}</Text>
          </Pressable>
          <Text style={styles.fine}>Your name and date of birth are only used to check your card. They are never shown to people you help.</Text>
        </Card>

        <Card title="Responder options">
          <View style={styles.row}>
            <Text style={styles.rowText}>I'm CPR certified</Text>
            <Switch value={!!p.cpr_claimed} onValueChange={(v) => setFlag('cpr_claimed', v)} trackColor={{ true: colors.responder }} />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>I'm a medical professional</Text>
            <Switch value={!!p.medical_claimed} onValueChange={(v) => setFlag('medical_claimed', v)} trackColor={{ true: colors.responder }} />
          </View>
        </Card>

        <Pressable style={styles.out} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.outText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  vidNote: { marginTop: 14, backgroundColor: '#FBF1DC', borderRadius: 12, padding: 12 },
  vidNoteText: { color: '#7A4F0E', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  vidNoteLink: { color: '#0B4A56', fontSize: 14, fontWeight: '800', marginTop: 6 },
  screen: { flex: 1, backgroundColor: colors.ground },
  body: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: colors.ink, marginTop: 8 },
  email: { fontSize: 16, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 18, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  hint: { fontSize: 15, lineHeight: 21, color: colors.muted },
  wallet: { backgroundColor: colors.responder, borderRadius: 16, padding: 16 },
  walletTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  walletSub: { color: '#BFE0E6', fontSize: 14, marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  pillText: { fontSize: 13, fontWeight: '700' },
  thumb: { height: 150, borderRadius: 14, marginTop: 12, backgroundColor: colors.line },
  primary: { marginTop: 14, height: 52, borderRadius: 14, backgroundColor: colors.emergency, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted, marginTop: 10 },
  input: { height: 50, borderWidth: 2, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, marginTop: 6, backgroundColor: colors.ground },
  msg: { marginTop: 12, color: colors.emergency, fontSize: 14, fontWeight: '600' },
  secondary: { marginTop: 14, height: 48, borderRadius: 12, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  fine: { marginTop: 12, fontSize: 13, lineHeight: 18, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowText: { fontSize: 16, color: colors.ink },
  out: { marginTop: 24, height: 48, borderRadius: 14, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  outText: { fontSize: 16, fontWeight: '600', color: colors.ink },
});
