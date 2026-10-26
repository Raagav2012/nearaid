import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NearAidLogo from './NearAidLogo';

// Full-page notice shown every time the app opens. The user must tap OK to continue.
export default function DisclaimerScreen({ onOk }) {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.badge}><Text style={styles.badgeText}>!</Text></View>
        <Text style={styles.title}>THIS IS NOT A SUBSTITUTE FOR 911</Text>
        <Text style={styles.sub}>PLEASE CALL 911 BEFORE USING THIS</Text>
        <Text style={styles.text}>
          NearAid alerts verified CPR-trained people nearby. It works alongside emergency services and never replaces them. In an emergency, call 911 first.
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.ok} onPress={onOk} accessibilityRole="button" accessibilityLabel="OK, I understand">
          <Text style={styles.okText}>OK, I understand</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#C8102E' },
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 24 },
  badge: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#C8102E', fontSize: 64, fontWeight: '900', lineHeight: 72 },
  title: { marginTop: 28, color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 38 },
  sub: { marginTop: 16, color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 29 },
  text: { marginTop: 24, color: '#FBE1E5', fontSize: 17, lineHeight: 24, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingBottom: 24 },
  ok: { height: 60, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  okText: { color: '#8A0B20', fontSize: 19, fontWeight: '800' },
});
