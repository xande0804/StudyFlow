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
      <Button title="Sair" disabled={busy} onPress={logout} />
      {!!message && <Text accessibilityLiveRegion="polite" style={{ color: '#ff9aab' }}>{message}</Text>}
    </View>
  );
}
