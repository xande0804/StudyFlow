import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConnection';
import { useSession } from '../session';

type Mode = 'login' | 'register' | 'reset';
const titles = { login: 'Entrar', register: 'Criar conta', reset: 'Recuperar senha' };

export default function Home() {
  const { user, loading } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function changeMode(next: Mode) {
    setMode(next);
    setErrors({});
    setMessage('');
    setForm((current) => ({ ...current, password: '', confirmation: '' }));
  }

  async function submit() {
    if (!auth || busy) return;
    const email = form.email.trim();
    const invalid: Partial<typeof form> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.email = 'Informe um e-mail válido.';
    if (mode === 'login' && !form.password) invalid.password = 'Informe sua senha.';
    if (mode === 'register' && form.password.length < 6) invalid.password = 'Use pelo menos 6 caracteres.';
    if (mode === 'register' && form.confirmation !== form.password) invalid.confirmation = 'As senhas devem ser iguais.';
    setErrors(invalid);
    setMessage('');
    if (Object.keys(invalid).length) return;
    setBusy(true);
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, form.password);
      if (mode === 'register') {
        const { user: account } = await createUserWithEmailAndPassword(auth, email, form.password);
        if (form.name.trim()) {
          try {
            await updateProfile(account, { displayName: form.name.trim() });
          } catch {
            setMessage('Conta criada. Não foi possível salvar o nome.');
          }
        }
      }
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Confira sua caixa de entrada se houver uma conta com este e-mail.');
      } else {
        setForm({ name: '', email: '', password: '', confirmation: '' });
      }
    } catch (error) {
      if (__DEV__) console.warn('StudyFlow Auth:', (error as { code?: string }).code);
      setMessage('Não foi possível concluir. Confira os dados e a conexão e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function field(key: keyof typeof form, label: string) {
    const secret = key === 'password' || key === 'confirmation';
    return (
      <>
        <Text style={styles.text}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          style={[styles.input, errors[key] && styles.invalid]}
          value={form[key]}
          editable={!busy}
          autoCapitalize={key === 'name' ? 'words' : 'none'}
          keyboardType={key === 'email' ? 'email-address' : 'default'}
          secureTextEntry={secret}
          onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
        />
        {errors[key] && <Text style={styles.error}>{errors[key]}</Text>}
      </>
    );
  }

  if (user && !busy) return <Redirect href="/materias" />;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" style={styles.title}>StudyFlow</Text>
          {loading ? <ActivityIndicator /> : !auth ? (
            <Text style={styles.text}>Configure a conexão com o Firebase para continuar.</Text>
          ) : (
            <>
              <Text style={styles.text}>{titles[mode]}</Text>
              {mode === 'register' && field('name', 'Nome (opcional)')}
              {field('email', 'E-mail')}
              {mode !== 'reset' && field('password', 'Senha')}
              {mode === 'register' && field('confirmation', 'Confirme a senha')}
              <Button title={titles[mode]} disabled={busy} onPress={submit} />
              {mode === 'login' ? (
                <>
                  <Button title="Criar conta" disabled={busy} onPress={() => changeMode('register')} />
                  <Button title="Esqueci minha senha" disabled={busy} onPress={() => changeMode('reset')} />
                </>
              ) : <Button title="Voltar para o login" disabled={busy} onPress={() => changeMode('login')} />}
            </>
          )}
          {busy && <ActivityIndicator />}
          {!!message && <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101422' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12, width: '100%', maxWidth: 520, alignSelf: 'center' },
  title: { color: '#f4f5ff', fontSize: 36, fontWeight: '700' },
  text: { color: '#bec6de', fontSize: 16 },
  input: { color: '#f4f5ff', borderColor: '#7886a6', borderWidth: 1, borderRadius: 8, padding: 12 },
  invalid: { borderColor: '#ff9aab' },
  error: { color: '#ff9aab' },
});
