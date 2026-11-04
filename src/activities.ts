import { collection, doc, getFirestore, onSnapshot, runTransaction } from 'firebase/firestore';
import { app } from './firebaseConnection';

export type Activity = {
  id: string; kind: 'task' | 'exam'; title: string; subjectId: string;
  date: string; time: string; description: string; done: boolean;
};

function refs(uid: string) {
  if (!app) throw new Error('Firebase indisponível.');
  const db = getFirestore(app);
  return { db, items: collection(db, 'users', uid, 'activities'), subjects: collection(db, 'users', uid, 'subjects') };
}

export function watchActivities(uid: string, receive: (items: Activity[] | null) => void) {
  return onSnapshot(refs(uid).items, { includeMetadataChanges: true }, (snapshot) => {
    receive(snapshot.metadata.fromCache ? null : snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Activity)
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
  const { db, items, subjects } = refs(uid);
  const item = id ? doc(items, id) : doc(items);
  await runTransaction(db, async (transaction) => {
    if (id && !(await transaction.get(item)).exists()) throw new Error('Atividade removida.');
    if (!(await transaction.get(doc(subjects, data.subjectId))).exists()) throw new Error('A matéria foi removida.');
    transaction.set(item, { ...data, title, done: id ? data.done : false });
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
