self.addEventListener('push', function (event) {
  var payload = {
    title: 'Flow needs attention',
    body: 'A production flow failed.',
    url: '/',
    tag: 'flow-failure',
  };

  if (event.data) {
    try {
      var incoming = event.data.json();
      payload.title = incoming.title || payload.title;
      payload.body = incoming.body || payload.body;
      payload.url = incoming.url || payload.url;
      payload.tag = incoming.tag || payload.tag;
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      badge: '/icons/icon-72.png',
      body: payload.body,
      data: { url: payload.url },
      icon: '/icons/icon-192.png',
      renotify: true,
      tag: payload.tag,
    }),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var rawUrl = event.notification.data && event.notification.data.url;
  var targetUrl = new URL(rawUrl || '/', self.location.origin);
  if (targetUrl.origin !== self.location.origin) {
    targetUrl = new URL('/', self.location.origin);
  }

  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then(function (windowClients) {
        var matchingClient = windowClients.find(function (client) {
          return new URL(client.url).pathname === targetUrl.pathname;
        });
        if (matchingClient) {
          return matchingClient.focus();
        }
        return self.clients.openWindow(targetUrl.href);
      }),
  );
});
