import React, { useEffect, useRef } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';

function metersBetween(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// Full-screen alert that appears on top of any tab
export default function IncomingAlert({ alertRow, me, going, setGoing, dismiss }) {
  const mapRef = useRef(null);
  const target = { latitude: alertRow.lat, longitude: alertRow.lng };
  const meters = me ? metersBetween(me, { lat: alertRow.lat, lng: alertRow.lng }) : null;
  const minutes = meters != null ? Math.max(1, Math.round(meters / 80)) : null; // about 80 m per minute walking
  const arrived = meters != null && meters <= 25;

  // Keep both you and the person in view as you move
  useEffect(() => {
    if (!going || !me || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      [{ latitude: me.lat, longitude: me.lng }, target],
      { edgePadding: { top: 80, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  }, [going, me?.lat, me?.lng]);

  const openDirections = () => {
    const { latitude: la, longitude: lo } = target;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${la},${lo}&dirflg=w`,
      android: `google.navigation:q=${la},${lo}&mode=w`,
    });
    Linking.openURL(url);
  };

  if (going) {
    return (
      <View style={styles.overlay}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          showsUserLocation
          initialRegion={{ ...target, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
        >
          <Marker coordinate={target} pinColor="red" title="Person who needs help" />
          {me && (
            <Polyline
              coordinates={[{ latitude: me.lat, longitude: me.lng }, target]}
              strokeColor="#E5384F" strokeWidth={4} lineDashPattern={[8, 8]}
            />
          )}
        </MapView>
        <SafeAreaView style={styles.panel}>
          <Text style={styles.kicker}>{arrived ? "You've arrived" : 'On your way'}</Text>
          <Text style={styles.panelTitle}>{alertRow.kind}</Text>
          {meters != null && !arrived && <Text style={styles.sub}>{meters} m away · about {minutes} min on foot</Text>}
          {arrived && <Text style={styles.sub}>Look for the person and start CPR if needed.</Text>}
          <Pressable style={styles.yes} onPress={openDirections}>
            <Text style={styles.yesText}>Walking directions</Text>
          </Pressable>
          <Pressable onPress={dismiss}><Text style={styles.close}>Close</Text></Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.body}>
        <Text style={styles.kicker}>Emergency nearby</Text>
        <Text style={styles.title}>{alertRow.kind}</Text>
        {meters != null && <Text style={styles.sub}>{meters} m away · about {minutes} min on foot</Text>}
        <View style={styles.buttons}>
          <Pressable style={styles.yes} onPress={() => setGoing(true)}>
            <Text style={styles.yesText}>I'm going</Text>
          </Pressable>
          <Pressable style={styles.no} onPress={dismiss}>
            <Text style={styles.noText}>Can't help right now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#14181D', zIndex: 100, elevation: 100 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  kicker: { color: '#F3C7CD', fontSize: 15, fontWeight: '600' },
  title: { color: '#fff', fontSize: 36, fontWeight: '800', lineHeight: 40, marginTop: 6 },
  sub: { color: '#C9D1D9', fontSize: 18, marginTop: 10 },
  buttons: { marginTop: 'auto', marginBottom: 24, gap: 10 },
  yes: { height: 60, borderRadius: 16, backgroundColor: '#E5384F', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  yesText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  no: { height: 52, borderRadius: 16, borderWidth: 2, borderColor: '#4A525A', alignItems: 'center', justifyContent: 'center' },
  noText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  panel: { backgroundColor: '#14181D', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12 },
  panelTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 },
  close: { color: '#6EC3D1', fontSize: 16, fontWeight: '600', marginTop: 14, textAlign: 'center' },
});