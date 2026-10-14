/**
 * Trajectory PWA & Browser Notification Dispatcher
 * Dispatches 2-Minute Launch alarms and Morning Flight Briefings.
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return await Notification.requestPermission();
}

export function showFlightNotification(title: string, body: string, url = '/planner'): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url },
      });
    });
  } else {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
  }
}

export function scheduleTwoMinuteLaunchNudge(
  taskTitle: string,
  twoMinuteAction: string,
  delayMs = 120000
): number {
  return window.setTimeout(() => {
    showFlightNotification(
      `⚡ 2-Minute Launch: ${taskTitle}`,
      twoMinuteAction || 'Open your study material and write down the first equation.',
      '/planner'
    );
  }, delayMs);
}
