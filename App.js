import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AlertScreen from './AlertScreen';
import ResponderScreen from './ResponderScreen';
import SettingsScreen from './SettingsScreen';
import AuthScreen from './AuthScreen';
import IncomingAlert from './IncomingAlert';
import VerifyScreen from './VerifyScreen';
import TutorialsScreen from './TutorialsScreen';
import DisclaimerScreen from './DisclaimerScreen';
import './backgroundLocation'; // must load at startup
import { useResponder } from './useResponder';
import TabIcon from './TabIcon';
import { supabase } from './supabase';
import { colors } from './theme';

const TABS = [
  ['alert', 'Alert'],
  ['responder', 'Responder'],
  ['tutorials', 'Tutorials'],
  ['settings', 'Settings'],
];

function Main({ session, onAlert }) {
  const [tab, setTab] = useState('alert');
  const r = useResponder(session.user.id);
  // A responder who opens the app from an alert goes straight to it (no 911 page)
  useEffect(() => { if (r.alertRow) onAlert(); }, [r.alertRow]);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === 'alert' && <AlertScreen />}
        {tab === 'responder' && <ResponderScreen eligible={r.eligible} me={r.me} userId={session.user.id} />}
        {tab === 'tutorials' && <TutorialsScreen userId={session.user.id} onGoVerify={() => setTab('verify')} />}
        {tab === 'settings' && <SettingsScreen session={session} onAddCard={() => setTab('verify')} onGoTutorials={() => setTab('tutorials')} />}
        {tab === 'verify' && (
          <VerifyScreen userId={session.user.id} onDone={() => setTab('settings')} onCancel={() => setTab('settings')} onGoTutorials={() => setTab('tutorials')} />
        )}
      </View>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        {TABS.map(([key, label]) => {
          const on = tab === key || (key === 'settings' && tab === 'verify');
          return (
            <Pressable key={key} onPress={() => setTab(key)} style={styles.tab} accessibilityRole="button" accessibilityLabel={label}>
              <TabIcon name={key} color={on ? colors.emergency : colors.muted} />
              <Text style={[styles.label, on && styles.on]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {r.alertRow && <IncomingAlert {...r} />}
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [acknowledged, setAcknowledged] = useState(false); // 911 notice, once per app launch

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  let screen;
  if (session === undefined) screen = <View style={{ flex: 1, backgroundColor: colors.ground }} />;
  else if (!session) screen = <AuthScreen />;
  else screen = <Main session={session} onAlert={() => setAcknowledged(true)} />;
  return (
    <SafeAreaProvider>
      {screen}
      {!acknowledged && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, elevation: 200 }}>
          <DisclaimerScreen onOk={() => setAcknowledged(true)} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: colors.white, paddingBottom: 22, paddingTop: 8,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 10,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 2 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  on: { color: colors.emergency },
});
