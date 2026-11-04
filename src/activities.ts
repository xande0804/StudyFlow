import { collection, doc, getFirestore, onSnapshot, runTransaction } from 'firebase/firestore';
import { app } from './firebaseConnection';

export type Reminder = 'threeDays' | 'oneDay' | 'oneHour' | 'off';

export function reminderTime(activity: Pick<Activity, 'date' | 'time' | 'reminder'>) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(activity.date)) return null;
  if (activity.reminder === 'off' || (!activity.time && activity.reminder === 'oneHour')) return null;
  const [year, month, day] = activity.date.split('-').map(Number);
  const [hour, minute] = activity.time ? activity.time.split(':').map(Number) : [9, 0];
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, 0, 0);
  const days = activity.reminder === 'threeDays' ? 3 : 1;
  if (activity.time) return date.getTime() - (activity.reminder === 'oneHour' ? 1 : days * 24) * 3600000;
  date.setDate(date.getDate() - days);
  return date.getTime();
}

export type Activity = {
  id: string; kind: 'task' | 'exam'; title: string; subjectId: string;
  date: string; time: string; description: string; done: boolean; reminder: Reminder;
};

function refs(uid: string) {
  if (!app) throw new Error('Firebase indisponível.');
  const db = getFirestore(app);
  return { db, items: collection(db, 'users', uid, 'activities'), subjects: collection(db, 'users', uid, 'subjects') };
}

export function watchActivities(uid: string, receive: (items: Activity[] | null) => void) {
  return onSnapshot(refs(uid).items, { includeMetadataChanges: true }, (snapshot) => {
    receive(snapshot.metadata.fromCache ? null : snapshot.docs.map((item) => ({ reminder: 'oneDay', ...item.data(), id: item.id }) as Activity)
      .sort((a, b) => (a.date + (a.time || '23:59')).localeCompare(b.date + (b.time || '23:59'))));
  }, () => receive(null));
}

export async function saveActivity(uid: string, activity: Activity) {
  const { id, ...data } = activity;
  const title = data.title.trim();
  const parsed = new Date(data.date + 'T00:00:00Z');
  if (!title || title.length > 120 || !data.subjectId || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
    || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== data.date
    || (data.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(data.time))
    || data.description.length > 1000) {
    throw new Error('Confira o título, a matéria, a data e o horário.');
  }
  if (data.reminder === 'oneHour' && !data.time) throw new Error('Informe o horário para lembrar uma hora antes.');
  const { db, items, subjects } = refs(uid);
  const item = id ? doc(items, id) : doc(items);
  await runTransaction(db, async (transaction) => {
    const previous = id ? await transaction.get(item) : undefined;
    if (previous && !previous.exists()) throw new Error('Atividade removida.');
    const subjectRef = doc(subjects, data.subjectId);
    const subject = await transaction.get(subjectRef);
    if (!subject.exists()) throw new Error('A matéria foi removida.');
    if (previous?.data()?.subjectId !== data.subjectId) {
      transaction.update(subjectRef, { linkVersion: (subject.data().linkVersion ?? 0) + 1 });
    }
    transaction.set(item, { ...data, title, done: previous?.data()?.done ?? false });
  });
}

export async function changeActivity(uid: string, id: string, done?: boolean) {
  const { db, items } = refs(uid);
  const item = doc(items, id);
  await runTransaction(db, async (transaction) => {
    if (!(await transaction.get(item)).exists()) throw new Error('Atividade removida.');
    if (done === undefined) transaction.delete(item);
    else transaction.update(item, { done });
  });
}
