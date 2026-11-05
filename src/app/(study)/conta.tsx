import { Button } from '../../Button';
import { reconcileNotices, requestNotices, supportsNotices } from '../../notices';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConnection';
import { useSession } from '../../session';

export default function AccountScreen() {
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function logout() {
    if (!auth || busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (user) {
        await reconcileNotices('pomodoro:' + user.uid, []).catch((error) => console.warn('StudyFlow Pomodoro:', error));
      }
      await signOut(auth);
    } catch {
      setMessage('Não foi possível sair. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.initial}>{(user?.displayName || user?.email || 'S').charAt(0).toUpperCase()}</Text></View>
        <Text accessibilityRole="header" style={styles.name}>{user?.displayName || 'Seu espaço no StudyFlow'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <Text style={styles.section}>Preferências da conta</Text>
      <Text style={styles.description}>Ative os lembretes para acompanhar seus prazos e sessões de foco neste aparelho.</Text>
      {supportsNotices && <Button title="Permitir notificações" onPress={async () => {
        try {
          const allowed = await requestNotices();
          setMessage(allowed ? 'Notificações permitidas.' : 'Você pode permitir notificações nos ajustes do aparelho.');
        } catch (error) {
          console.warn('StudyFlow permissão de notificações:', error);
          setMessage('Não foi possível verificar a permissão.');
        }
      }} />}
      <Button variant="danger" title="Sair da conta" disabled={busy} onPress={logout} />
      {!!message && <Text accessibilityLiveRegion="polite" style={{ color: '#ff9aab' }}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#0e1220' },
  content: { padding: 24, gap: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  card: { alignItems: 'center', padding: 28, gap: 12, backgroundColor: '#171e30', borderRadius: 22, borderWidth: 1, borderColor: '#283149', marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#30294a', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#c5b6ff', fontSize: 28, fontWeight: '700' },
  name: { color: '#f4f5ff', fontSize: 21, fontWeight: '600', textAlign: 'center' },
  email: { color: '#a2aec6', fontSize: 14, textAlign: 'center' },
  section: { color: '#e1e5f0', fontSize: 16, fontWeight: '600' },
  description: { color: '#9ca8c2', fontSize: 14, lineHeight: 23 },
});
