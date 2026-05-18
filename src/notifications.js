import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const isNative = () => Capacitor.isNativePlatform();

// "Go out" time windows in hours (24h). We pick one randomly each day.
const GO_OUT_HOURS = [8, 10, 16, 20];

const MESSAGES = [
  { title: "Rate today's fit 👗", body: "What are you wearing? Rate your outfit before you head out." },
  { title: "Outfit check ✨", body: "Don't forget to log today's look and keep your streak alive." },
  { title: "Style score time 🔥", body: "You're heading out — rate your outfit and track your glow up." },
  { title: "OOTD reminder 👀", body: "Rate your fit today. Your style history is waiting." },
  { title: "How's the fit? 👗", body: "Quick outfit rating before you go — keep that streak going." },
];

function getNextTriggerTime() {
  const now = new Date();
  const hour = GO_OUT_HOURS[Math.floor(Math.random() * GO_OUT_HOURS.length)];
  // ±30 min randomization (in minutes)
  const offsetMin = Math.floor(Math.random() * 61) - 30;
  const trigger = new Date(now);
  trigger.setHours(hour, 0 + offsetMin, 0, 0);
  // If that time already passed today, schedule for tomorrow
  if (trigger <= now) trigger.setDate(trigger.getDate() + 1);
  return trigger;
}

export async function requestNotificationPermission() {
  if (!isNative()) return false;
  const { display } = await LocalNotifications.requestPermissions();
  return display === "granted";
}

export async function checkNotificationPermission() {
  if (!isNative()) return false;
  const { display } = await LocalNotifications.checkPermissions();
  return display === "granted";
}

// Schedule one notification for a random "go out" time. Cancels any pending
// OOTD notification first so we never stack duplicates.
export async function scheduleDailyNotification() {
  if (!isNative()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const ootdIds = (pending.notifications || [])
      .filter(n => n.id >= 8800 && n.id <= 8899)
      .map(n => ({ id: n.id }));
    if (ootdIds.length) await LocalNotifications.cancel({ notifications: ootdIds });

    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const at = getNextTriggerTime();
    await LocalNotifications.schedule({
      notifications: [{
        id: 8800,
        title: msg.title,
        body: msg.body,
        schedule: { at },
        sound: "default",
        smallIcon: "ic_launcher",
      }],
    });
    // Remember when we last scheduled so initNotifications can avoid double-scheduling
    localStorage.setItem("ootd_notif_scheduled_date", new Date().toDateString());
  } catch (e) {
    console.log("Notification schedule error:", e);
  }
}

// Call this on app launch. Re-schedules if we haven't scheduled one today.
export async function initNotifications() {
  if (!isNative()) return;
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;
  const lastScheduled = localStorage.getItem("ootd_notif_scheduled_date");
  if (lastScheduled === new Date().toDateString()) return;
  await scheduleDailyNotification();
}
