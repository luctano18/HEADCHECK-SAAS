/* HeadCheck AI — Service Worker for Web Push Notifications */

const APP_NAME = "HeadCheck AI";
const DEFAULT_ICON = "/favicon.ico";
const DEFAULT_BADGE = "/favicon.ico";

// ─── Push event ──────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: APP_NAME, body: event.data ? event.data.text() : "Nouvelle notification" };
  }

  const title = data.title || APP_NAME;
  const options = {
    body: data.body || "",
    icon: data.icon || DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: data.tag || "headcheck-notif",
    data: { url: data.url || "/" },
    requireInteraction: data.requireInteraction ?? false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If a HeadCheck tab is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── Activate: claim clients immediately ─────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
