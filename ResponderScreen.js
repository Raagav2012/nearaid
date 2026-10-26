import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';
import { isBackgroundOn, startBackground, stopBackground } from './backgroundLocation';

// Status page. Alerts themselves appear on top of every tab.
export default function ResponderScreen({ eligible, me, userId }) {
  const [bgOn, setBgOn] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { isBackgroundOn().then(setBgOn); }, []);

  const toggle = async () => {
    setMsg('');
    if (bgOn) {
      await stopBackground(userId);
      setBgOn(false);
    } else {
      const r = await startBackground(userId);
      if (r.ok) setBgOn(true); else setMsg(r.message);
    }
  };

  let body;
  if (eligible === null) body = 'Checking your account...';
  else if (!eligible) body = "You didn't sign up as a CPR-certified person or medical professional, so you won't receive alerts.";
  else body = "You're on. NearAid alerts you from any screen when someone within 400 m needs help.";

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.title}>Responder mode</Text>
        <Text style={styles.text}>{body}</Text>
        {eligible && <Text style={styles.small}>{me ? 'Your location is being shared with NearAid while the app is open.' : 'Waiting for your location...'}</Text>}
        {eligible && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stay available when the app is closed</Text>
            <Text style={styles.cardBody}>
              NearAid keeps your location updated in the background so you can be alerted anytime. Your phone shows a location indicator while this is on. Turn it off and your saved location is deleted.
            </Text>
            <Pressable style={[styles.btn, bgOn && styles.btnOff]} onPress={toggle}>
              <Text style={[styles.btnText, bgOn && { color: colors.ink }]}>{bgOn ? 'Turn off' : 'Turn on'}</Text>
            </Pressable>
            {!!msg && <Text style={styles.err}>{msg}</Text>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink },
  text: { fontSize: 17, lineHeight: 24, color: colors.ink, marginTop: 10 },
  small: { fontSize: 14, color: colors.muted, marginTop: 16 },
  card: { marginTop: 28, backgroundColor: colors.white, borderRadius: 16, padding: 18 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  cardBody: { fontSize: 15, lineHeight: 21, color: colors.muted, marginTop: 6 },
  btn: { marginTop: 14, height: 50, borderRadius: 12, backgroundColor: colors.responder, alignItems: 'center', justifyContent: 'center' },
  btnOff: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.line },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  err: { marginTop: 12, color: colors.emergency, fontSize: 14 },
});