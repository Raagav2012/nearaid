import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View, Alert, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { colors } from './theme';
import NearAidLogo from './NearAidLogo';
import { supabase } from './supabase';
import SentPanel from './SentPanel';

const HOLD_MS = 2000;
const TAGS = ['Collapsed', 'Not breathing', 'Bleeding'];

async function sendAlert({ coords, tag }) {
  const { data, error } = await supabase
    .from('alerts')
    .insert({ kind: tag, lat: coords.latitude, lng: coords.longitude })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function cancelAlert(id) {
  if (!id) return;
  await supabase.from('alerts').update({ status: 'cancelled' }).eq('id', id);
}

const WARNING = 'THIS IS NOT A SUBSTITUTE FOR 911, PLEASE CALL 911 BEFORE USING THIS';

function WarningBanner() {
  return (
    <View style={styles.warn} accessibilityRole="alert">
      <Text style={styles.warnText}>{WARNING}</Text>
    </View>
  );
}

export default function AlertScreen() {
  const [tag, setTag] = useState('Collapsed');
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef(null);
  const alertId = useRef(null);
  const [alertInfo, setAlertInfo] = useState(null);

  const startHold = () => {
    if (status !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.current.start(({ finished }) => {
      if (finished) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setStatus('confirm');
      }
    });
  };

  const cancelHold = () => {
    anim.current?.stop();
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  const trigger = async () => {
    setStatus('sending');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') throw new Error('Location permission is needed to find responders.');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); // GPS, not a rough guess
      const created = await sendAlert({ coords: pos.coords, tag });
      alertId.current = created.id;
      setAlertInfo({ id: created.id, lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus('sent');
    } catch (e) {
      Alert.alert('Alert not sent', e.message + ' Call 911 now.');
      setStatus('idle');
      progress.setValue(0);
    }
  };

  const deny = () => {
    progress.setValue(0);
    setStatus('idle');
  };

  const { width } = useWindowDimensions();
  const size = Math.min(230, Math.round(width * 0.56));
  const fillScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <NearAidLogo size={34} withWord />
        <View style={styles.chip}><Text style={styles.chipText}>GPS on</Text></View>
      </View>

      {status !== 'sent' && status !== 'confirm' && <WarningBanner />}

      {status === 'confirm' && (
        <View style={styles.confirm}>
          <WarningBanner />
          <Text style={styles.confirmTitle}>Are you sure you want to call responders?</Text>
          <Text style={styles.confirmBody}>
            Nearby CPR-trained and medical responders will be alerted to your location. Call 911 first if you have not already.
          </Text>
          <Pressable style={styles.yesBtn} onPress={trigger} accessibilityRole="button">
            <Text style={styles.yesBtnText}>Confirm: call responders</Text>
          </Pressable>
          <Pressable style={styles.noBtn} onPress={deny} accessibilityRole="button">
            <Text style={styles.noBtnText}>Deny: go back</Text>
          </Pressable>
        </View>
      )}

      {status !== 'sent' && status !== 'confirm' && <Text style={[styles.title, width < 380 && { fontSize: 26, lineHeight: 30 }]}>Someone needs help?{'\n'}Call nearby responders.</Text>}

      {status === 'sent' ? (
        <SentPanel
          alertInfo={alertInfo}
          onCancel={() => { cancelAlert(alertId.current); alertId.current = null; setAlertInfo(null); setStatus('idle'); progress.setValue(0); }}
        />
      ) : status === 'confirm' ? null : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hold for 2 seconds to send an emergency alert"
            onPressIn={startHold}
            onPressOut={cancelHold}
            style={[styles.ring, { width: size + 28, height: size + 28 }]}
          >
            <View style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}>
              <Animated.View style={[styles.fill, { width: size, height: size, borderRadius: size / 2, transform: [{ scale: fillScale }] }]} />
              <Text style={styles.helpText}>{status === 'sending' ? '...' : 'HELP'}</Text>
              <Text style={styles.holdText}>Hold 2 seconds</Text>
            </View>
          </Pressable>

          <View style={styles.tags}>
            {TAGS.map((t) => (
              <Pressable key={t} onPress={() => setTag(t)} style={[styles.tag, tag === t && styles.tagOn]}>
                <Text style={styles.tagText}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.note}>Emergency services should be called at the same time.</Text>
        </>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const SIZE = 230;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  logo: { fontSize: 24, fontWeight: '800', color: colors.ink },
  chip: { backgroundColor: colors.responderSoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
  chipText: { color: colors.responder, fontWeight: '600' },
  title: { marginTop: 36, fontSize: 30, fontWeight: '800', textAlign: 'center', color: colors.ink, lineHeight: 34 },
  ring: { marginTop: 40, shadowColor: '#C8102E', shadowOpacity: 0.3, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 12, width: SIZE + 28, height: SIZE + 28, borderRadius: 999, backgroundColor: colors.emergencySoft, alignItems: 'center', justifyContent: 'center' },
  button: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.emergency, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fill: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: '#8A0B20' },
  helpText: { color: colors.white, fontSize: 48, fontWeight: '800' },
  holdText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  tags: { marginTop: 32, width: '100%', flexDirection: 'row', gap: 8 },
  tag: { flex: 1, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  tagOn: { borderColor: colors.emergency },
  tagText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  warn: { width: '100%', marginTop: 16, backgroundColor: colors.emergency, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  warnText: { color: '#fff', fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 20 },
  confirm: { width: '100%', marginTop: 8 },
  confirmTitle: { marginTop: 28, fontSize: 28, fontWeight: '800', color: colors.ink, lineHeight: 33 },
  confirmBody: { marginTop: 10, fontSize: 16, lineHeight: 23, color: colors.muted },
  yesBtn: { marginTop: 28, height: 60, borderRadius: 16, backgroundColor: colors.emergency, alignItems: 'center', justifyContent: 'center' },
  yesBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  noBtn: { marginTop: 12, height: 56, borderRadius: 16, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  noBtnText: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  note: { marginTop: 16, fontSize: 14, color: colors.muted, textAlign: 'center' },
  sent: { marginTop: 48, width: '100%', backgroundColor: colors.white, borderRadius: 18, padding: 24 },
  sentTitle: { fontSize: 28, fontWeight: '800', color: colors.emergency },
  sentBody: { marginTop: 8, fontSize: 17, color: colors.ink, lineHeight: 24 },
  reset: { marginTop: 20, height: 48, borderRadius: 14, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: 16, fontWeight: '600', color: colors.ink },
});
