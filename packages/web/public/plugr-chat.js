/**
 * Plugr chat embed widget.
 *
 * Usage — paste before </body> on any website:
 *   <script src="https://plugr.cloud/plugr-chat.js" data-flow-id="YOUR_FLOW_ID" defer></script>
 *
 * Optional attributes:
 *   data-color="#7C3AED"      bubble + header accent color
 *   data-position="right"     "right" (default) or "left"
 *   data-logo="https://..."   image shown on the closed bubble instead of the default chat icon
 *   data-origin="https://..." override the Plugr origin (defaults to where this script is served from)
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) {
    var candidates = document.querySelectorAll('script[data-flow-id]');
    script = candidates[candidates.length - 1];
  }
  if (!script) {
    console.error('[plugr-chat] Could not locate the embed <script> tag.');
    return;
  }

  var flowId = script.getAttribute('data-flow-id');
  if (!flowId) {
    console.error('[plugr-chat] Missing required data-flow-id attribute.');
    return;
  }

  var origin = script.getAttribute('data-origin');
  if (!origin) {
    try {
      origin = new URL(script.src).origin;
    } catch (e) {
      console.error('[plugr-chat] Could not determine the Plugr origin.');
      return;
    }
  }
  origin = origin.replace(/\/+$/, '');

  var color = script.getAttribute('data-color') || '#7C3AED';
  var logoUrl = script.getAttribute('data-logo') || '';
  var position = script.getAttribute('data-position') === 'left' ? 'left' : 'right';
  var chatUrl = origin + '/chats/' + encodeURIComponent(flowId) + '?embed=true';

  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    /* older browsers */
  }

  var Z_INDEX = '2147483000';

  // ---- styles -------------------------------------------------------------
  var style = document.createElement('style');
  style.textContent =
    '.plugr-chat-bubble{position:fixed;bottom:20px;' + position + ':20px;width:56px;height:56px;' +
    'border-radius:9999px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.24);z-index:' + Z_INDEX + ';padding:0;' +
    (reducedMotion ? '' : 'transition:transform .15s ease,box-shadow .15s ease;') + '}' +
    '.plugr-chat-bubble:hover{' + (reducedMotion ? '' : 'transform:scale(1.06);') + 'box-shadow:0 10px 28px rgba(0,0,0,.3)}' +
    '.plugr-chat-bubble:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '.plugr-chat-bubble svg{width:26px;height:26px;pointer-events:none}' +
    '.plugr-chat-bubble img{width:32px;height:32px;border-radius:9999px;object-fit:cover;pointer-events:none}' +
    '.plugr-chat-panel{position:fixed;bottom:88px;' + position + ':20px;width:380px;height:min(600px,calc(100vh - 110px));' +
    'max-width:calc(100vw - 40px);border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.28);' +
    'background:#fff;z-index:' + Z_INDEX + ';display:none;' +
    (reducedMotion ? '' : 'transition:opacity .18s ease,transform .18s ease;') +
    'opacity:0;transform:translateY(8px)}' +
    '.plugr-chat-panel.plugr-open{display:block}' +
    '.plugr-chat-panel.plugr-visible{opacity:1;transform:translateY(0)}' +
    '.plugr-chat-panel iframe{width:100%;height:100%;border:0;display:block}' +
    '@media (max-width:480px){.plugr-chat-panel{bottom:0;' + position + ':0;width:100vw;height:100dvh;max-width:100vw;border-radius:0}}';
  document.head.appendChild(style);

  // ---- bubble button ------------------------------------------------------
  var bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.className = 'plugr-chat-bubble';
  bubble.style.background = color;
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.setAttribute('aria-expanded', 'false');

  var defaultChatIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  // Falls back to the default icon if the logo 404s or otherwise fails to load,
  // so the bubble never ends up blank.
  var chatIcon = logoUrl
    ? '<img src="' + logoUrl + '" alt="" onerror="this.outerHTML=\'' + defaultChatIcon.replace(/'/g, "\\'") + '\'">'
    : defaultChatIcon;
  var closeIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  bubble.innerHTML = chatIcon;

  // ---- panel with lazy iframe --------------------------------------------
  var panel = document.createElement('div');
  panel.className = 'plugr-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat');

  var iframeLoaded = false;
  var isOpen = false;

  function ensureIframe() {
    if (iframeLoaded) return;
    var iframe = document.createElement('iframe');
    iframe.src = chatUrl;
    iframe.title = 'Chat';
    iframe.allow = 'clipboard-write';
    panel.appendChild(iframe);
    iframeLoaded = true;
  }

  function openChat() {
    ensureIframe();
    isOpen = true;
    panel.classList.add('plugr-open');
    // double rAF so the display change lands before the transition starts
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        panel.classList.add('plugr-visible');
      });
    });
    bubble.innerHTML = closeIcon;
    bubble.setAttribute('aria-label', 'Close chat');
    bubble.setAttribute('aria-expanded', 'true');
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('plugr-visible');
    var hide = function () {
      if (!isOpen) panel.classList.remove('plugr-open');
    };
    if (reducedMotion) {
      hide();
    } else {
      setTimeout(hide, 200);
    }
    bubble.innerHTML = chatIcon;
    bubble.setAttribute('aria-label', 'Open chat');
    bubble.setAttribute('aria-expanded', 'false');
  }

  bubble.addEventListener('click', function () {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen) {
      closeChat();
    }
  });

  window.addEventListener('message', function (event) {
    if (event.origin !== origin) return;
    if (event.data && event.data.type === 'plugr-chat:close') {
      closeChat();
    }
  });

  function mount() {
    document.body.appendChild(bubble);
    document.body.appendChild(panel);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }
})();
