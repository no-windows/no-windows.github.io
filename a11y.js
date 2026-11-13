/* a11y.js - Screen reader for the Windows 11 replica.
   Speech uses the browser's Web Speech API. Toggle: Ctrl+Alt+Enter, or the "Screen reader" tile in Quick settings.
   Self-contained: injects its own CSS and panel. Reads this desktop and same-origin app windows (not other sites). */
(function () {
'use strict';
if (window.top !== window) return;
const SYN = window.speechSynthesis;
const LSget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v } catch (e) { return d } };
const cfg = Object.assign({ on: false, rate: 1, pitch: 1, volume: 1, voice: '', verb: 'normal', echo: true, sounds: true, hover: false, caption: true, cursor: true }, LSget('sr.cfg', {}));
const save = () => { try { localStorage.setItem('sr.cfg', JSON.stringify(cfg)) } catch (e) {} };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const EMOJI = /[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu, PUA = /[\uE000-\uF8FF]/g;
const clean = t => String(t == null ? '' : t).replace(EMOJI, ' ').replace(PUA, ' ').replace(/[•·|]+/g, ', ').replace(/\s+/g, ' ').trim();
const INTERACTIVE = 'a,button,input,textarea,select,summary,[role=button],[role=link],[role=tab],[role=switch],[data-sr-act]';

/* ---------- speech ---------- */
let voices = [], queue = [], cur = null, lastSpoken = '', capT = 0;
function loadVoices() { voices = SYN ? SYN.getVoices() : []; fillVoices() }
if (SYN) { SYN.onvoiceschanged = loadVoices; setTimeout(loadVoices, 0) }
function pickVoice() {
  if (cfg.voice) { const v = voices.find(v => v.voiceURI === cfg.voice); if (v) return v }
  const lang = (navigator.language || 'en-US').toLowerCase(), base = lang.slice(0, 2);
  const pool = voices.filter(v => v.lang.toLowerCase().startsWith(base));
  const score = v => (/natural|neural|premium|enhanced/i.test(v.name) ? 4 : 0) + (v.lang.toLowerCase() === lang ? 2 : 0) + (/google|samantha|ava|aria|jenny|zira|daniel|serena/i.test(v.name) ? 1 : 0);
  return pool.sort((a, b) => score(b) - score(a))[0] || null;
}
function chunks(t) {
  const out = []; let s = t;
  while (s.length > 220) { let i = Math.max(s.lastIndexOf('. ', 220), s.lastIndexOf(', ', 220), s.lastIndexOf(' ', 220)); if (i < 40) i = 220; out.push(s.slice(0, i + 1).trim()); s = s.slice(i + 1) }
  if (s.trim()) out.push(s.trim()); return out;
}
function pump() {
  if (cur || !queue.length || !SYN) return;
  const t = queue.shift(), u = new SpeechSynthesisUtterance(t), v = pickVoice();
  if (v) { try { u.voice = v; u.lang = v.lang } catch (e) {} }
  u.rate = cfg.rate; u.pitch = cfg.pitch; u.volume = cfg.volume; cur = u;
  u.onend = u.onerror = () => { if (cur === u) { cur = null; pump() } };
  SYN.speak(u);
}
function stop() { queue = []; cur = null; if (SYN) SYN.cancel() }
function say(text, o = {}) {
  text = clean(text); if (!text || !SYN) return;
  if (o.interrupt !== false) stop();
  chunks(text).forEach(c => queue.push(c)); lastSpoken = text; showCaption(text); pump();
}
const speak = (t, o) => { if (cfg.on) say(t, o) };

/* ---------- sounds ---------- */
let AC = null;
function tone(f, d = .06, type = 'sine', v = .035, when = 0) {
  if (!cfg.sounds) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + when;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) {}
}
const snd = { focus: () => tone(1000, .03, 'sine', .015), open: () => { tone(523, .08); tone(784, .1, 'sine', .035, .07) }, close: () => { tone(784, .08); tone(523, .1, 'sine', .035, .07) }, on: () => { tone(660, .08); tone(990, .14, 'sine', .035, .08) }, off: () => { tone(990, .08); tone(660, .14, 'sine', .035, .08) }, edge: () => tone(220, .12, 'triangle', .05) };

/* ---------- names, roles, states ---------- */
function roleOf(el) {
  const r = (el.getAttribute('role') || '').toLowerCase();
  const map = { button: 'button', link: 'link', dialog: 'window', tab: 'tab', switch: 'switch', checkbox: 'check box', radio: 'radio button', menuitem: 'menu item', textbox: 'edit text', slider: 'slider', img: 'image', toolbar: 'toolbar', status: '', group: '' };
  if (r && map[r] !== undefined) return map[r];
  const t = el.tagName.toLowerCase();
  if (/^h[1-6]$/.test(t)) return 'heading level ' + t[1];
  if (t === 'a') return el.hasAttribute('href') ? 'link' : '';
  if (t === 'button') return 'button';
  if (t === 'textarea') return 'edit text';
  if (t === 'select') return 'pop up button';
  if (t === 'summary') return 'disclosure triangle';
  if (t === 'iframe') return 'frame';
  if (t === 'img') return 'image';
  if (t === 'li') return 'list item';
  if (t === 'input') { const ty = (el.type || 'text').toLowerCase(); return ({ checkbox: 'check box', radio: 'radio button', range: 'slider', button: 'button', submit: 'button', reset: 'button', file: 'file picker button', color: 'color well' })[ty] || 'edit text' }
  return '';
}
function nameOf(el) {
  const d = el.ownerDocument, g = n => el.getAttribute(n);
  const lb = g('aria-labelledby');
  if (lb) { const s = clean(lb.split(/\s+/).map(i => { const n = d.getElementById(i); return n ? n.textContent : '' }).join(' ')); if (s) return s }
  if (g('aria-label')) return clean(g('aria-label'));
  const t = el.tagName;
  if (el.labels && el.labels.length) { const s = clean([...el.labels].map(l => l.textContent).join(' ')); if (s) return s }
  if (t === 'IMG') return clean(el.alt);
  if (t === 'INPUT' && /^(button|submit|reset)$/i.test(el.type)) return clean(el.value);
  if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return clean(el.placeholder || el.title || '');
  if (t === 'IFRAME') return clean(el.title);
  const tx = clean(el.innerText || el.textContent || '');
  if (!/[\p{L}\p{N}]/u.test(tx)) return clean(el.title || tx);
  return tx.length > 200 ? tx.slice(0, 200) + '…' : tx;
}
function stateOf(el) {
  const s = [], a = n => el.getAttribute(n), sw = a('role') === 'switch';
  if (el.type === 'checkbox' || el.type === 'radio') s.push(el.checked ? 'checked' : 'unchecked');
  else if (a('aria-checked') != null) s.push(a('aria-checked') === 'true' ? (sw ? 'on' : 'checked') : (sw ? 'off' : 'unchecked'));
  if (a('aria-pressed') === 'true') s.push('pressed');
  if (a('aria-expanded') != null) s.push(a('aria-expanded') === 'true' ? 'expanded' : 'collapsed');
  if (a('aria-selected') === 'true') s.push('selected');
  if (el.disabled || a('aria-disabled') === 'true') s.push('dimmed');
  return s;
}
function valueOf(el) {
  const t = el.tagName;
  if (t === 'SELECT') return clean(el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '');
  if (t === 'INPUT' && el.type === 'range') return el.value;
  if (t === 'INPUT' && /^(text|search|url|email|tel|number|password)$/i.test(el.type || 'text')) return el.type === 'password' ? (el.value ? 'protected, ' + el.value.length + ' characters' : 'empty') : (el.value || 'empty');
  if (t === 'TEXTAREA') return el.value ? clean(el.value.slice(-200)) : 'empty';
  return '';
}
function posOf(el) {
  const r = el.getAttribute('role'); if (!r || !el.parentElement) return '';
  const sib = [...el.parentElement.children].filter(c => c.getAttribute('role') === r);
  return sib.length > 1 ? (sib.indexOf(el) + 1) + ' of ' + sib.length : '';
}
function describe(el) {
  const n = nameOf(el), r = roleOf(el), st = stateOf(el), v = valueOf(el), p = [];
  if (cfg.verb === 'brief') { if (n) p.push(n); if (v) p.push(v); return p.join(', ') }
  if (n) p.push(n); if (r) p.push(r); p.push(...st); if (v) p.push(v);
  if (cfg.verb === 'detailed') {
    const pos = posOf(el); if (pos) p.push(pos);
    if (r === 'button' || r === 'switch') p.push('press Enter to activate'); else if (r === 'link') p.push('press Enter to open'); else if (r === 'edit text') p.push('type to enter text');
  }
  return p.join(', ');
}

/* ---------- making the desktop accessible ---------- */
function enhance(doc) {
  const set = (sel, fn) => $$(sel, doc).forEach((e, i) => { try { fn(e, i) } catch (_) {} });
  const act = e => { e.setAttribute('data-sr-act', '1'); if (!e.hasAttribute('tabindex')) e.setAttribute('tabindex', '0') };
  const btn = (e, label) => { act(e); e.setAttribute('role', 'button'); if (label) e.setAttribute('aria-label', label) };
  set('.tb', e => { if (e.id === 'sr-tb') return; btn(e, (e.title || clean(e.textContent)) + (e.classList.contains('run') ? ', running' : '')); if (e.id === 'start-btn') e.setAttribute('aria-expanded', String(!!($('#start', doc) && $('#start', doc).classList.contains('open')))) });
  set('#search-box', e => btn(e, 'Search')); set('#tray', e => btn(e, 'Quick settings: network, volume, battery'));
  set('#clock', e => btn(e, 'Date and time, ' + clean(e.textContent) + '. Opens calendar')); set('#weather', e => btn(e, 'Weather, ' + clean(e.textContent)));
  set('.dicon', e => btn(e, clean(e.textContent) + ', desktop icon'));
  set('.app', e => btn(e)); set('.pw', e => btn(e, 'Power')); set('.user', e => btn(e, 'User account')); set('.rec div', e => btn(e));
  set('#pmenu div', e => { act(e); e.setAttribute('role', 'menuitem') }); set('#ctx div', e => { act(e); e.setAttribute('role', 'menuitem') });
  set('#qs .q', e => { act(e); e.setAttribute('role', 'switch'); e.setAttribute('aria-checked', String(e.classList.contains('on'))) });
  set('#qs input[type=range]', (e, i) => e.setAttribute('aria-label', i === 0 ? 'Brightness' : 'Volume'));
  set('.tog', e => { act(e); e.setAttribute('role', 'switch'); e.setAttribute('aria-checked', String(e.classList.contains('on'))); e.setAttribute('aria-label', clean(e.parentElement && e.parentElement.textContent)) });
  set('.win', e => { e.setAttribute('role', 'dialog'); e.setAttribute('tabindex', '-1'); const t = $('.title .t', e); e.setAttribute('aria-label', clean(t ? t.textContent : 'Window')) });
  set('.win .mn', e => e.setAttribute('aria-label', 'Minimize')); set('.win .mx', e => e.setAttribute('aria-label', 'Maximize or restore')); set('.win .x', e => e.setAttribute('aria-label', 'Close'));
  [['#taskbar', 'toolbar', 'Taskbar'], ['#start', 'dialog', 'Start menu'], ['#widgets', 'dialog', 'Widgets'], ['#qs', 'dialog', 'Quick settings'], ['#cal', 'dialog', 'Calendar'], ['#icons', 'group', 'Desktop']].forEach(([s, r, l]) => set(s, e => { e.setAttribute('role', r); e.setAttribute('aria-label', l); if (r === 'dialog') e.setAttribute('tabindex', '-1') }));
  set('#toast', e => { e.setAttribute('role', 'status'); e.setAttribute('aria-live', 'polite') });
  /* pages inside app windows (browser, emulator, store, explorer, settings) */
  set('[data-go],[data-open],[data-popup],[data-force],[data-rmbm]', e => { if (e.tagName !== 'BUTTON') { act(e); e.setAttribute('role', 'link') } });
  set('.tab[data-t]', e => { act(e); e.setAttribute('role', 'tab'); e.setAttribute('aria-selected', String(e.classList.contains('on'))) });
  set('.cat', e => { act(e); e.setAttribute('role', 'button'); e.setAttribute('aria-pressed', String(e.classList.contains('on'))) });
  set('.view .q, .grid .q', e => { act(e); e.setAttribute('role', 'link') });
  set('.fe aside div, .set aside div, .files div', e => btn(e));
  set('#star', e => e.setAttribute('aria-pressed', String(/★/.test(e.textContent))));
  set('#plus', e => e.setAttribute('aria-label', 'New tab')); set('[data-x]', e => e.setAttribute('aria-label', 'Close tab'));
}
function ensureStyle(doc) {
  if (doc.getElementById('sr-style')) return;
  const s = doc.createElement('style'); s.id = 'sr-style';
  s.textContent = 'body.sr-on :focus-visible{outline:3px solid #0a84ff!important;outline-offset:2px;border-radius:6px}.sr-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}';
  (doc.head || doc.documentElement).appendChild(s);
}

/* ---------- reading cursor, caption ---------- */
let curBox, capBox, vc = null;
function rectOf(el) {
  const r = el.getBoundingClientRect(); let x = r.left, y = r.top, w = el.ownerDocument.defaultView;
  while (w && w.frameElement) { const f = w.frameElement.getBoundingClientRect(); x += f.left; y += f.top; w = w.parent }
  return { x, y, w: r.width, h: r.height };
}
function showCursor(el) {
  if (!cfg.on || !cfg.cursor || !el || !curBox) return;
  const r = rectOf(el); if (r.w === 0 && r.h === 0) { curBox.style.display = 'none'; return }
  Object.assign(curBox.style, { display: 'block', left: r.x - 3 + 'px', top: r.y - 3 + 'px', width: r.w + 6 + 'px', height: r.h + 6 + 'px' });
}
function showCaption(t) {
  if (!cfg.caption || !cfg.on || !capBox) return;
  capBox.textContent = t; capBox.style.display = 'block'; clearTimeout(capT); capT = setTimeout(() => capBox.style.display = 'none', 4500);
}

/* ---------- focus, hover, windows ---------- */
let fT = null, skipNext = null, lastFocusBeforeFlyout = null, hoverT = null;
function onFocus(e) {
  if (!cfg.on) return; const el = e.target;
  if (!el || el.nodeType !== 1 || /^(BODY|HTML)$/.test(el.tagName)) return;
  clearTimeout(fT);
  fT = setTimeout(() => {
    vc = el; showCursor(el);
    if (el === skipNext) { skipNext = null; return }
    snd.focus(); speak(describe(el));
  }, 40);
}
function onHover(e) {
  if (!cfg.on || !cfg.hover) return; clearTimeout(hoverT);
  const t = e.target.closest && e.target.closest(INTERACTIVE + ',h1,h2,h3,[role]');
  if (!t) return; hoverT = setTimeout(() => { vc = t; showCursor(t); speak(describe(t)) }, 350);
}
const winTitle = w => clean(($('.title .t', w) || {}).textContent || 'Window');
function visibleWins() { return $$('.win').filter(w => !w.classList.contains('min')).sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0)) }
function activeWin() { return $('.win.focus') || visibleWins()[0] || null }
function watchShell() {
  const wins = $('#wins');
  if (wins) new MutationObserver(muts => {
    if (!cfg.on) return;
    muts.forEach(m => {
      if (m.type === 'childList') {
        m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList.contains('win')) { enhance(document); n._sr = Date.now(); snd.open(); skipNext = n; n.focus({ preventScroll: true }); speak(winTitle(n) + ', window opened') } });
        m.removedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains('win')) { snd.close(); speak(winTitle(n) + ' closed') } });
      } else if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('win')) {
        const now = m.target.classList.contains('focus'), was = /\bfocus\b/.test(m.oldValue || '');
        if (now && !was && Date.now() - (m.target._sr || 0) > 400) { snd.focus(); speak(winTitle(m.target) + ', window') }
      }
    });
  }).observe(wins, { childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
  ['start', 'widgets', 'qs', 'cal'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    new MutationObserver(ms => {
      if (!cfg.on) return; const m = ms[ms.length - 1], was = /\bopen\b/.test(m.oldValue || ''), now = el.classList.contains('open');
      if (now && !was) { lastFocusBeforeFlyout = document.activeElement; snd.open(); const lbl = el.getAttribute('aria-label') || id; speak(lbl); enhance(document); const f = $(id === 'start' ? '#sq' : '.q,input,button', el); setTimeout(() => { if (f) { skipNext = f; f.focus() } }, 60) }
      if (!now && was) { snd.close(); speak((el.getAttribute('aria-label') || id) + ' closed'); if (lastFocusBeforeFlyout && lastFocusBeforeFlyout.focus) try { lastFocusBeforeFlyout.focus() } catch (e) {} }
    }).observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  });
  const toast = $('#toast');
  if (toast) new MutationObserver(() => { if (cfg.on && toast.textContent.trim()) speak(toast.textContent, { interrupt: false }) }).observe(toast, { childList: true, characterData: true, subtree: true });
}

/* ---------- iframes (same-origin app pages) ---------- */
function attachDoc(doc) {
  if (!doc || doc._srAttached) return; doc._srAttached = true;
  ensureStyle(doc); if (cfg.on) doc.body && doc.body.classList.add('sr-on');
  doc.addEventListener('focusin', onFocus, true); doc.addEventListener('keydown', e => onKey(e, doc), true); doc.addEventListener('keyup', onKeyUp, true); doc.addEventListener('mouseover', onHover, true);
  enhance(doc);
  try { new MutationObserver(() => { clearTimeout(doc._srT); doc._srT = setTimeout(() => enhance(doc), 120) }).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }) } catch (e) {}
}
function frameDoc(f) { try { return f.contentDocument && f.contentDocument.body ? f.contentDocument : null } catch (e) { return null } }
function scanFrames() { $$('iframe').forEach(f => { if (!f._srL) { f._srL = 1; f.addEventListener('load', () => attachDoc(frameDoc(f))) } attachDoc(frameDoc(f)) }) }

/* ---------- reading cursor commands ---------- */
const CAND = 'h1,h2,h3,h4,h5,h6,p,li,label,summary,a,button,input,textarea,select,img[alt],[role=button],[role=link],[role=tab],[role=switch],td,th,small,b,.row,.card,.g,.q,.tb,.dicon,.app,.cat,[data-sr-act]';
function scopeRoot() {
  const a = document.activeElement;
  if (a && a.tagName === 'IFRAME') { const d = frameDoc(a); if (d) return d.body }
  const w = activeWin();
  if (w) { const f = $('iframe', w), d = f && frameDoc(f); if (d) return d.body; if (f) return null; return $('.body', w) || w }
  return document.body;
}
function visible(el) { const r = el.getBoundingClientRect(); const cs = el.ownerDocument.defaultView.getComputedStyle(el); return (r.width > 0 || r.height > 0) && cs.visibility !== 'hidden' && cs.display !== 'none' && el.getAttribute('aria-hidden') !== 'true' }
function items(root) {
  const all = $$(CAND, root).filter(visible);
  return all.filter(el => el.matches(INTERACTIVE) || !all.some(o => o !== el && el.contains(o))).filter(el => nameOf(el) || el.matches(INTERACTIVE));
}
function move(dir, filterFn) {
  const root = scopeRoot();
  if (!root) { speak('The content of this window cannot be read by the screen reader. Press Tab to reach its controls.'); snd.edge(); return }
  let list = items(root); if (filterFn) list = list.filter(filterFn);
  if (!list.length) { speak('Nothing found'); snd.edge(); return }
  const start = (vc && root.contains(vc)) ? vc : document.activeElement;
  let idx = list.indexOf(start);
  if (idx === -1) { idx = list.findIndex(el => !!(start && start.compareDocumentPosition && (start.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING))); idx = dir > 0 ? (idx === -1 ? 0 : idx) : (idx === -1 ? list.length - 1 : Math.max(0, idx - 1)) }
  else idx += dir;
  if (idx < 0 || idx >= list.length) { speak(idx < 0 ? 'Top' : 'End'); snd.edge(); return }
  const el = list[idx]; vc = el; el.scrollIntoView({ block: 'nearest' });
  if (!el.hasAttribute('tabindex') && !/^(BUTTON|INPUT|A|TEXTAREA|SELECT|SUMMARY)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
  if (el.ownerDocument.activeElement !== el) { skipNext = el; el.focus({ preventScroll: true }) }
  showCursor(el); snd.focus(); speak(describe(el));
}
function readAll() {
  const root = scopeRoot(); if (!root) { speak('The content of this window cannot be read by the screen reader.'); return }
  const list = items(root), start = vc && root.contains(vc) ? Math.max(0, list.indexOf(vc)) : 0;
  const lines = list.slice(start).map(describe).filter(Boolean);
  if (!lines.length) { speak('Nothing to read'); return }
  stop(); lines.forEach((l, i) => say(l, { interrupt: false }));
}
function activateCursor() {
  const el = vc || document.activeElement; if (!el) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) { el.focus(); return }
  activate(el);
}
function activate(el) { if (el.classList && el.classList.contains('dicon')) el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); else el.click() }

/* ---------- regions (F6) ---------- */
function regions() {
  const r = [{ el: $('#taskbar'), label: 'Taskbar' }];
  ['start', 'widgets', 'qs', 'cal'].forEach(id => { const e = document.getElementById(id); if (e && e.classList.contains('open')) r.push({ el: e, label: e.getAttribute('aria-label') }) });
  visibleWins().forEach(w => r.push({ el: w, label: winTitle(w) + ', window' }));
  r.push({ el: $('#icons'), label: 'Desktop' });
  return r.filter(x => x.el);
}
function nextRegion(dir) {
  const r = regions(), a = document.activeElement; let i = r.findIndex(x => x.el.contains(a)); i = i === -1 ? (dir > 0 ? 0 : r.length - 1) : (i + dir + r.length) % r.length;
  const t = r[i], f = t.el.matches('.win,#start,#widgets,#qs,#cal') ? t.el : ($('[tabindex="0"],button,input', t.el) || t.el);
  skipNext = f; if (t.el.classList.contains('win')) { const m = t.el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })) }
  if (!f.hasAttribute('tabindex') && !/^(BUTTON|INPUT|A)$/.test(f.tagName)) f.setAttribute('tabindex', '-1');
  f.focus(); showCursor(f); snd.focus(); speak(t.label);
}

/* ---------- keyboard ---------- */
let ctrlSolo = false;
const charName = c => ({ ' ': 'space', '\n': 'return', '.': 'dot', ',': 'comma', '-': 'dash', '_': 'underscore', '/': 'slash', '\\': 'backslash', '@': 'at', '#': 'hash', '!': 'exclamation mark', '?': 'question mark', ':': 'colon', ';': 'semicolon', '"': 'quote', "'": 'apostrophe', '(': 'left paren', ')': 'right paren', '&': 'and', '*': 'star', '+': 'plus', '=': 'equals', '%': 'percent', '$': 'dollar', '<': 'less than', '>': 'greater than' })[c] || (/[A-Z]/.test(c) ? 'capital ' + c : c || 'blank');
const isEditable = t => t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && /^(text|search|url|email|tel|password|number)$/i.test(t.type || 'text')));
const keepsArrowKeys = t => t && (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && /^(number|range)$/i.test(t.type)));
function echoKey(e, t) {
  if (e.ctrlKey || e.altKey || e.metaKey) return; const k = e.key, v = t.value || '', i = t.selectionStart || 0;
  if (k.length === 1) { if (k === ' ') { const w = v.slice(0, i).split(/\s+/).filter(Boolean).pop(); say(w || 'space') } else say(t.type === 'password' ? 'star' : charName(k)); return }
  if (k === 'Backspace' && i > 0 && i === t.selectionEnd) return say('deleted ' + charName(v[i - 1]));
  if (k === 'Delete' && i < v.length) return say('deleted ' + charName(v[i]));
  if (k === 'ArrowLeft' || k === 'ArrowRight') setTimeout(() => { const j = t.selectionStart || 0; say(k === 'ArrowLeft' ? (j < t.value.length ? charName(t.value[j]) : 'end') : (j > 0 ? charName(t.value[j - 1]) : 'start')) }, 0);
  if ((k === 'ArrowUp' || k === 'ArrowDown') && t.tagName === 'TEXTAREA') setTimeout(() => { const j = t.selectionStart || 0, s = t.value.lastIndexOf('\n', j - 1) + 1; let e2 = t.value.indexOf('\n', j); if (e2 === -1) e2 = t.value.length; say(t.value.slice(s, e2) || 'blank') }, 0);
  if (k === 'Home' || k === 'End') setTimeout(() => { const j = t.selectionStart || 0, s = t.value.lastIndexOf('\n', j - 1) + 1; let e2 = t.value.indexOf('\n', j); if (e2 === -1) e2 = t.value.length; say(t.value.slice(s, e2) || 'blank') }, 0);
}
function dateTimeText() { const n = new Date(); return n.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ', ' + n.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
function onKeyUp(e) { if (e.key === 'Control' && ctrlSolo && cfg.on) stop(); if (e.key === 'Control') ctrlSolo = false }
function onKey(e, doc) {
  if (e.key === 'Control') ctrlSolo = true; else ctrlSolo = false;
  const mod = e.ctrlKey && e.altKey && !e.metaKey;
  if ((mod && (e.code === 'Enter' || e.code === 'NumpadEnter')) || (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyS')) { e.preventDefault(); e.stopPropagation(); toggle(); return }
  { const t0 = e.target; if ((e.key === 'Enter' || e.key === ' ') && t0 && t0.getAttribute && t0.getAttribute('data-sr-act') && !/^(BUTTON|A|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(t0.tagName)) { e.preventDefault(); activate(t0); return } }
  if (!cfg.on) return;
  if (e.key === 'Escape') { stop(); if (panel && panel.style.display === 'block') closePanel(); else if (typeof window.close_all === 'function') window.close_all(); return }
  if (mod) {
    const c = e.code; let h = true;
    if (c === 'ArrowRight' || c === 'ArrowDown') move(1); else if (c === 'ArrowLeft' || c === 'ArrowUp') move(-1);
    else if (c === 'KeyA') readAll(); else if (c === 'Space') activateCursor();
    else if (c === 'KeyH') move(e.shiftKey ? -1 : 1, el => /^H[1-6]$/.test(el.tagName) || el.getAttribute('role') === 'heading');
    else if (c === 'KeyT') { const w = activeWin(); speak(w ? winTitle(w) + ', window' : 'Desktop') }
    else if (c === 'KeyD') speak(dateTimeText());
    else if (c === 'KeyR') say(lastSpoken);
    else if (c === 'KeyW') { const a = document.activeElement, w = activeWin(); speak((a && a !== document.body ? describe(a) : 'Nothing focused') + (w ? ', in ' + winTitle(w) : ', on the desktop')) }
    else if (c === 'KeyK') openPanel(true); else if (c === 'KeyP') openPanel(false);
    else if (c === 'Equal' || c === 'NumpadAdd') { cfg.rate = Math.min(3, +(cfg.rate + .1).toFixed(1)); save(); syncPanel(); say('Speed ' + cfg.rate) }
    else if (c === 'Minus' || c === 'NumpadSubtract') { cfg.rate = Math.max(.5, +(cfg.rate - .1).toFixed(1)); save(); syncPanel(); say('Speed ' + cfg.rate) }
    else h = false;
    if (h) { e.preventDefault(); e.stopPropagation() } return;
  }
  if (!e.ctrlKey && !e.altKey && !e.metaKey && !keepsArrowKeys(e.target)) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1); return }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); return }
  }
  if (e.key === 'F6') { e.preventDefault(); nextRegion(e.shiftKey ? -1 : 1); return }
  const t = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && t && t.getAttribute && t.getAttribute('data-sr-act') && !/^(BUTTON|A|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(t.tagName)) { e.preventDefault(); activate(t); return }
  if (cfg.echo && isEditable(t)) echoKey(e, t);
}

/* ---------- toggle, panel ---------- */
let panel, tile, tb;
function syncUI() {
  document.body.classList.toggle('sr-on', cfg.on); $$('iframe').forEach(f => { const d = frameDoc(f); if (d && d.body) d.body.classList.toggle('sr-on', cfg.on) });
  if (tb) { tb.classList.toggle('run', cfg.on); tb.classList.toggle('active', cfg.on); tb.setAttribute('aria-pressed', String(cfg.on)); tb.title = 'Screen reader: ' + (cfg.on ? 'on' : 'off') + ' (Ctrl+Alt+Enter)' }
  if (tile) { tile.classList.toggle('on', cfg.on); tile.setAttribute('aria-checked', String(cfg.on)); const s = $('span', tile); if (s) s.textContent = 'Screen reader' }
  if (!cfg.on) { if (curBox) curBox.style.display = 'none'; if (capBox) capBox.style.display = 'none' }
  syncPanel();
}
function toggle() {
  if (!cfg.on) { cfg.on = true; save(); syncUI(); enhance(document); scanFrames(); snd.on(); say('Screen reader on. Control Alt K lists the commands. Control Alt Enter, or Alt Shift S, turns it off.') }
  else { say('Screen reader off'); snd.off(); setTimeout(() => { cfg.on = false; save(); syncUI(); stop() }, 900) }
}
function fillVoices() {
  const s = panel && $('#sr-voice', panel); if (!s) return;
  s.innerHTML = '<option value="">Automatic (best available)</option>' + voices.map(v => `<option value="${v.voiceURI.replace(/"/g, '')}">${v.name} (${v.lang})</option>`).join(''); s.value = cfg.voice;
}
function syncPanel() {
  if (!panel) return; const set = (id, k, type) => { const e = $('#' + id, panel); if (e) { if (type === 'chk') e.checked = !!cfg[k]; else e.value = cfg[k] } };
  set('sr-on', 'on', 'chk'); set('sr-rate', 'rate'); set('sr-pitch', 'pitch'); set('sr-vol', 'volume'); set('sr-verb', 'verb'); set('sr-echo', 'echo', 'chk'); set('sr-snd', 'sounds', 'chk'); set('sr-hover', 'hover', 'chk'); set('sr-cap', 'caption', 'chk'); set('sr-cur', 'cursor', 'chk');
  const r = $('#sr-rate-v', panel); if (r) r.textContent = cfg.rate + 'x';
}
function openPanel(help) { panel.style.display = 'block'; syncPanel(); fillVoices(); const t = $(help ? '#sr-help h3' : '#sr-title', panel); t.setAttribute('tabindex', '-1'); t.focus(); if (help) { t.scrollIntoView({ block: 'start' }); speak('Screen reader commands. Use the reading cursor keys or Tab to move through the list.') } else speak('Screen reader settings') }
function closePanel() { panel.style.display = 'none'; speak('Settings closed') }
function build() {
  ensureStyle(document);
  const st = document.createElement('style');
  st.textContent = `#sr-cursor{position:fixed;display:none;z-index:99998;pointer-events:none;border:3px solid #0a84ff;border-radius:8px;box-shadow:0 0 0 2px rgba(255,255,255,.7),0 0 14px rgba(10,132,255,.6);transition:left .12s,top .12s,width .12s,height .12s}
#sr-cap{position:fixed;display:none;left:50%;transform:translateX(-50%);bottom:64px;max-width:70vw;z-index:99997;pointer-events:none;background:rgba(0,0,0,.82);color:#fff;padding:8px 16px;border-radius:8px;font:15px "Segoe UI",system-ui,sans-serif;text-align:center}
#sr-panel{position:fixed;right:12px;bottom:60px;width:360px;max-height:calc(100vh - 80px);overflow:auto;z-index:99999;display:none;background:var(--acrylic,#f3f3f3);color:var(--text,#1a1a1a);border:1px solid var(--stroke,#ccc);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.3);padding:16px;backdrop-filter:blur(30px);font-size:13px}
#sr-panel h2{font-size:16px;margin:0 0 10px;font-weight:600}#sr-panel h3{font-size:13px;margin:14px 0 6px}
#sr-panel label{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:5px 0}
#sr-panel select,#sr-panel button{height:30px;border-radius:4px;border:1px solid var(--stroke,#aaa);background:var(--card,#fff);color:inherit;font:inherit;padding:0 8px}
#sr-panel select{max-width:200px}#sr-panel input[type=range]{width:150px}
#sr-panel kbd{background:var(--card,#fff);border:1px solid var(--stroke,#bbb);border-radius:4px;padding:1px 6px;font:12px Consolas,monospace}
#sr-panel dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 10px}#sr-panel dd{margin:0}`;
  document.head.appendChild(st);
  curBox = document.createElement('div'); curBox.id = 'sr-cursor'; curBox.setAttribute('aria-hidden', 'true');
  capBox = document.createElement('div'); capBox.id = 'sr-cap'; capBox.setAttribute('aria-hidden', 'true');
  panel = document.createElement('div'); panel.id = 'sr-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Screen reader settings');
  panel.innerHTML = `<h2 id="sr-title">Screen reader</h2>
<label>Screen reader on <input type="checkbox" id="sr-on"></label>
<label>Voice <select id="sr-voice"></select></label>
<label>Speed <span><input type="range" id="sr-rate" min="0.5" max="3" step="0.1" aria-label="Speech speed"> <span id="sr-rate-v"></span></span></label>
<label>Pitch <input type="range" id="sr-pitch" min="0.5" max="2" step="0.1"></label>
<label>Volume <input type="range" id="sr-vol" min="0.1" max="1" step="0.1"></label>
<label>Detail <select id="sr-verb"><option value="brief">Brief</option><option value="normal">Normal</option><option value="detailed">Detailed (with hints)</option></select></label>
<label>Speak typed characters <input type="checkbox" id="sr-echo"></label>
<label>Sound effects <input type="checkbox" id="sr-snd"></label>
<label>Read items under the mouse <input type="checkbox" id="sr-hover"></label>
<label>Show spoken text on screen <input type="checkbox" id="sr-cap"></label>
<label>Show reading cursor <input type="checkbox" id="sr-cur"></label>
<p><button id="sr-test">Test voice</button> <button id="sr-close">Close</button></p>
<div id="sr-help"><h3>Commands (Ctrl+Alt + key)</h3><dl>
<dt><kbd>Enter</kbd></dt><dd>Turn screen reader on or off</dd>
<dt><kbd>→</kbd> <kbd>←</kbd></dt><dd>Next or previous item in the active window</dd>
<dt><kbd>Space</kbd></dt><dd>Activate the item under the reading cursor</dd>
<dt><kbd>A</kbd></dt><dd>Read everything from the cursor</dd>
<dt><kbd>H</kbd></dt><dd>Next heading (add Shift for previous)</dd>
<dt><kbd>W</kbd></dt><dd>Where am I</dd>
<dt><kbd>T</kbd></dt><dd>Read the window title</dd>
<dt><kbd>D</kbd></dt><dd>Read date and time</dd>
<dt><kbd>R</kbd></dt><dd>Repeat the last thing spoken</dd>
<dt><kbd>+</kbd> <kbd>-</kbd></dt><dd>Faster or slower speech</dd>
<dt><kbd>K</kbd> <kbd>P</kbd></dt><dd>This list, settings</dd></dl>
<h3>Other keys</h3><dl>
<dt><kbd>Ctrl</kbd></dt><dd>Stop speaking</dd><dt><kbd>Esc</kbd></dt><dd>Stop speaking, close menus</dd>
<dt><kbd>F6</kbd></dt><dd>Jump between taskbar, menus, windows and desktop (Shift+F6 goes back)</dd>
<dt><kbd>Tab</kbd></dt><dd>Next control; Enter or Space activates</dd></dl>
<p>Content from other websites inside a window cannot be read. Use the "open in a browser window" button for those.</p></div>`;
  document.body.append(curBox, capBox, panel);
  const on = (id, ev, fn) => { const e = $('#' + id, panel); e.addEventListener(ev, fn) };
  on('sr-on', 'change', e => { if (e.target.checked !== cfg.on) toggle() });
  on('sr-voice', 'change', e => { cfg.voice = e.target.value; save() });
  [['sr-rate', 'rate'], ['sr-pitch', 'pitch'], ['sr-vol', 'volume']].forEach(([id, k]) => on(id, 'input', e => { cfg[k] = +e.target.value; save(); syncPanel() }));
  on('sr-verb', 'change', e => { cfg.verb = e.target.value; save() });
  [['sr-echo', 'echo'], ['sr-snd', 'sounds'], ['sr-hover', 'hover'], ['sr-cap', 'caption'], ['sr-cur', 'cursor']].forEach(([id, k]) => on(id, 'change', e => { cfg[k] = e.target.checked; save(); if (!cfg.cursor && curBox) curBox.style.display = 'none' }));
  on('sr-test', 'click', () => say('This is how the screen reader sounds at the current speed and pitch.'));
  on('sr-close', 'click', closePanel);
  /* visible taskbar toggle, next to the tray */
  const right = $('#tb-right');
  if (right) { tb = document.createElement('div'); tb.className = 'tb'; tb.id = 'sr-tb'; tb.tabIndex = 0; tb.setAttribute('role', 'button'); tb.setAttribute('aria-label', 'Screen reader'); tb.setAttribute('data-sr-act', '1'); tb.textContent = '🗣️'; tb.title = 'Screen reader: off (Ctrl+Alt+Enter)'; tb.addEventListener('click', e => { e.stopPropagation(); toggle() }); right.insertBefore(tb, right.firstChild) }
  /* quick settings tile: reuse the existing "Access" tile */
  tile = $('#qs .q[data-t="acc"]');
  if (tile) { tile.addEventListener('click', () => { if (tile.classList.contains('on') !== cfg.on) { /* page script toggled the class; apply our own state */ } toggle() }); const set = document.createElement('div'); set.className = 'q'; set.setAttribute('data-sr-act', '1'); set.tabIndex = 0; set.setAttribute('role', 'button'); set.innerHTML = '⚙️<span>Reader settings</span>'; set.addEventListener('click', () => openPanel(false)); tile.parentElement.appendChild(set) }
  document.addEventListener('keydown', e => { if (tile && (e.key === 'Enter' || e.key === ' ') && e.target === tile) e.stopPropagation() }, true);
}

/* ---------- start ---------- */
function init() {
  build(); watchShell(); enhance(document); scanFrames();
  document.addEventListener('focusin', onFocus, true); document.addEventListener('keydown', e => onKey(e, document), true); document.addEventListener('keyup', onKeyUp, true); document.addEventListener('mouseover', onHover, true);
  new MutationObserver(() => { clearTimeout(init._t); init._t = setTimeout(() => { enhance(document); scanFrames() }, 120) }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', () => showCursor(vc));
  syncUI();
  if (cfg.on) { const once = () => { say('Screen reader on'); ['keydown', 'pointerdown'].forEach(t => removeEventListener(t, once, true)) }; ['keydown', 'pointerdown'].forEach(t => addEventListener(t, once, true)) }
  window.SR = { speak, stop, toggle, isOn: () => cfg.on };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0)); else setTimeout(init, 0);
})();
