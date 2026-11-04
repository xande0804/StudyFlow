import { useEffect, useState } from 'react';
import { Button, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { changeActivity, reminderTime, saveActivity, watchActivities, type Activity } from '../../activities';
import { useSession } from '../../session';
import { watchSubjects, type Subject } from '../../subjects';

const empty: Activity = { id: '', kind: 'task', title: '', subjectId: '', date: '', time: '', description: '', done: false, reminder: 'oneDay' };
const reminders = [
  { value: 'threeDays', label: '3 dias antes' },
  { value: 'oneDay', label: '1 dia antes' },
  { value: 'oneHour', label: '1 hora antes' },
  { value: 'off', label: 'Desativado' },
] as const;
const filters = [{ value: 'all', label: 'Tudo' }, { value: 'task', label: 'Tarefas' }, { value: 'exam', label: 'Provas' }] as const;
const formatDate = (date: string) => date.split('-').reverse().join('/');
function formatScheduleInput(field: 'date' | 'time', input: string) {
  const digits = input.replace(/\D/g, '').slice(0, field === 'date' ? 8 : 4);
  const parts = [digits.slice(0, 2), digits.slice(2, 4)];
  if (field === 'date') parts.push(digits.slice(4));
  return parts.filter(Boolean).join(field === 'date' ? '/' : ':');
}

function relativeDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatScheduleInput('date', [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear()),
  ].join(''));
}

const fields = [
  { key: 'title', label: 'Título', placeholder: 'Ex.: Revisar matemática', limit: 120 },
  { key: 'date', label: 'Data (DD/MM/AAAA)', placeholder: 'Ex.: 10112026', limit: 10 },
  { key: 'time', label: 'Horário opcional (HH:MM)', placeholder: 'Ex.: 1430', limit: 5 },
  { key: 'description', label: 'Descrição opcional', placeholder: 'Ex.: Revisar os capítulos 2 e 3', limit: 1000 },
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
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState('');
  const detail = items?.find((item) => item.id === detailId);

  function openForm(item?: Activity) {
    setMessage('');
    setDetailId('');
    setForm(item ? { ...item, date: formatDate(item.date) } : empty);
    setFormOpen(true);
  }
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
  const draft = { ...form, date: form.date.split('/').reverse().join('-') };
  const remindAt = reminderTime(draft);
  const reminderPassed = !form.done && remindAt !== null && remindAt <= Date.now();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Button title="Nova atividade" disabled={!online || !subjects?.length} onPress={() => openForm()} />
      <Modal visible={formOpen} transparent animationType="fade" onRequestClose={() => { if (!busy) setFormOpen(false); }}>
        <View style={styles.backdrop}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View accessibilityViewIsModal style={styles.group}>
              <Text style={styles.heading}>{form.id ? 'Editar atividade' : 'Nova atividade'}</Text>
              {!online && <Text style={styles.text}>{items === undefined || subjects === undefined ? 'Carregando…' : 'Dados indisponíveis. Confira a conexão.'}</Text>}
              {subjects?.length === 0 && <Text style={styles.text}>Cadastre uma matéria para criar atividades.</Text>}
              <View style={styles.row}>
                <Button title="Tarefa" disabled={busy || form.kind === 'task'} onPress={() => setForm({ ...form, kind: 'task' })} />
                <Button title="Prova" disabled={busy || form.kind === 'exam'} onPress={() => setForm({ ...form, kind: 'exam' })} />
              </View>
              {fields.map(({ key, label, placeholder, limit }) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.text}>{label}</Text>
                  <TextInput accessibilityLabel={label} placeholder={placeholder} placeholderTextColor="#a0abc7" style={styles.input} maxLength={limit}
                    value={form[key]} editable={!busy} multiline={key === 'description'}
                    inputMode={key === 'date' || key === 'time' ? 'numeric' : 'text'}
                    onChangeText={(value) => setForm((current) => ({
                      ...current, [key]: key === 'date' || key === 'time' ? formatScheduleInput(key, value) : value,
                    }))} />
                  {key === 'date' && (
                    <View style={styles.row}>
                      <Button title="Hoje" disabled={busy} onPress={() => setForm((current) => ({ ...current, date: relativeDate(0) }))} />
                      <Button title="Amanhã" disabled={busy} onPress={() => setForm((current) => ({ ...current, date: relativeDate(1) }))} />
                    </View>
                  )}
                </View>
              ))}
              <Text style={styles.text}>Matéria</Text>
              <View style={styles.row}>
                {subjects?.map((subject) => (
                  <Button key={subject.id} title={subject.name} disabled={busy || form.subjectId === subject.id}
                    onPress={() => setForm({ ...form, subjectId: subject.id })} />
                ))}
              </View>
              <Text style={styles.text}>Lembrete</Text>
              <View style={styles.row}>
                {reminders.map(({ value, label }) => (
                  <Button key={value} title={label} disabled={busy || form.reminder === value}
                    onPress={() => setForm({ ...form, reminder: value })} />
                ))}
              </View>
              {reminderPassed && <Text style={styles.text}>O horário desse lembrete já passou.</Text>}
              <Button title="Salvar atividade" disabled={busy || !online || !subjects?.length}
                onPress={() => perform(() => saveActivity(uid, draft), () => { setFormOpen(false); setForm(empty); setMessage('Atividade salva.'); })} />
              <Button title="Cancelar" disabled={busy} onPress={() => setFormOpen(false)} />
              {!!message && <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
            </View>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={Boolean(detail)} transparent animationType="fade" onRequestClose={() => setDetailId('')}>
        <View style={styles.backdrop}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <View accessibilityViewIsModal style={styles.group}>
              <Text accessibilityRole="header" style={styles.heading}>{detail?.title}</Text>
              <Text style={styles.text}>{detail?.kind === 'exam' ? 'Prova' : 'Tarefa'} · {detail?.done ? 'Histórico' : 'Pendente'}</Text>
              <Text style={styles.text}>{subjects?.find((subject) => subject.id === detail?.subjectId)?.name}</Text>
              <Text style={styles.text}>{detail && formatDate(detail.date)} {detail?.time}</Text>
              <Text style={styles.text}>Lembrete: {reminders.find((option) => option.value === detail?.reminder)?.label}</Text>
              {!!detail?.description && <Text style={styles.text}>{detail.description}</Text>}
              <Button title="Editar atividade" onPress={() => { if (detail) openForm(detail); }} />
              <Button title="Fechar detalhes" onPress={() => setDetailId('')} />
            </View>
          </ScrollView>
        </View>
      </Modal>
      {!formOpen && !!message && <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
      <View style={styles.row}>
        {filters.map(({ value, label }) => <Button key={value} title={label} disabled={filter === value} onPress={() => setFilter(value)} />)}
      </View>
      {online && [false, true].map((done) => (
        <View key={String(done)} style={styles.group}>
          <Text style={styles.heading}>{done ? 'Histórico' : 'Pendentes'}</Text>
          {!visible.some((item) => item.done === done) && <Text style={styles.text}>Nenhuma atividade.</Text>}
          {visible.filter((item) => item.done === done).map((item) => (
            <View key={item.id} style={styles.card}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${item.title}`} onPress={() => setDetailId(item.id)}>
                <Text style={styles.text}>{item.title}</Text>
              </Pressable>
              <Text style={styles.text}>{item.kind === 'exam' ? 'Prova' : 'Tarefa'} · {subjects?.find((subject) => subject.id === item.subjectId)?.name} · {formatDate(item.date)} {item.time}</Text>
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
                  <Button title="Editar" disabled={busy} onPress={() => openForm(item)} />
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
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#000a' },
  modal: { flexGrow: 0, maxHeight: '90%', width: '100%', maxWidth: 560, borderRadius: 16, backgroundColor: '#182035' },
  modalContent: { padding: 20 },
  card: { padding: 12, gap: 8, borderColor: '#7886a6', borderWidth: 1, borderRadius: 8 },
});
