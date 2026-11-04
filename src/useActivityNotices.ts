import { useEffect } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import { reminderTime, watchActivities, type Activity } from './activities';
import { reconcileNotices, supportsNotices, type ScheduledNotice } from './notices';

export function useActivityNotices(uid: string | undefined) {
  useEffect(() => {
    if (!uid || !supportsNotices) return;
    let latest: Activity[] | null = null;
    function refresh() {
      if (!latest) return;
      const desired = latest.flatMap((activity): ScheduledNotice[] => {
        const at = activity.done ? null : reminderTime(activity);
        return at === null ? [] : [{ id: 'activity:' + uid + ':' + activity.id, title: activity.title,
          body: activity.kind === 'exam' ? 'Lembrete de prova' : 'Lembrete de tarefa', at }];
      });
      reconcileNotices('activity:' + uid, desired).catch((error) => console.warn('StudyFlow lembretes:', error));
    }
    const unsubscribe = watchActivities(uid, (items) => {
      if (!items) return;
      latest = items;
      refresh();
    });
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    const permission = DeviceEventEmitter.addListener('studyflow-notice-permission', refresh);
    return () => {
      permission.remove();
      unsubscribe();
      subscription.remove();
      reconcileNotices('activity:' + uid, []).catch((error) => console.warn('StudyFlow lembretes:', error));
    };
  }, [uid]);
}
