import { useEffect } from 'react';

const CHAT_FLOW_ID = 'gPZOw0V8nIDz7VR0dhGvO';
const SCRIPT_ID = 'plugr-chat-widget-script';

// Mounts the public support-chat bubble (see packages/web/public/plugr-chat.js).
// Rendered directly by the marketing pages (landing, about, pricing, terms,
// privacy) — not part of a shared layout since those pages don't share one,
// and it must never load inside the authenticated app/builder.
export function PlugrChatWidget() {
  useEffect(() => {
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = '/plugr-chat.js';
      script.defer = true;
      script.setAttribute('data-flow-id', CHAT_FLOW_ID);
      document.body.appendChild(script);
    }

    // Client-side navigation away from a marketing page (e.g. into sign-in
    // or the authenticated app) should take the widget with it — the script
    // mounts its bubble/panel directly on document.body, outside React's tree.
    return () => {
      document.getElementById(SCRIPT_ID)?.remove();
      document.querySelector('.plugr-chat-bubble')?.remove();
      document.querySelector('.plugr-chat-panel')?.remove();
    };
  }, []);

  return null;
}
