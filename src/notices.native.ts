import * as Notifications from 'expo-notifications';
import { DeviceEventEmitter, Platform } from 'react-native';
import type { ScheduledNotice } from './notices';

export const supportsNotices = true;
const channelId = 'studyflow-reminders';
let queue = Promise.resolve();

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: notification.request.content.data?.studyFlowKind !== 'pomodoro',
    shouldShowList: notification.request.content.data?.studyFlowKind !== 'pomodoro',
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'StudyFlow',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

function permitted(status: Notifications.NotificationPermissionsStatus) {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function requestNotices() {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  const allowed = permitted(current) || permitted(await Notifications.requestPermissionsAsync());
  DeviceEventEmitter.emit('studyflow-notice-permission');
  return allowed;
}

export function reconcileNotices(scope: string, desired: ScheduledNotice[]) {
  const job = queue.then(async () => {
    const allowed = desired.length > 0 && permitted(await Notifications.getPermissionsAsync());
    const future = new Map((allowed ? desired : []).filter((item) => item.at > Date.now()).map((item) => [item.id, item]));
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.content.data?.studyFlowScope !== scope) continue;
      const next = future.get(item.identifier);
      if (next && item.content.data?.studyFlowAt === next.at && item.content.title === next.title && item.content.body === next.body) {
        future.delete(item.identifier);
      } else {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
    if (future.size) await ensureChannel();
    for (const item of future.values()) {
      if (item.at <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: item.title, body: item.body,
          data: { studyFlowScope: scope, studyFlowAt: item.at, studyFlowKind: scope.split(':')[0] },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.at), channelId },
      });
    }
  });
  queue = job.catch(() => {});
  return job;
}
