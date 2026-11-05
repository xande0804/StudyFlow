import { Button } from '../../Button';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
const displayClock = (date: Date) => date.toLocaleString('pt-BR', {
  dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23',
});
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
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [detailId, setDetailId] = useState('');
  const detail = items?.find((item) => item.id === detailId);

  function openForm(item?: Activity) {
    setMessage('');
    setDescriptionOpen(Boolean(item?.description));
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

  function field(key: 'title' | 'date' | 'time' | 'description', label: string, placeholder: string, limit: number) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} placeholder={placeholder} placeholderTextColor="#7f8da9"
          style={[styles.input, key === 'description' && styles.descriptionInput]}
          maxLength={limit} value={form[key]} editable={!busy} multiline={key === 'description'}
          inputMode={key === 'date' || key === 'time' ? 'numeric' : 'text'}
          onChangeText={(value) => setForm((current) => ({
            ...current, [key]: key === 'date' || key === 'time' ? formatScheduleInput(key, value) : value,
          }))} />
      </View>
    );
  }

  const visible = (items ?? []).filter((item) => filter === 'all' || filter === item.kind);
  const online = Boolean(items && subjects);
  const draft = { ...form, date: form.date.split('/').reverse().join('-') };
  const remindAt = reminderTime(draft);
  const reminderPassed = remindAt !== null && remindAt <= Date.now();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Seus próximos passos, com espaço para cada conquista.</Text>
      <Button variant="primary" title="Nova atividade" disabled={!online || !subjects?.length} onPress={() => openForm()} />
      <Modal visible={formOpen} transparent animationType="fade" onRequestClose={() => { if (!busy) setFormOpen(false); }}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View accessibilityViewIsModal style={styles.formShell}>
            <View style={styles.formHeader}>
              <View style={styles.headerText}>
                <Text accessibilityRole="header" style={styles.heading}>
                  {form.id ? 'Editar' : 'Nova'} {form.kind === 'exam' ? 'prova' : 'tarefa'}
                </Text>
                <Text style={styles.hint}>Organize o que precisa fazer e quando entregar.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar formulário" disabled={busy}
                onPress={() => setFormOpen(false)} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.formBody} contentContainerStyle={styles.formBodyContent} keyboardShouldPersistTaps="handled">
              {!online && <Text style={styles.feedback}>{items === undefined || subjects === undefined ? 'Carregando…' : 'Dados indisponíveis. Confira a conexão.'}</Text>}
              {subjects?.length === 0 && <Text style={styles.feedback}>Cadastre uma matéria para criar atividades.</Text>}
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>SOBRE A ATIVIDADE</Text>
                <View style={styles.row}>
                  <Button title="Tarefa" selected={form.kind === 'task'} disabled={busy} onPress={() => setForm({ ...form, kind: 'task' })} />
                  <Button title="Prova" selected={form.kind === 'exam'} disabled={busy} onPress={() => setForm({ ...form, kind: 'exam' })} />
                </View>
                {field('title', 'Título *', form.kind === 'exam' ? 'Ex.: Prova do primeiro bimestre' : 'Ex.: Entregar lista de exercícios', 120)}
                <Text style={styles.label}>Matéria *</Text>
                <View style={styles.row}>
                  {subjects?.map((subject) => {
                    const selected = form.subjectId === subject.id;
                    return (
                      <Pressable key={subject.id} accessibilityRole="button" accessibilityLabel={'Matéria ' + subject.name}
                        accessibilityState={{ selected, disabled: busy }} aria-pressed={selected} disabled={busy}
                        onPress={() => setForm({ ...form, subjectId: subject.id })}
                        style={[styles.subjectChoice, selected && { borderColor: subject.color, backgroundColor: subject.color + '18' }]}>
                        <View style={[styles.subjectDot, { backgroundColor: subject.color }]} />
                        <Text style={[styles.choiceLabel, selected && { color: '#f4f5ff' }]}>{subject.name}</Text>
                        {selected && <Text style={{ color: subject.color }}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>PRAZO</Text>
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleField}>
                    {field('date', 'Data *', 'DD/MM/AAAA', 10)}
                    <View style={styles.row}>
                      <Button title="Hoje" disabled={busy} onPress={() => setForm((current) => ({ ...current, date: relativeDate(0) }))} />
                      <Button title="Amanhã" disabled={busy} onPress={() => setForm((current) => ({ ...current, date: relativeDate(1) }))} />
                    </View>
                  </View>
                  <View style={styles.scheduleField}>
                    {field('time', 'Horário · opcional', 'HH:MM', 5)}
                    <Text style={styles.hint}>Formato de 24 horas.</Text>
                  </View>
                </View>
              </View>
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>LEMBRETE</Text>
                <Text style={styles.hint}>Quando você quer receber o aviso?</Text>
                <View style={styles.reminderOptions}>
                  {reminders.map(({ value, label }) => (
                    <View key={value} style={styles.reminderOption}>
                      <Button title={value === 'off' ? 'Sem lembrete' : label} selected={form.reminder === value}
                        disabled={busy || (value === 'oneHour' && !form.time)}
                        onPress={() => setForm({ ...form, reminder: value })} />
                    </View>
                  ))}
                </View>
                {!form.time && <Text style={styles.hint}>O lembrete de 1 hora precisa de um horário.</Text>}
                {!form.done && remindAt !== null && Number.isFinite(remindAt) && (
                  <Text style={styles.hint}>
                    {reminderPassed ? 'O horário desse lembrete já passou.' : 'Aviso previsto para ' + displayClock(new Date(remindAt)) + '.'}
                  </Text>
                )}
              </View>
              <View style={styles.formSection}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: descriptionOpen }}
                  disabled={busy} onPress={() => setDescriptionOpen(!descriptionOpen)} style={styles.descriptionToggle}>
                  <Text style={styles.label}>{descriptionOpen ? '−' : '+'} Descrição opcional</Text>
                </Pressable>
                {descriptionOpen && field('description', 'Descrição', 'Detalhes, capítulos ou orientações para esta atividade.', 1000)}
              </View>
            </ScrollView>
            <View style={styles.formFooter}>
              {!!message && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{message}</Text>}
              <Text style={styles.hint}>* Campos obrigatórios</Text>
              <View style={styles.footerActions}>
                <Button title="Cancelar" disabled={busy} onPress={() => setFormOpen(false)} />
                <Button variant="primary" title={busy ? 'Salvando…' : 'Salvar atividade'} disabled={busy || !online || !subjects?.length}
                  onPress={() => perform(() => saveActivity(uid, draft), () => { setFormOpen(false); setForm(empty); setMessage('Atividade salva.'); })} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
        {filters.map(({ value, label }) => <Button key={value} title={label} selected={filter === value} onPress={() => setFilter(value)} />)}
      </View>
      {online && [false, true].map((done) => (
        <View key={String(done)} style={styles.group}>
          <Text style={styles.heading}>{done ? 'Histórico' : 'Pendentes'}</Text>
          {!visible.some((item) => item.done === done) && <Text style={styles.text}>Nenhuma atividade.</Text>}
          {visible.filter((item) => item.done === done).map((item) => {
            const subject = subjects?.find((subject) => subject.id === item.subjectId);
            return (
            <View key={item.id} style={[styles.card, { borderLeftColor: subject?.color || '#b9a5ff', borderLeftWidth: 4 }]}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${item.title}`} onPress={() => setDetailId(item.id)}>
                <Text style={styles.activityTitle}>{item.title}</Text>
              </Pressable>
              <View style={styles.cardMeta}>
                <View style={[styles.subjectBadge, { backgroundColor: (subject?.color || '#b9a5ff') + '18' }]}>
                  <View style={[styles.subjectDot, { backgroundColor: subject?.color || '#b9a5ff' }]} />
                  <Text style={[styles.badgeText, { color: subject?.color || '#b9a5ff' }]}>{subject?.name}</Text>
                </View>
                <Text style={styles.hint}>{item.kind === 'exam' ? 'Prova' : 'Tarefa'} · {formatDate(item.date)} {item.time}</Text>
              </View>
              {!!item.description && <Text style={styles.text}>{item.description}</Text>}
              {confirm === item.id ? (
                <>
                  <Text style={styles.text}>Excluir definitivamente esta atividade?</Text>
                  <View style={styles.row}>
                    <Button title="Cancelar" disabled={busy} onPress={() => setConfirm('')} />
                    <Button variant="danger" title="Confirmar exclusão" disabled={busy} onPress={() => perform(
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
                  <Button variant="danger" title="Excluir" disabled={busy} onPress={() => setConfirm(item.id)} />
                </View>
              )}
            </View>
          ); })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formShell: { width: '100%', maxWidth: 600, maxHeight: '94%', backgroundColor: '#171e30', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#303b55' },
  formHeader: { padding: 22, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#2b354c' },
  headerText: { flex: 1, gap: 6 },
  close: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#242d43', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 25, color: '#bdc7dc', lineHeight: 28 },
  formBody: { flexShrink: 1 },
  formBodyContent: { paddingHorizontal: 22 },
  formSection: { paddingVertical: 20, gap: 12, borderBottomWidth: 1, borderBottomColor: '#29334b' },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: '#b3a4df' },
  label: { fontSize: 14, color: '#e3e7f3', fontWeight: '600' },
  hint: { fontSize: 12, color: '#a2aec6', lineHeight: 19 },
  feedback: { fontSize: 14, color: '#ffc3ca', lineHeight: 21, paddingVertical: 12 },
  subjectChoice: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, gap: 9, borderWidth: 1, borderColor: '#34405b', borderRadius: 12, minHeight: 44 },
  subjectDot: { width: 7, height: 7, borderRadius: 4 },
  choiceLabel: { color: '#adb9d0', fontSize: 14, flexShrink: 1 },
  scheduleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  scheduleField: { flexBasis: 190, flexGrow: 1, flexShrink: 1, gap: 10 },
  reminderOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reminderOption: { flexBasis: 180, flexGrow: 1, flexShrink: 1 },
  descriptionInput: { minHeight: 90, textAlignVertical: 'top' },
  descriptionToggle: { paddingVertical: 6, minHeight: 38, justifyContent: 'center' },
  formFooter: { borderTopWidth: 1, borderTopColor: '#2b354c', padding: 18, gap: 10 },
  footerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  activityTitle: { fontSize: 18, fontWeight: '600', color: '#f4f5ff', lineHeight: 25 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  subjectBadge: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8, gap: 6, alignItems: 'center', flexDirection: 'row' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  intro: { color: '#9ca8c2', fontSize: 15, lineHeight: 24, marginBottom: 4 },
  screen: { backgroundColor: '#0e1220' },
  content: { padding: 24, gap: 12, maxWidth: 800, width: '100%', alignSelf: 'center' },
  heading: { color: '#f4f5ff', fontSize: 24, fontWeight: '700' },
  text: { color: '#bec6de', fontSize: 16 },
  input: { color: '#f4f5ff', borderColor: '#34405b', borderWidth: 1, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { gap: 5 },
  group: { gap: 10 },
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#000a' },
  modal: { flexGrow: 0, maxHeight: '90%', width: '100%', maxWidth: 560, borderRadius: 22, backgroundColor: '#171e30' },
  modalContent: { padding: 20 },
  card: { padding: 20, gap: 12, backgroundColor: '#171e30', borderColor: '#283149', borderWidth: 1, borderRadius: 18 },
});
