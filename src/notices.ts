export type ScheduledNotice = { id: string; title: string; body: string; at: number };

export const supportsNotices = false;
export async function requestNotices() { return false; }
export async function reconcileNotices(_scope: string, _desired: ScheduledNotice[]) {}
