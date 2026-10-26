import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './supabase';
import { colors } from './theme';
import { REQUIRED_VIDEOS, OPTIONAL_VIDEOS, hasLink } from './videos';

function Row({ video, done, opened, locked, onOpen, onMark, onUnmark, required }) {
  const linked = hasLink(video);
  return (
    <View style={[styles.row, done && styles.rowDone]}>
      <View style={styles.rowTop}>
        <View style={[styles.box, done && styles.boxOn]}>{done && <Text style={styles.tick}>✓</Text>}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{video.title}</Text>
          {!!video.description && <Text style={styles.rowBody}>{video.description}</Text>}
        </View>
      </View>
      <View style={styles.rowBtns}>
        <Pressable
          style={[styles.watch, !linked && styles.disabled]}
          disabled={!linked}
          onPress={() => onOpen(video)}
          accessibilityRole="button"
        >
          <Text style={styles.watchText}>{linked ? (done ? 'Watch again' : 'Watch video') : 'Link coming soon'}</Text>
        </Pressable>
        {!done ? (
          <Pressable
            style={[styles.mark, !opened && styles.disabled]}
            disabled={!opened}
            onPress={() => onMark(video)}
            accessibilityRole="button"
          >
            <Text style={styles.markText}>I watched it</Text>
          </Pressable>
        ) : !required ? (
          <Pressable style={styles.undo} onPress={() => onUnmark(video)}><Text style={styles.undoText}>Undo</Text></Pressable>
        ) : null}
      </View>
      {!done && linked && !opened && <Text style={styles.hint}>Tap "Watch video" first, then come back and tap "I watched it".</Text>}
    </View>
  );
}

export default function TutorialsScreen({ userId, onGoVerify }) {
  const [done, setDone] = useState({});     // video id -> true
  const [opened, setOpened] = useState({}); // video id -> true (link tapped this session)
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('video_progress').select('video_id');
    const m = {};
    (data ?? []).forEach((r) => { m[r.video_id] = true; });
    setDone(m);
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = async (v) => {
    setErr('');
    try { await Linking.openURL(v.url.trim()); setOpened((o) => ({ ...o, [v.id]: true })); }
    catch (e) { setErr("Couldn't open that link."); }
  };
  const mark = async (v) => {
    setErr('');
    const { error } = await supabase.from('video_progress').insert({ video_id: v.id });
    if (error && error.code !== '23505') return setErr(error.message);
    setDone((d) => ({ ...d, [v.id]: true }));
  };
  const unmark = async (v) => {
    await supabase.from('video_progress').delete().eq('video_id', v.id).eq('user_id', userId);
    setDone((d) => { const n = { ...d }; delete n[v.id]; return n; });
  };

  const reqDone = REQUIRED_VIDEOS.filter((v) => done[v.id]).length;
  const allReq = reqDone === REQUIRED_VIDEOS.length;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Tutorials</Text>
        <Text style={styles.sub}>Short videos anyone can watch. Tick each one off as you go.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>For responders (required)</Text>
          <Text style={styles.sectionBody}>
            To add your CPR card, watch both videos below first. {reqDone} of {REQUIRED_VIDEOS.length} watched.
          </Text>
          {REQUIRED_VIDEOS.map((v) => (
            <Row key={v.id} video={v} required done={!!done[v.id]} opened={!!opened[v.id]}
              onOpen={open} onMark={mark} onUnmark={unmark} />
          ))}
          {allReq ? (
            <Pressable style={styles.go} onPress={onGoVerify}><Text style={styles.goText}>Add my CPR card</Text></Pressable>
          ) : (
            <Text style={styles.lock}>Finish both required videos to unlock CPR card verification.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>For everyone</Text>
          {OPTIONAL_VIDEOS.map((v) => (
            <Row key={v.id} video={v} done={!!done[v.id]} opened={!!opened[v.id]}
              onOpen={open} onMark={mark} onUnmark={unmark} />
          ))}
        </View>
        {!!err && <Text style={styles.err}>{err}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  body: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: colors.ink, marginTop: 8 },
  sub: { fontSize: 16, color: colors.muted, marginTop: 4, lineHeight: 22 },
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  sectionBody: { fontSize: 15, color: colors.muted, marginTop: 4, lineHeight: 21 },
  row: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 2, borderColor: colors.line },
  rowDone: { borderColor: '#2E9E6B' },
  rowTop: { flexDirection: 'row', gap: 12 },
  box: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: '#9AA1A8', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: '#2E9E6B', borderColor: '#2E9E6B' },
  tick: { color: '#fff', fontWeight: '800' },
  rowTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  rowBody: { fontSize: 14, color: colors.muted, marginTop: 2, lineHeight: 20 },
  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  watch: { flex: 1, height: 46, borderRadius: 12, backgroundColor: colors.responder, alignItems: 'center', justifyContent: 'center' },
  watchText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  mark: { flex: 1, height: 46, borderRadius: 12, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  undo: { paddingHorizontal: 14, height: 46, alignItems: 'center', justifyContent: 'center' },
  undoText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  hint: { marginTop: 8, fontSize: 13, color: colors.muted },
  go: { marginTop: 14, height: 54, borderRadius: 14, backgroundColor: colors.emergency, alignItems: 'center', justifyContent: 'center' },
  goText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  lock: { marginTop: 14, fontSize: 14, color: colors.muted, textAlign: 'center' },
  err: { marginTop: 16, color: colors.emergency, fontSize: 14, fontWeight: '600' },
});
