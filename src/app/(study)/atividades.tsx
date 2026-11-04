import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { changeActivity, saveActivity, watchActivities, type Activity } from '../../activities';
import { useSession } from '../../session';
import { watchSubjects, type Subject } from '../../subjects';

const empty: Activity = { id: '', kind: 'task', title: '', subjectId: '', date: '', time: '', description: '', done: false };
const filters = [{ value: 'all', label: 'Tudo' }, { value: 'task', label: 'Tarefas' }, { value: 'exam', label: 'Provas' }] as const;
const fields = [
  { key: 'title', label: 'Título', limit: 120 },
  { key: 'date', label: 'Data (AAAA-MM-DD)', limit: 10 },
  { key: 'time', label: 'Horário opcional (HH:MM)', limit: 5 },
  { key: 'description', label: 'Descrição opcional', limit: 1000 },
] as const;

export default function ActivitiesScreen() {
  const { user } = useSession();
  return user ? <Activities key={user.uid} uid={user.uid} /> : null;
}

function Activities({ uid }: { uid: string }) {
  const [items, setItems] = useState<Activity[] | null>();
  const [subjects, setSubjects] = useState<Subject[] | null>();
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState<(typeof filters)[number]['value']>('all');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState('');
  useEffect(() => watchActivities(uid, setItems), [uid]);
  useEffect(() => watchSubjects(uid, setSubjects, () => setSubjects(null)), [uid]);

  async function perform(action: () => Promise<void>, success: () => void) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      success();
    } catch (error) {
      setMessage(error instanceof Error && !('code' in error) ? error.message : 'Não foi possível salvar. Confira a conexão.');
    } finally {
      setBusy(false);
    }
  }

  const visible = (items ?? []).filter((item) => filter === 'all' || filter === item.kind);
  const online = Boolean(items && subjects);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>{form.id ? 'Editar atividade' : 'Nova atividade'}</Text>
      {!online && <Text style={styles.text}>{items === undefined || subjects === undefined ? 'Carregando…' : 'Dados indisponíveis. Confira a conexão.'}</Text>}
      {subjects?.length === 0 && <Text style={styles.text}>Cadastre uma matéria para criar atividades.</Text>}
      <View style={styles.row}>
        <Button title="Tarefa" disabled={busy || form.kind === 'task'} onPress={() => setForm({ ...form, kind: 'task' })} />
        <Button title="Prova" disabled={busy || form.kind === 'exam'} onPress={() => setForm({ ...form, kind: 'exam' })} />
      </View>
      {fields.map(({ key, label, limit }) => (
        <View key={key} style={styles.field}>
          <Text style={styles.text}>{label}</Text>
          <TextInput accessibilityLabel={label} style={styles.input} maxLength={limit}
            value={form[key]} editable={!busy} multiline={key === 'description'}
            onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))} />
        </View>
      ))}
      <Text style={styles.text}>Matéria</Text>
      <View style={styles.row}>
        {subjects?.map((subject) => (
          <Button key={subject.id} title={subject.name} disabled={busy || form.subjectId === subject.id}
            onPress={() => setForm({ ...form, subjectId: subject.id })} />
        ))}
      </View>
      <Button title="Salvar atividade" disabled={busy || !online || !subjects?.length}
        onPress={() => perform(() => saveActivity(uid, form), () => { setForm(empty); setMessage('Atividade salva.'); })} />
      {!!form.id && <Button title="Cancelar edição" disabled={busy} onPress={() => setForm(empty)} />}
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
      <View style={styles.row}>
        {filters.map(({ value, label }) => <Button key={value} title={label} disabled={filter === value} onPress={() => setFilter(value)} />)}
      </View>
      {online && [false, true].map((done) => (
        <View key={String(done)} style={styles.group}>
          <Text style={styles.heading}>{done ? 'Histórico' : 'Pendentes'}</Text>
          {!visible.some((item) => item.done === done) && <Text style={styles.text}>Nenhuma atividade.</Text>}
          {visible.filter((item) => item.done === done).map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.text}>{item.title}</Text>
              <Text style={styles.text}>{item.kind === 'exam' ? 'Prova' : 'Tarefa'} · {subjects?.find((subject) => subject.id === item.subjectId)?.name} · {item.date} {item.time}</Text>
              {!!item.description && <Text style={styles.text}>{item.description}</Text>}
              {confirm === item.id ? (
                <>
                  <Text style={styles.text}>Excluir definitivamente esta atividade?</Text>
                  <View style={styles.row}>
                    <Button title="Cancelar" disabled={busy} onPress={() => setConfirm('')} />
                    <Button title="Confirmar exclusão" disabled={busy} onPress={() => perform(
                      () => changeActivity(uid, item.id), () => { setConfirm(''); if (form.id === item.id) setForm(empty); })} />
                  </View>
                </>
              ) : (
                <View style={styles.row}>
                  <Button title="Editar" disabled={busy} onPress={() => setForm(item)} />
                  <Button title={done ? 'Reabrir' : item.kind === 'exam' ? 'Marcar realizada' : 'Concluir'} disabled={busy}
                    onPress={() => perform(() => changeActivity(uid, item.id, !done), () => {
                      setForm((current) => current.id === item.id ? { ...current, done: !done } : current);
                    })} />
                  <Button title="Excluir" disabled={busy} onPress={() => setConfirm(item.id)} />
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#101422' },
  content: { padding: 24, gap: 12, maxWidth: 620, width: '100%', alignSelf: 'center' },
  heading: { color: '#f4f5ff', fontSize: 24, fontWeight: '700' },
  text: { color: '#bec6de', fontSize: 16 },
  input: { color: '#f4f5ff', borderColor: '#7886a6', borderWidth: 1, borderRadius: 8, padding: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { gap: 5 },
  group: { gap: 10 },
  card: { padding: 12, gap: 8, borderColor: '#7886a6', borderWidth: 1, borderRadius: 8 },
});
