import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from './supabase';
import { colors } from './theme';
import { MIN_AGE, ageYears, parseUsDate, toUsDate } from './dates';
import { REQUIRED_IDS } from './videos';

const ISSUERS = ['American Heart Association', 'American Red Cross', 'Other'];

async function uploadPhoto(uri, path) {
  const bytes = await (await fetch(uri)).arrayBuffer();
  const r = await supabase.storage.from('cert-cards').upload(path, bytes, { contentType: 'image/jpeg' });
  if (r.error) throw r.error;
}

export default function VerifyScreen({ userId, onDone, onCancel, onGoTutorials }) {
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef(null);
  const [step, setStep] = useState('details'); // details | card | id | sending | sent
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [issuer, setIssuer] = useState(ISSUERS[0]);
  const [expiry, setExpiry] = useState('');
  const [qr, setQr] = useState(null);
  const [cardUri, setCardUri] = useState(null);
  const [error, setError] = useState('');
  const [videosDone, setVideosDone] = useState(null); // null = checking

  useEffect(() => {
    supabase.from('profiles').select('full_name, date_of_birth').eq('id', userId).single()
      .then(({ data }) => { if (data) { setName(data.full_name ?? ''); setDob(toUsDate(data.date_of_birth)); } });
  }, [userId]);

  useEffect(() => {
    supabase.from('video_progress').select('video_id').in('video_id', REQUIRED_IDS)
      .then(({ data }) => setVideosDone((data ?? []).length === REQUIRED_IDS.length));
  }, [userId]);

  const next = () => {
    setError('');
    if (videosDone === false) return setError('Watch the 2 required videos in Tutorials first.');
    const dobIso = parseUsDate(dob);
    const expIso = parseUsDate(expiry);
    if (!name.trim()) return setError('Enter your full name as it appears on your card.');
    if (!dobIso) return setError('Enter your date of birth like 03/25/1990.');
    if (ageYears(dobIso) < MIN_AGE) return setError(`Verified responders must be ${MIN_AGE} or older.`);
    if (!expIso) return setError('Enter the card expiry date like 06/30/2027.');
    if (new Date(expIso) < new Date()) return setError('That card has expired. Renew it, then add it here.');
    setStep('card');
  };

  const shoot = async () => {
    const pic = await cam.current.takePictureAsync({ quality: 0.6 });
    return pic.uri;
  };

  const submit = async (idUri) => {
    setStep('sending'); setError('');
    try {
      const stamp = Date.now();
      const cardPath = `${userId}/card-${stamp}.jpg`;
      const idPath = `${userId}/id-${stamp}.jpg`;
      await uploadPhoto(cardUri, cardPath);
      await uploadPhoto(idUri, idPath);
      const ins = await supabase.from('certifications').insert({
        qr_data: qr, image_path: cardPath, id_image_path: idPath,
        issuer, expires_on: parseUsDate(expiry),
      });
      if (ins.error) throw ins.error;
      await supabase.from('profiles').update({
        full_name: name.trim(), date_of_birth: parseUsDate(dob), cpr_claimed: true,
      }).eq('id', userId);
      setStep('sent');
    } catch (e) {
      setError(e.message || 'Something went wrong. Try again.');
      setStep('id');
    }
  };

  const Header = ({ n, title, sub }) => (
    <View>
      <View style={styles.topRow}>
        <Text style={styles.stepLabel}>Step {n} of 3</Text>
        <Pressable onPress={onCancel}><Text style={styles.cancel}>Cancel</Text></Pressable>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );

  if (step === 'sent') {
    return (
      <SafeAreaView style={styles.dark}>
        <View style={styles.pad}>
          <Text style={styles.title}>Sent for review</Text>
          <Text style={styles.sub}>Our team checks your card and ID, usually within 24 hours. You'll see Verified in Settings once it's approved.</Text>
          <Pressable style={styles.btn} onPress={onDone}><Text style={styles.btnText}>Done</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'details') {
    return (
      <SafeAreaView style={styles.light}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <Text style={[styles.stepLabel, { color: colors.muted }]}>Step 1 of 3</Text>
            <Pressable onPress={onCancel}><Text style={[styles.cancel, { color: colors.emergency }]}>Cancel</Text></Pressable>
          </View>
          <Text style={[styles.title, { color: colors.ink }]}>Your details</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>We match these against your card and ID.</Text>
          {videosDone === false && (
            <View style={styles.vidWarn}>
              <Text style={styles.vidWarnTitle}>Watch the 2 required videos first</Text>
              <Text style={styles.vidWarnText}>Responders must watch both videos in Tutorials before adding a CPR card.</Text>
              <Pressable onPress={onGoTutorials}><Text style={styles.vidWarnLink}>Go to Tutorials</Text></Pressable>
            </View>
          )}
          {videosDone === true && <Text style={styles.vidOk}>✓ Required videos watched</Text>}
          <Text style={styles.label}>Full name (as on your card)</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} autoCapitalize="words" />
          <Text style={styles.label}>Date of birth</Text>
          <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" />
          <Text style={styles.label}>Who issued your card?</Text>
          {ISSUERS.map((i) => (
            <Pressable key={i} onPress={() => setIssuer(i)} style={[styles.opt, issuer === i && styles.optOn]}>
              <Text style={styles.optText}>{i}</Text>
            </Pressable>
          ))}
          <Text style={styles.label}>Card expiry date</Text>
          <TextInput style={styles.input} value={expiry} onChangeText={setExpiry} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" />
          {!!error && <Text style={styles.err}>{error}</Text>}
          <Pressable style={styles.btnRed} onPress={next}><Text style={styles.btnText}>Next: scan card</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!perm) return <View style={styles.dark} />;
  if (!perm.granted) {
    return (
      <SafeAreaView style={styles.dark}>
        <View style={styles.pad}>
          <Text style={styles.title}>Camera needed</Text>
          <Text style={styles.sub}>NearAid uses the camera to read your card and ID.</Text>
          <Pressable style={styles.btn} onPress={requestPerm}><Text style={styles.btnText}>Allow camera</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'sending') {
    return (
      <SafeAreaView style={styles.dark}>
        <View style={[styles.pad, { justifyContent: 'center' }]}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={[styles.sub, { textAlign: 'center', marginTop: 16 }]}>Sending securely...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCard = step === 'card';
  return (
    <SafeAreaView style={styles.dark}>
      <View style={styles.pad}>
        <Header
          n={isCard ? 2 : 3}
          title={isCard ? 'Scan your CPR card' : 'Photo of your ID'}
          sub={isCard ? 'Hold it flat inside the frame. Keep the code visible.'
            : "Driver's license or other government ID. Your name and date of birth must be readable."}
        />
        <View style={styles.camWrap}>
          <CameraView
            key={step}
            ref={cam}
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={isCard ? (r) => { if (!qr) setQr(r.data); } : undefined}
          />
          <View style={styles.frame} pointerEvents="none" />
        </View>
        {isCard && <Text style={styles.status}>{qr ? '✓ Certificate code found' : 'Looking for the code...'}</Text>}
        {!isCard && <Text style={styles.status}>Only our review team sees this. Never shared with anyone you help.</Text>}
        {!!error && <Text style={styles.errDark}>{error}</Text>}
        <View style={{ flex: 1 }} />
        <Pressable
          accessibilityLabel="Capture photo"
          style={styles.shutter}
          onPress={async () => {
            const uri = await shoot();
            if (isCard) { setCardUri(uri); setStep('id'); } else submit(uri);
          }}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  vidWarn: { marginTop: 14, backgroundColor: '#FBF1DC', borderRadius: 12, padding: 14 },
  vidWarnTitle: { color: '#7A4F0E', fontSize: 16, fontWeight: '800' },
  vidWarnText: { color: '#7A4F0E', fontSize: 14, lineHeight: 20, marginTop: 4 },
  vidWarnLink: { color: '#0B4A56', fontSize: 15, fontWeight: '800', marginTop: 8 },
  vidOk: { marginTop: 14, color: '#1F6B4A', fontSize: 15, fontWeight: '700' },
  dark: { flex: 1, backgroundColor: '#14181D' },
  light: { flex: 1, backgroundColor: colors.ground },
  pad: { flexGrow: 1, flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stepLabel: { color: '#6EC3D1', fontSize: 14, fontWeight: '700' },
  cancel: { color: '#F3A6B0', fontSize: 15, fontWeight: '600' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  sub: { color: '#C9D1D9', fontSize: 16, marginTop: 6, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted, marginTop: 16 },
  input: { height: 52, borderWidth: 2, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, marginTop: 6, backgroundColor: '#fff' },
  opt: { marginTop: 8, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.line, borderRadius: 12, padding: 14 },
  optOn: { borderColor: colors.responder },
  optText: { fontSize: 16, fontWeight: '600', color: colors.ink },
  err: { color: colors.emergency, marginTop: 14, fontSize: 15, fontWeight: '600' },
  errDark: { color: '#F3A6B0', marginTop: 12, fontSize: 15 },
  camWrap: { marginTop: 16, height: 300, borderRadius: 18, overflow: 'hidden', backgroundColor: '#1F262E' },
  frame: { position: 'absolute', top: 40, bottom: 40, left: 30, right: 30, borderWidth: 4, borderColor: '#6EC3D1', borderRadius: 14 },
  status: { color: '#fff', fontSize: 15, marginTop: 14, lineHeight: 21 },
  shutter: { alignSelf: 'center', width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E5384F' },
  btn: { marginTop: 28, height: 56, borderRadius: 14, backgroundColor: '#E5384F', alignItems: 'center', justifyContent: 'center' },
  btnRed: { marginTop: 24, height: 56, borderRadius: 14, backgroundColor: colors.emergency, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
