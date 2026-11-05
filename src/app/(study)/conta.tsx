import { reconcileNotices, requestNotices, supportsNotices } from '../../notices';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';
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
    <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: '#101422' }}>
      <Text style={{ color: '#bec6de' }}>Sessão iniciada como {user?.email}</Text>
      {supportsNotices && <Button title="Permitir notificações" onPress={async () => {
        try {
          const allowed = await requestNotices();
          setMessage(allowed ? 'Notificações permitidas.' : 'Você pode permitir notificações nos ajustes do aparelho.');
        } catch (error) {
          console.warn('StudyFlow permissão de notificações:', error);
          setMessage('Não foi possível verificar a permissão.');
        }
      }} />}
      <Button title="Sair" disabled={busy} onPress={logout} />
      {!!message && <Text accessibilityLiveRegion="polite" style={{ color: '#ff9aab' }}>{message}</Text>}
    </View>
  );
}
