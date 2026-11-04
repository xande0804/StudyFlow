import { useEffect, useState } from 'react';
import { Button, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { saveSubject, subjectColors, watchSubjects, type Subject } from './subjects';

const empty = { name: '', teacher: '', color: subjectColors[0] };
const colorNames = ['Lilás', 'Verde', 'Rosa', 'Amarelo'];

export function SubjectsPanel({ uid }: { uid: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string>();
  const [availability, setAvailability] = useState('Carregando matérias…');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => watchSubjects(uid, (items) => {
    setSubjects(items);
    setAvailability('');
  }, () => setAvailability('Matérias indisponíveis. Confira a conexão.')), [uid]);

  function reset() {
    setForm(empty);
    setEditing(undefined);
    setMessage('');
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      await saveSubject(uid, form, editing);
      reset();
      setOpen(false);
      setMessage('Matéria salva.');
    } catch (error) {
      const detail = error instanceof Error && !('code' in error) ? error.message : 'Falha ao salvar. Tente novamente.';
      setMessage(detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>Matérias</Text>
      <Button title="Nova matéria" disabled={Boolean(availability)} onPress={() => { reset(); setOpen(true); }} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => { if (!saving) setOpen(false); }}>
        <View style={styles.backdrop}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View accessibilityViewIsModal style={styles.panel}>
              <Text style={styles.text}>{editing ? 'Editar matéria' : 'Nova matéria'}</Text>
              <TextInput accessibilityLabel="Nome da matéria" placeholder="Nome da matéria" placeholderTextColor="#bec6de" style={styles.input}
                editable={!saving} maxLength={60} value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
              <TextInput accessibilityLabel="Professor opcional" placeholder="Professor (opcional)" placeholderTextColor="#bec6de" style={styles.input}
                editable={!saving} maxLength={80} value={form.teacher} onChangeText={(teacher) => setForm({ ...form, teacher })} />
              <View style={styles.colors}>
                {subjectColors.map((color, index) => (
                  <Pressable key={color} accessibilityRole="button" accessibilityLabel={colorNames[index]}
                    accessibilityState={{ selected: form.color === color }} disabled={saving}
                    onPress={() => setForm({ ...form, color })}
                    style={[styles.color, { backgroundColor: color, borderColor: form.color === color ? '#fff' : 'transparent' }]} />
                ))}
              </View>
              <Button title={saving ? 'Salvando…' : 'Salvar matéria'} disabled={saving || Boolean(availability)} onPress={save} />
              <Button title="Cancelar" disabled={saving} onPress={() => setOpen(false)} />
              {!!message && <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
            </View>
          </ScrollView>
        </View>
      </Modal>
      {!open && !!message && <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>}
      {availability ? <Text style={styles.text}>{availability}</Text> : subjects.length === 0 ? (
        <Text style={styles.text}>Nenhuma matéria cadastrada.</Text>
      ) : subjects.map((subject) => (
        <Pressable key={subject.id} accessibilityRole="button" accessibilityLabel={`Editar ${subject.name}`} disabled={saving}
          style={[styles.input, { borderLeftColor: subject.color, borderLeftWidth: 5 }]}
          onPress={() => {
            setOpen(true);
            setEditing(subject.id);
            setForm({ name: subject.name, teacher: subject.teacher, color: subject.color });
            setMessage('');
          }}>
          <Text style={styles.text}>{subject.name}</Text>
          {!!subject.teacher && <Text style={styles.text}>{subject.teacher}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#000a' },
  modal: { flexGrow: 0, maxHeight: '90%', width: '100%', maxWidth: 560, borderRadius: 16, backgroundColor: '#182035' },
  modalContent: { padding: 20 },
  panel: { gap: 12 },
  heading: { color: '#f4f5ff', fontSize: 24, fontWeight: '700' },
  text: { color: '#bec6de', fontSize: 16 },
  input: { color: '#f4f5ff', borderColor: '#7886a6', borderWidth: 1, borderRadius: 8, padding: 12 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  color: { width: 44, height: 44, borderRadius: 22, borderWidth: 3 },
});
