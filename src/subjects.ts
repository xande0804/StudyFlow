import { collection, doc, getFirestore, onSnapshot, runTransaction } from 'firebase/firestore';
import { app } from './firebaseConnection';

export type Subject = { id: string; name: string; teacher: string; color: string; nameKey: string };
export const subjectColors = ['#818cf8', '#2dd4bf', '#fb7185', '#fbbf24'];

function database() {
  if (!app) throw new Error('Firebase indisponível.');
  return getFirestore(app);
}

export function watchSubjects(uid: string, onData: (subjects: Subject[]) => void, onError: () => void) {
  return onSnapshot(collection(database(), 'users', uid, 'subjects'), { includeMetadataChanges: true }, (snapshot) => {
    if (snapshot.metadata.fromCache) {
      onError();
      return;
    }
    onData(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as Subject)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
  }, onError);
}

export async function saveSubject(uid: string, values: Pick<Subject, 'name' | 'teacher' | 'color'>, id?: string) {
  const db = database();
  const name = values.name.trim().replace(/\s+/g, ' ');
  const teacher = values.teacher.trim();
  if (!name || name.length > 60 || teacher.length > 80 || !subjectColors.includes(values.color)) {
    throw new Error('Confira o nome, o professor e a cor da matéria.');
  }
  const nameKey = encodeURIComponent(name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());
  if (!nameKey) throw new Error('Informe um nome válido.');
  const subjects = collection(db, 'users', uid, 'subjects');
  const subject = id ? doc(subjects, id) : doc(subjects);
  const nameRef = doc(db, 'users', uid, 'subjectNames', nameKey);

  await runTransaction(db, async (transaction) => {
    const previous = id ? await transaction.get(subject) : undefined;
    if (previous && !previous.exists()) throw new Error('Esta matéria foi removida.');
    const reservation = await transaction.get(nameRef);
    if (reservation.exists() && reservation.data().subjectId !== subject.id) {
      throw new Error('Já existe uma matéria com esse nome.');
    }
    const previousKey = previous?.data()?.nameKey;
    if (previousKey && previousKey !== nameKey) {
      transaction.delete(doc(db, 'users', uid, 'subjectNames', previousKey));
    }
    if (!reservation.exists()) transaction.set(nameRef, { subjectId: subject.id });
    transaction.set(subject, { name, teacher, color: values.color, nameKey });
  });
}
