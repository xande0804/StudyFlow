import { Button } from '../../Button';
import { initialTimer, restoreTimer, type Timer } from '../../pomodoroState';
import { reconcileNotices } from '../../notices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState, DeviceEventEmitter, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, Vibration, View } from 'react-native';
import { useSession } from '../../session';

type Mode = 'focus' | 'rest';

export default function PomodoroScreen() {
  const { user } = useSession();
  return user ? <Pomodoro key={user.uid} uid={user.uid} /> : null;
}

function Pomodoro({ uid }: { uid: string }) {
  const key = '@studyflow/pomodoro/' + uid;
  const [timer, setTimer] = useState<Timer>();
  const [now, setNow] = useState(Date.now);
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<'settings' | 'reset'>();
  const [settings, setSettings] = useState({ focus: '', rest: '' });
  const [settingsError, setSettingsError] = useState('');
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(key).then((value) => {
      if (!mounted) return;
      try {
        setNow(Date.now());
        setTimer(restoreTimer(value));
      } catch {
        setTimer(initialTimer);
        setMessage('A sessão salva estava inválida. O cronômetro foi restaurado para 25 minutos.');
      }
    }).catch(() => {
      if (mounted) setMessage('Não foi possível carregar a sessão salva.');
    });
    return () => { mounted = false; };
  }, [key]);

  useEffect(() => {
    if (!timer) return;
    writes.current = writes.current.then(() => AsyncStorage.setItem(key, JSON.stringify(timer)))
      .catch(() => setMessage('Não foi possível salvar a sessão neste aparelho.'));
  }, [key, timer]);

  useEffect(() => {
    if (!timer?.endsAt) return;
    function update() { setNow(Date.now()); }
    update();
    const interval = setInterval(update, 250);
    const subscription = AppState.addEventListener('change', update);
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [timer?.endsAt]);

  const endsAt = timer?.endsAt;
  const mode = timer?.mode;
  const ready = Boolean(timer);
  const completed = timer?.remaining === 0;
  useEffect(() => {
    if (!ready || completed) return;
    const scope = 'pomodoro:' + uid;
    function refresh() {
      if (endsAt && endsAt <= Date.now()) return;
      const desired = endsAt ? [{ id: scope, title: 'Sessão concluída',
        body: mode === 'focus' ? 'Seu tempo de foco terminou.' : 'Seu descanso terminou.', at: endsAt }] : [];
      reconcileNotices(scope, desired).catch((error) => console.warn('StudyFlow Pomodoro:', error));
    }
    refresh();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    const permission = DeviceEventEmitter.addListener('studyflow-notice-permission', refresh);
    return () => { subscription.remove(); permission.remove(); };
  }, [completed, endsAt, mode, ready, uid]);
  useEffect(() => {
    if (!endsAt || now < endsAt) return;
    setTimer((current) => current?.endsAt === endsAt ? { ...current, endsAt: null, remaining: 0 } : current);
    setMessage('Sessão concluída.');
    if (Platform.OS !== 'web' && AppState.currentState === 'active') Vibration.vibrate();
  }, [endsAt, now]);

  if (!timer) return <View style={styles.screen}><Text style={styles.text}>{message || 'Carregando sessão…'}</Text></View>;
  const remaining = timer.endsAt ? Math.max(0, timer.endsAt - now) : timer.remaining;
  const seconds = Math.ceil(remaining / 1000);
  const clock = [Math.floor(seconds / 60), seconds % 60].map((value) => String(value).padStart(2, '0')).join(':');

  function chooseMode(mode: Mode) {
    if (!timer || timer.endsAt || timer.mode === mode) return;
    const duration = timer[mode] * 60000;
    setTimer({ ...timer, mode, duration, remaining: duration });
    setMessage('');
  }

  function toggle() {
    if (!timer) return;
    const timestamp = Date.now();
    if (timer.endsAt) {
      if (timestamp >= timer.endsAt) { setNow(timestamp); return; }
      setTimer({ ...timer, remaining: timer.endsAt - timestamp, endsAt: null });
    } else {
      const duration = timer.remaining === 0 ? timer[timer.mode] * 60000 : timer.duration;
      const next = timer.remaining || duration;
      setNow(timestamp);
      setTimer({ ...timer, duration, remaining: next, endsAt: timestamp + next });
      setMessage('');
    }
  }

  function saveSettings() {
    if (!timer) return;
    const focus = Number(settings.focus);
    const rest = Number(settings.rest);
    if (!/^\d+$/.test(settings.focus) || !/^\d+$/.test(settings.rest) || focus < 1 || focus > 120 || rest < 1 || rest > 60) {
      setSettingsError('Use 1 a 120 minutos para foco e 1 a 60 para descanso.');
      return;
    }
    const ready = !timer.endsAt && timer.remaining === timer.duration;
    const duration = ready ? (timer.mode === 'focus' ? focus : rest) * 60000 : timer.duration;
    setTimer({ ...timer, focus, rest, duration, remaining: ready ? duration : timer.remaining });
    setDialog(undefined);
  }

  return (
    <ScrollView style={styles.background} contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>MENOS DISTRAÇÃO, MAIS PRESENÇA</Text>
      <Text accessibilityRole="header" style={styles.heading}>Seu momento de foco.</Text>
      <Text style={styles.caption}>Escolha um ritmo e cuide de uma coisa por vez.</Text>
      <View style={styles.row}>
        <Button title="Foco" selected={timer.mode === 'focus'} disabled={Boolean(timer.endsAt)} onPress={() => chooseMode('focus')} />
        <Button title="Descanso" selected={timer.mode === 'rest'} disabled={Boolean(timer.endsAt)} onPress={() => chooseMode('rest')} />
      </View>
      <View style={[styles.timerFace, timer.mode === 'rest' && styles.restFace]}>
        <Text style={styles.timerLabel}>{timer.mode === 'focus' ? 'FOCO' : 'DESCANSO'}</Text>
        <Text accessibilityLabel={'Tempo restante ' + clock} style={styles.clock}>{clock}</Text>
        <Text style={styles.caption}>{timer.endsAt ? 'Em andamento' : remaining === 0 ? 'Sessão concluída' : remaining < timer.duration ? 'Em pausa' : 'Pronto para começar'}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: String(Math.min(100, Math.max(0, (timer.duration - remaining) / timer.duration * 100))) + '%' as `${number}%` }]} />
      </View>
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
      <View style={styles.row}>
        <Button variant="primary" title={timer.endsAt ? 'Pausar' : remaining > 0 && remaining < timer.duration ? 'Continuar' : 'Iniciar'} onPress={toggle} />
        <Button title="Reiniciar" onPress={() => setDialog('reset')} />
        <Button title="Configurar" onPress={() => {
          setSettings({ focus: String(timer.focus), rest: String(timer.rest) });
          setSettingsError('');
          setDialog('settings');
        }} />
      </View>
      <Modal transparent visible={Boolean(dialog)} animationType="fade" onRequestClose={() => setDialog(undefined)}>
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            {dialog === 'settings' ? (
              <>
                <Text style={styles.text}>Foco (minutos)</Text>
                <TextInput style={styles.input} accessibilityLabel="Foco (minutos)" keyboardType="number-pad" value={settings.focus}
                  onChangeText={(focus) => setSettings((current) => ({ ...current, focus }))} />
                <Text style={styles.text}>Descanso (minutos)</Text>
                <TextInput style={styles.input} accessibilityLabel="Descanso (minutos)" keyboardType="number-pad" value={settings.rest}
                  onChangeText={(rest) => setSettings((current) => ({ ...current, rest }))} />
                {!!settingsError && <Text accessibilityLiveRegion="polite" style={styles.text}>{settingsError}</Text>}
                <Button title="Salvar durações" onPress={saveSettings} />
              </>
            ) : (
              <>
                <Text style={styles.text}>Reiniciar a sessão atual?</Text>
                <Button title="Confirmar reinício" onPress={() => {
                  setTimer({ ...timer, remaining: timer.duration, endsAt: null });
                  setMessage('');
                  setDialog(undefined);
                }} />
              </>
            )}
            <Button title="Cancelar" onPress={() => setDialog(undefined)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0e1220' },
  screen: { flexGrow: 1, padding: 24, paddingBottom: 40, gap: 20, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#b9a5ff', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', textAlign: 'center' },
  heading: { color: '#f5f3ff', fontSize: 28, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  caption: { color: '#9ca8c2', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  timerFace: { width: 260, height: 260, borderRadius: 130, borderWidth: 3, borderColor: '#b9a5ff', backgroundColor: '#171b30', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 8 },
  restFace: { borderColor: '#89dfcb', backgroundColor: '#15292d' },
  timerLabel: { color: '#cfc4f6', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  progressTrack: { height: 4, width: 200, backgroundColor: '#2d354c', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#b9a5ff' },
  text: { color: '#f4f5ff', fontSize: 16 },
  clock: { color: '#f4f5ff', fontSize: 64, fontVariant: ['tabular-nums'], fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#000a' },
  dialog: { gap: 12, padding: 20, borderRadius: 22, width: '100%', maxWidth: 440, backgroundColor: '#171e30' },
  input: { color: '#f4f5ff', borderColor: '#34405b', borderWidth: 1, borderRadius: 12, padding: 12 },
});
