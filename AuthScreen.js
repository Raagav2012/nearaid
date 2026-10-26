import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './supabase';
import { colors } from './theme';
import NearAidLogo from './NearAidLogo';

function Check({ on, title, body, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.opt, on && styles.optOn]}>
      <View style={[styles.box, on && styles.boxOn]}>{on && <Text style={styles.tick}>✓</Text>}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optTitle}>{title}</Text>
        <Text style={styles.optBody}>{body}</Text>
      </View>
    </Pressable>
  );
}

export default function AuthScreen() {
  const [signUp, setSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpr, setCpr] = useState(false);
  const [medical, setMedical] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setMsg('');
    const { data, error } = signUp
      ? await supabase.auth.signUp({ email, password, options: { data: { cpr_claimed: cpr, medical_claimed: medical } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (signUp && !data.session) setMsg('Check your email to confirm, then sign in.');
    // On success, App.js notices the new session and shows the app.
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <NearAidLogo size={34} withWord />
        <Text style={styles.title}>{signUp ? 'Create your account' : 'Welcome back'}</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none"
          keyboardType="email-address" placeholder="you@example.com" />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry
          placeholder="At least 8 characters" />

        {signUp && (
          <>
            <Text style={[styles.label, { marginTop: 22 }]}>Want to help others?</Text>
            <Check on={cpr} onPress={() => setCpr(!cpr)} title="I have a CPR certification"
              body="You'll scan your card later to verify it." />
            <Check on={medical} onPress={() => setMedical(!medical)} title="I'm a medical professional"
              body="EMT, nurse, doctor or similar." />
          </>
        )}

        {!!msg && <Text style={styles.msg}>{msg}</Text>}
        <Pressable style={[styles.go, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          <Text style={styles.goText}>{busy ? 'Please wait...' : signUp ? 'Continue' : 'Sign in'}</Text>
        </Pressable>
        <Pressable onPress={() => { setSignUp(!signUp); setMsg(''); }}>
          <Text style={styles.switch}>
            {signUp ? 'Already have an account? ' : 'New here? '}
            <Text style={{ fontWeight: '800', color: colors.ink }}>{signUp ? 'Sign in' : 'Create account'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  body: { padding: 24 },
  logo: { fontSize: 24, fontWeight: '800', color: colors.ink, marginTop: 12 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, marginTop: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted, marginTop: 16 },
  input: { height: 52, borderWidth: 2, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, backgroundColor: colors.white, marginTop: 6 },
  opt: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderRadius: 14, padding: 14, marginTop: 10 },
  optOn: { borderColor: colors.responder },
  box: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: '#9AA1A8', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.responder, borderColor: colors.responder },
  tick: { color: '#fff', fontWeight: '800' },
  optTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  optBody: { fontSize: 14, color: colors.muted, marginTop: 3 },
  msg: { marginTop: 16, color: colors.emergency, fontSize: 15, fontWeight: '600' },
  go: { marginTop: 28, height: 56, borderRadius: 14, backgroundColor: colors.emergency, alignItems: 'center', justifyContent: 'center' },
  goText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  switch: { marginTop: 16, textAlign: 'center', fontSize: 15, color: colors.muted },
});