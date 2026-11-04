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
  const sections = [
    { title: 'Atrasados', entries: pending.filter(isLate) },
    { title: 'Tarefas de hoje', entries: pending.filter((item) => item.kind === 'task' && item.date === today) },
    { title: 'Próximas provas', entries: pending.filter((item) => item.kind === 'exam' && !isLate(item)) },
    { title: 'Próximos sete dias', entries: pending.filter((item) => item.date >= today && item.date <= end) },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {items === undefined || subjects === undefined ? <Text style={styles.text}>Carregando painel…</Text>
        : !items || !subjects ? <Text style={styles.text}>Painel indisponível. Confira a conexão.</Text>
        : sections.map(({ title, entries }) => (
          <View key={title} style={styles.section}>
            <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
            {entries.length === 0 && <Text style={styles.text}>Nenhuma atividade.</Text>}
            {entries.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.text}>
                  {subjects.find((subject) => subject.id === item.subjectId)?.name} · {item.date.split('-').reverse().join('/')}
                  {item.time ? ' · ' + item.time : ''}
                </Text>
              </View>
            ))}
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#101422' },
  content: { padding: 24, gap: 24, maxWidth: 620, width: '100%', alignSelf: 'center' },
  section: { gap: 10 },
  heading: { color: '#f4f5ff', fontSize: 22, fontWeight: '700' },
  title: { color: '#f4f5ff', fontSize: 16, fontWeight: '600' },
  text: { color: '#bec6de', fontSize: 15 },
  card: { padding: 12, gap: 4, backgroundColor: '#182035', borderRadius: 10 },
});
