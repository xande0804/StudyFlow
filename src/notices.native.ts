// Expo Go lacks the push-topic module loaded by the package's root entry.
// Import only the local notification APIs used by StudyFlow.
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { IosAuthorizationStatus, type NotificationPermissionsStatus } from 'expo-notifications/build/NotificationPermissions.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { AppState, DeviceEventEmitter, Platform } from 'react-native';
import type { ScheduledNotice } from './notices';

export const supportsNotices = true;
const channelId = 'studyflow-reminders';
let queue = Promise.resolve();

setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: (notification.request.content.data?.studyFlowKind !== 'pomodoro' || AppState.currentState !== 'active'),
    shouldShowList: (notification.request.content.data?.studyFlowKind !== 'pomodoro' || AppState.currentState !== 'active'),
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(channelId, {
      name: 'StudyFlow',
      importance: AndroidImportance.DEFAULT,
    });
  }
}

function permitted(status: NotificationPermissionsStatus) {
  return status.granted || status.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

export async function requestNotices() {
  await ensureChannel();
  const current = await getPermissionsAsync();
  const allowed = permitted(current) || permitted(await requestPermissionsAsync());
  DeviceEventEmitter.emit('studyflow-notice-permission');
  return allowed;
}

export function reconcileNotices(scope: string, desired: ScheduledNotice[]) {
  const job = queue.then(async () => {
    const allowed = desired.length > 0 && permitted(await getPermissionsAsync());
    const future = new Map((allowed ? desired : []).filter((item) => item.at > Date.now()).map((item) => [item.id, item]));
    const scheduled = await getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.content.data?.studyFlowScope !== scope) continue;
      const next = future.get(item.identifier);
      if (next && item.content.data?.studyFlowAt === next.at && item.content.title === next.title && item.content.body === next.body) {
        future.delete(item.identifier);
      } else {
        await cancelScheduledNotificationAsync(item.identifier);
      }
    }
    if (future.size) await ensureChannel();
    for (const item of future.values()) {
      if (item.at <= Date.now()) continue;
      await scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: item.title, body: item.body,
          data: { studyFlowScope: scope, studyFlowAt: item.at, studyFlowKind: scope.split(':')[0] },
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(item.at), channelId },
      });
    }
  });
  queue = job.catch(() => {});
  return job;
}
