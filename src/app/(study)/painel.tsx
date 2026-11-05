import { useRouter } from 'expo-router';
import { Button } from '../../Button';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { watchActivities, type Activity } from '../../activities';
import { useSession } from '../../session';
import { watchSubjects, type Subject } from '../../subjects';

function localDate(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value, index) => String(value).padStart(index === 0 ? 4 : 2, '0')).join('-');
}

function deadline(item: Activity) {
  const [year, month, day] = item.date.split('-').map(Number);
  const [hour, minute] = item.time ? item.time.split(':').map(Number) : [23, 59];
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, item.time ? 0 : 59, item.time ? 0 : 999);
  return date.getTime();
}

export default function DashboardScreen() {
  const { user } = useSession();
  return user ? <Dashboard key={user.uid} uid={user.uid} /> : null;
}

function Dashboard({ uid }: { uid: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Activity[] | null>();
  const [subjects, setSubjects] = useState<Subject[] | null>();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => watchActivities(uid, setItems), [uid]);
  useEffect(() => watchSubjects(uid, setSubjects, () => setSubjects(null)), [uid]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = localDate(now);
  const lastDay = new Date(now);
  lastDay.setDate(lastDay.getDate() + 6);
  const end = localDate(lastDay);
  const pending = (items ?? []).filter((item) => !item.done).sort((a, b) => deadline(a) - deadline(b));
  const isLate = (item: Activity) => deadline(item) < now.getTime();
  const upcoming = pending.filter((item) => !isLate(item));
  const sections = [
    { title: 'Atrasados', entries: pending.filter(isLate) },
    { title: 'Tarefas de hoje', entries: upcoming.filter((item) => item.kind === 'task' && item.date === today) },
    { title: 'Próximas provas', entries: upcoming.filter((item) => item.kind === 'exam') },
    { title: 'Outros compromissos nos próximos sete dias', entries: upcoming.filter((item) => item.kind === 'task' && item.date > today && item.date <= end) },
  ];

  const online = Boolean(items && subjects);
  const late = pending.filter(isLate).length;
  const dueToday = upcoming.filter((item) => item.date === today).length;
  const completed = (items ?? []).filter((item) => item.done).length;
  const stats = [
    { label: 'PENDENTES', value: pending.length, color: '#c5b6ff', note: 'para organizar' },
    { label: 'ATRASADOS', value: late, color: '#ffa5b5', note: late ? 'precisam de atenção' : 'tudo em dia' },
    { label: 'PARA HOJE', value: dueToday, color: '#89dfcb', note: 'na sua agenda' },
    { label: 'CONCLUÍDOS', value: completed, color: '#e9d19d', note: 'no seu histórico' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>SEU ESPAÇO DE ESTUDO</Text>
        <Text accessibilityRole="header" style={styles.heroTitle}>Um passo de cada vez.</Text>
        <Text style={styles.subtitle}>Organize os próximos prazos e encontre espaço para focar.</Text>
        <View style={styles.heroActions}>
          <Button variant="primary" title="Ver atividades" onPress={() => router.push('/atividades')} />
          <Button title="Iniciar um foco" onPress={() => router.push('/pomodoro')} />
        </View>
      </View>
      {!online ? <Text style={styles.text}>
        {items === undefined || subjects === undefined ? 'Carregando sua agenda…' : 'Painel indisponível. Confira a conexão.'}
      </Text> : (
        <>
          <View style={styles.stats}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.number, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statNote}>{stat.note}</Text>
              </View>
            ))}
          </View>
          <View style={styles.agendaHeader}>
            <Text accessibilityRole="header" style={styles.heading}>Sua agenda</Text>
            <Text style={styles.statNote}>{subjects?.length} matérias</Text>
          </View>
          <View style={styles.sections}>
            {sections.map(({ title, entries }, index) => (
              <View key={title} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.dot, { backgroundColor: stats[index].color }]} />
                  <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
                  <Text style={styles.badge}>{entries.length}</Text>
                </View>
                {entries.length === 0 && <Text style={styles.empty}>Nenhum compromisso por aqui.</Text>}
                {entries.map((item) => {
                  const subject = subjects?.find((subject) => subject.id === item.subjectId);
                  return (
                    <View key={item.id} style={styles.card}>
                      <View style={[styles.subjectMark, { backgroundColor: subject?.color || '#b9a5ff' }]} />
                      <View style={styles.cardBody}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.text}>{subject?.name} · {item.kind === 'exam' ? 'Prova' : 'Tarefa'}</Text>
                      </View>
                      <View style={styles.date}>
                        <Text style={styles.dateText}>{item.date.split('-').reverse().slice(0, 2).join('/')}</Text>
                        <Text style={styles.statNote}>{item.time || 'Sem horário'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#0e1220' },
  content: { padding: 24, paddingBottom: 48, gap: 24, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  hero: { gap: 12, paddingVertical: 12 },
  eyebrow: { color: '#b9a5ff', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  heroTitle: { color: '#f5f3ff', fontSize: 34, fontWeight: '700', letterSpacing: -1 },
  subtitle: { color: '#9ca8c2', fontSize: 16, lineHeight: 25, maxWidth: 500 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexBasis: 145, flexGrow: 1, padding: 20, gap: 6, backgroundColor: '#171e30', borderRadius: 18, borderWidth: 1, borderColor: '#283149' },
  statLabel: { color: '#b3bed5', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  number: { fontSize: 38, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statNote: { color: '#a2aec6', fontSize: 12 },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  heading: { color: '#f4f5ff', fontSize: 23, fontWeight: '600', letterSpacing: -0.5 },
  sections: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  section: { flexBasis: 380, flexGrow: 1, flexShrink: 1, backgroundColor: '#141a2a', padding: 18, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: '#242e45' },
  sectionHeader: { flexDirection: 'row', gap: 9, alignItems: 'center', minHeight: 28 },
  sectionTitle: { flex: 1, color: '#e3e7f2', fontSize: 15, fontWeight: '600' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badge: { color: '#c6b9f7', backgroundColor: '#26243c', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, fontSize: 12 },
  title: { color: '#f4f5ff', fontSize: 15, fontWeight: '600' },
  text: { color: '#a2aec6', fontSize: 13, lineHeight: 21 },
  empty: { color: '#8694b1', fontSize: 13, paddingVertical: 16 },
  card: { paddingVertical: 12, gap: 12, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#263047' },
  cardBody: { flex: 1, gap: 4 },
  subjectMark: { width: 4, height: 32, borderRadius: 3 },
  date: { alignItems: 'flex-end', gap: 4 },
  dateText: { color: '#dce2f0', fontSize: 14, fontWeight: '600' },
});
