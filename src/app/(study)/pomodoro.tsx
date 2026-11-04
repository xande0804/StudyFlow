import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState, Button, Modal, Platform, StyleSheet, Text, TextInput, Vibration, View } from 'react-native';
import { useSession } from '../../session';

type Mode = 'focus' | 'rest';
type Timer = {
  mode: Mode;
  focus: number;
  rest: number;
  duration: number;
  remaining: number;
  endsAt: number | null;
};

const initial: Timer = { mode: 'focus', focus: 25, rest: 5, duration: 1500000, remaining: 1500000, endsAt: null };

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
      if (mounted) setTimer(value ? JSON.parse(value) as Timer : initial);
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
    if (!timer || timer.endsAt) return;
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
    <View style={styles.screen}>
      <View style={styles.row}>
        <Button title="Foco" disabled={timer.mode === 'focus' || Boolean(timer.endsAt)} onPress={() => chooseMode('focus')} />
        <Button title="Descanso" disabled={timer.mode === 'rest' || Boolean(timer.endsAt)} onPress={() => chooseMode('rest')} />
      </View>
      <Text style={styles.clock}>{clock}</Text>
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
      <View style={styles.row}>
        <Button title={timer.endsAt ? 'Pausar' : remaining > 0 && remaining < timer.duration ? 'Continuar' : 'Iniciar'} onPress={toggle} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101422' },
  text: { color: '#f4f5ff', fontSize: 16 },
  clock: { color: '#f4f5ff', fontSize: 64, fontVariant: ['tabular-nums'], fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#000a' },
  dialog: { gap: 12, padding: 20, borderRadius: 16, width: '100%', maxWidth: 440, backgroundColor: '#182035' },
  input: { color: '#f4f5ff', borderColor: '#7886a6', borderWidth: 1, borderRadius: 8, padding: 12 },
});
