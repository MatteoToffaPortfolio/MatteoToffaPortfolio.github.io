/**
 * Portfolio Chatbot Widget
 * Incolla nel tuo HTML prima di </body>:
 *
 *   <script>
 *     window.PortfolioChatbot = { backendUrl: 'https://tuo-backend.onrender.com' };
 *   </script>
 *   <script src="chatbot.js"></script>
 */
(function () {
  const config = window.PortfolioChatbot || {};
  const BACKEND = (config.backendUrl || 'http://localhost:3001').replace(/\/$/, '');
  const LABEL   = config.label       || 'Chatta con me';
  const TITLE   = config.title       || 'Assistente Portfolio';
  const WELCOME = config.welcome     || 'Ciao! Sono qui per rispondere alle tue domande su di me, i miei progetti e i miei contatti. Come posso aiutarti?';
  const COLOR   = config.color       || '#1a73e8';

  // ── Sessione ────────────────────────────────────────────────────────────────
  const sessionId = 'pcb_' + Math.random().toString(36).slice(2, 11);

  // ── Stili ───────────────────────────────────────────────────────────────────
  const css = `
    #pcb-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      background: ${COLOR}; color: #fff;
      border: none; border-radius: 50px; padding: 14px 22px;
      font-size: 15px; font-family: inherit; font-weight: 500;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      display: flex; align-items: center; gap: 8px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    #pcb-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.22); }
    #pcb-btn svg { flex-shrink:0; }

    #pcb-box {
      position: fixed; bottom: 88px; right: 24px; z-index: 9999;
      width: 360px; height: 520px; max-width: calc(100vw - 32px); max-height: calc(100vh - 120px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.16);
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    }
    #pcb-box.open { display: flex; }

    #pcb-header {
      background: ${COLOR}; color: #fff;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
    }
    #pcb-header-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex; align-items: center; justify-content: center; font-size: 17px;
    }
    #pcb-header-info { flex: 1; }
    #pcb-header-info strong { display: block; font-size: 14px; }
    #pcb-header-info span { font-size: 11px; opacity: 0.85; }
    #pcb-close {
      background: none; border: none; color: #fff; cursor: pointer;
      font-size: 20px; padding: 0 4px; opacity: 0.8; line-height: 1;
    }
    #pcb-close:hover { opacity: 1; }

    #pcb-messages {
      flex: 1; overflow-y: auto; padding: 14px; display: flex;
      flex-direction: column; gap: 10px; scroll-behavior: smooth;
    }
    #pcb-messages::-webkit-scrollbar { width: 4px; }
    #pcb-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

    .pcb-msg { display: flex; gap: 7px; max-width: 88%; animation: pcbFade 0.2s ease; }
    .pcb-msg.bot { align-self: flex-start; }
    .pcb-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    @keyframes pcbFade { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }

    .pcb-avatar {
      width: 26px; height: 26px; border-radius: 50%; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 2px;
    }
    .pcb-msg.bot .pcb-avatar { background: #e8f0fe; }
    .pcb-msg.user .pcb-avatar { background: #e8f5e9; }

    .pcb-bubble {
      padding: 9px 13px; border-radius: 14px; line-height: 1.5; word-break: break-word;
    }
    .pcb-msg.bot .pcb-bubble { background: #f1f3f4; color: #202124; border-top-left-radius: 3px; }
    .pcb-msg.user .pcb-bubble { background: ${COLOR}; color: #fff; border-top-right-radius: 3px; }

    .pcb-bubble p { margin: 0 0 5px; }
    .pcb-bubble p:last-child { margin: 0; }
    .pcb-bubble ul { margin: 4px 0 5px 16px; padding: 0; }
    .pcb-bubble li { margin-bottom: 2px; }
    .pcb-bubble a { color: inherit; }
    .pcb-msg.bot .pcb-bubble a { color: ${COLOR}; }

    .pcb-typing { display: flex; align-items: center; gap: 4px; padding: 9px 13px; background: #f1f3f4; border-radius: 14px; border-top-left-radius: 3px; }
    .pcb-typing span { width: 6px; height: 6px; background: #9aa0a6; border-radius: 50%; animation: pcbBounce 1.2s infinite; }
    .pcb-typing span:nth-child(2) { animation-delay: .2s; }
    .pcb-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes pcbBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

    .pcb-error { font-size: 12px; color: #d93025; text-align: center; padding: 4px 10px; background: #fce8e6; border-radius: 8px; align-self: center; }

    #pcb-footer { padding: 10px 12px; border-top: 1px solid #e8eaed; display: flex; gap: 8px; align-items: flex-end; }
    #pcb-input {
      flex: 1; border: 1.5px solid #dadce0; border-radius: 20px;
      padding: 8px 14px; font-size: 13px; font-family: inherit;
      resize: none; overflow: hidden; max-height: 100px; line-height: 1.4;
      outline: none; transition: border-color 0.2s;
    }
    #pcb-input:focus { border-color: ${COLOR}; }
    #pcb-send {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: ${COLOR}; color: #fff; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, transform 0.1s;
    }
    #pcb-send:hover { filter: brightness(1.1); }
    #pcb-send:active { transform: scale(0.92); }
    #pcb-send:disabled { background: #c5cae9; cursor: default; }
  `;

  // ── DOM ─────────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="pcb-btn" aria-label="${LABEL}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
      ${LABEL}
    </button>

    <div id="pcb-box" role="dialog" aria-label="${TITLE}">
      <div id="pcb-header">
        <div id="pcb-header-avatar">👨‍💻</div>
        <div id="pcb-header-info">
          <strong>${TITLE}</strong>
          <span>Risponde subito</span>
        </div>
        <button id="pcb-close" aria-label="Chiudi">✕</button>
      </div>
      <div id="pcb-messages"></div>
      <div id="pcb-footer">
        <textarea id="pcb-input" placeholder="Scrivi un messaggio..." rows="1"></textarea>
        <button id="pcb-send" aria-label="Invia">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const btn      = document.getElementById('pcb-btn');
  const box      = document.getElementById('pcb-box');
  const closeBtn = document.getElementById('pcb-close');
  const messages = document.getElementById('pcb-messages');
  const input    = document.getElementById('pcb-input');
  const sendBtn  = document.getElementById('pcb-send');

  // ── Apertura/chiusura ────────────────────────────────────────────────────────
  btn.addEventListener('click', () => {
    box.classList.toggle('open');
    if (box.classList.contains('open')) input.focus();
  });
  closeBtn.addEventListener('click', () => box.classList.remove('open'));

  // ── Benvenuto ────────────────────────────────────────────────────────────────
  addMessage('bot', WELCOME);

  // ── Input ────────────────────────────────────────────────────────────────────
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  sendBtn.addEventListener('click', send);

  // ── Invio messaggio ──────────────────────────────────────────────────────────
  async function send() {
    const text = input.value.trim();
    if (!text || sendBtn.disabled) return;

    addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    input.disabled = true;

    const typingId = addTyping();

    try {
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      removeEl(typingId);
      const data = await res.json();
      if (!res.ok) addError(data.error || 'Errore di rete');
      else addMessage('bot', data.reply);
    } catch {
      removeEl(typingId);
      addError('Impossibile raggiungere il server.');
    }

    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }

  // ── Helpers UI ───────────────────────────────────────────────────────────────
  function addMessage(role, text) {
    const isBot = role === 'bot';
    const div = document.createElement('div');
    div.className = `pcb-msg ${role}`;
    div.innerHTML = `
      <div class="pcb-avatar">${isBot ? '👨‍💻' : '👤'}</div>
      <div class="pcb-bubble">${isBot ? renderMd(text) : esc(text)}</div>
    `;
    messages.appendChild(div);
    scrollBottom();
  }

  function addTyping() {
    const id = 'pcb-t-' + Date.now();
    const div = document.createElement('div');
    div.className = 'pcb-msg bot'; div.id = id;
    div.innerHTML = `<div class="pcb-avatar">👨‍💻</div><div class="pcb-typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(div);
    scrollBottom();
    return id;
  }

  function addError(msg) {
    const div = document.createElement('div');
    div.className = 'pcb-error'; div.textContent = '⚠ ' + msg;
    messages.appendChild(div); scrollBottom();
  }

  function removeEl(id) { const el = document.getElementById(id); if (el) el.remove(); }
  function scrollBottom() { messages.scrollTop = messages.scrollHeight; }
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function renderMd(text) {
    return esc(text)
      .replace(/^### (.+)$/gm,'<strong>$1</strong>')
      .replace(/^## (.+)$/gm,'<strong>$1</strong>')
      .replace(/^# (.+)$/gm,'<strong>$1</strong>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^[\-\*] (.+)$/gm,'<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n{2,}/g,'</p><p>')
      .replace(/\n/g,'<br>')
      .replace(/^/,'<p>').replace(/$/,'</p>');
  }
})();
