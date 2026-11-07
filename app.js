import { FIREBASE_CONFIG, COMMITTEES, COLLEGES, CLUB, REQUIRE_UQU_EMAIL } from './config.js';

/* ============ Helpers ============ */
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');

// Builds DOM safely: all text goes through textContent (no innerHTML for user data)
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v; // static, trusted markup only (icons)
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) n.setAttribute(k, '');
    else n.setAttribute(k, v);
  }
  for (const c of kids.flat()) {
    if (c === null || c === undefined || c === false) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
}

const ICON = {
  x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20z"/></svg>',
  users: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6"/><path d="M18 14.5c1.9.7 3 2.6 3 5.5"/></svg>',
  lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a6a24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  lockBig: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8a6a24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.5"/></svg>',
  send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="flip"><path d="M4 12l16-8-6 16-3-7z"/></svg>',
  prev: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  next: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  mail: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8a6a24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
};
ICON.linkedin = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"/></svg>';
ICON.xs = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.1-9.3L1 2h7.2l5 6.6L18.9 2zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20z"/></svg>';
ICON.megaphone = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a3 3 0 0 1 0 6"/><path d="M18 6a7 7 0 0 1 0 12"/></svg>';
const icon = (name, cls) => el('span', { class: cls || '', html: ICON[name] });

// "@user" أو "x.com/user" → "user"
function normalizeX(v) {
  v = String(v || '').trim();
  if (!v) return '';
  const m = /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?(?:[?#].*)?$/.exec(v) || /^@?([A-Za-z0-9_]{1,15})$/.exec(v);
  return m ? m[1] : null;
}
// أي صيغة لرابط لنكدإن الشخصي → https://www.linkedin.com/in/slug
function normalizeLinkedin(v) {
  v = String(v || '').trim();
  if (!v) return '';
  const m = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/in\/([A-Za-z0-9_%-]{2,100})\/?(?:[?#].*)?$/i.exec(v);
  return m ? `https://www.linkedin.com/in/${m[1]}` : null;
}
const roleTitle = (p) => (p.title && p.title.trim())
  || (p.role === 'president' ? 'رئيس النادي الرياضي' : p.role === 'vp' ? 'نائب رئيس النادي' : `${ROLE_LABEL[p.role] || ''} ${committeeName(p.committee)}`.trim());
function socialLinks(p) {
  const links = [];
  if (p.x) links.push(el('a', { class: 'soc', href: `https://x.com/${encodeURIComponent(p.x)}`, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `حساب ${p.name} على إكس`, html: ICON.xs }));
  if (p.linkedin && /^https:\/\/www\.linkedin\.com\/in\//.test(p.linkedin)) links.push(el('a', { class: 'soc', href: p.linkedin, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `حساب ${p.name} على لنكدإن`, html: ICON.linkedin }));
  return links.length ? el('div', { class: 'socs' }, links) : null;
}

const ROLE_LABEL = { president: 'رئيس النادي', vp: 'نائب الرئيس', leader: 'قائد', deputy: 'نائب', member: 'عضو' };
const BOARD_ROLES = ['president', 'vp'];
const LEAD_ROLES = ['president', 'vp', 'leader', 'deputy'];
const isLeaderRole = (r) => LEAD_ROLES.includes(r);
const isBoardRole = (r) => BOARD_ROLES.includes(r);
const committeeName = (id) => (id === 'board' ? 'رئاسة النادي' : ((COMMITTEES.find((c) => c.id === id) || {}).name || 'لجنة'));
const badge = (role) => el('span', { class: `badge b-${role}` }, ROLE_LABEL[role] || '');
const initial = (name) => (String(name || '؟').trim().charAt(0) || '؟');

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}

const fmtDate = (d) => {
  try { return new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch { return ''; }
};
const fmtTime = (d) => {
  try { return new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { hour: 'numeric', minute: '2-digit' }).format(d); } catch { return ''; }
};
const tsDate = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate() : null);

function authError(e) {
  const c = (e && e.code) || '';
  const map = {
    'auth/email-already-in-use': 'البريد مسجّل من قبل. جرّب تسجيل الدخول.',
    'auth/invalid-email': 'البريد غير صحيح.',
    'auth/weak-password': 'كلمة المرور ضعيفة، خلها ٨ أحرف على الأقل.',
    'auth/invalid-credential': 'البريد أو كلمة المرور غلط.',
    'auth/wrong-password': 'البريد أو كلمة المرور غلط.',
    'auth/user-not-found': 'البريد أو كلمة المرور غلط.',
    'auth/too-many-requests': 'محاولات كثيرة، جرّب بعد شوي.',
    'auth/network-request-failed': 'فيه مشكلة في الاتصال بالإنترنت.',
    'permission-denied': 'ما عندك صلاحية لهذا الإجراء.'
  };
  return map[c] || 'صار خطأ، جرّب مرة ثانية.';
}

/* ============ Firebase ============ */
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const configured = !String(FIREBASE_CONFIG.apiKey || '').startsWith('YOUR');
let F = null; // { auth, db, a: authFns, f: firestoreFns }

const state = { user: null, profile: null, isAdmin: false, ready: false, busy: false };

async function initFirebase() {
  if (!configured) return;
  const [appMod, a, f] = await Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-auth.js'),
    import(SDK + 'firebase-firestore.js')
  ]);
  const fbApp = appMod.initializeApp(FIREBASE_CONFIG);
  F = { auth: a.getAuth(fbApp), db: f.getFirestore(fbApp), a, f };
  F.auth.languageCode = 'ar';
  await new Promise((resolve) => {
    let first = true;
    a.onAuthStateChanged(F.auth, async (user) => {
      state.user = user;
      await loadProfile();
      renderNavAuth();
      if (first) { first = false; resolve(); } else if (!state.busy) route();
    });
  });
}

async function loadProfile() {
  state.profile = null;
  state.isAdmin = false;
  if (!state.user || !F) return;
  const { doc, getDoc } = F.f;
  try {
    const [p, adm] = await Promise.all([
      getDoc(doc(F.db, 'profiles', state.user.uid)),
      getDoc(doc(F.db, 'admins', state.user.uid))
    ]);
    state.profile = p.exists() ? { id: p.id, ...p.data() } : null;
    state.isAdmin = adm.exists();
  } catch (e) { console.error(e); }
}

const canPost = () => !!state.profile && (isLeaderRole(state.profile.role) || state.isAdmin);

/* ============ Nav ============ */
function renderNavAuth() {
  const box = $('#navAuth');
  box.replaceChildren();
  $('#adminLink').classList.toggle('hidden', !state.isAdmin);
  if (!configured) return;
  if (state.user) {
    const p = state.profile;
    box.append(
      el('a', { class: 'user-chip', href: '#/account', title: 'حسابي' }, p ? p.name : (state.user.email || ''), p ? badge(p.role) : null),
      el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: async () => { await F.a.signOut(F.auth); location.hash = '#/'; toast('تم تسجيل الخروج'); } }, 'خروج')
    );
  } else {
    box.append(el('a', { class: 'btn btn-gold btn-sm', href: '#/login' }, 'تسجيل الدخول'));
  }
}

$('#menuBtn').addEventListener('click', () => {
  const nav = $('#nav');
  const open = nav.classList.toggle('open');
  $('#menuBtn').setAttribute('aria-expanded', String(open));
});

/* ============ Router ============ */
let cleanups = [];
const onLeave = (fn) => cleanups.push(fn);
const ROUTES = { '': home, home, leaders, committees, chat: committees, login, register, admin, account };

function route() {
  const h = location.hash;
  if (h && !h.startsWith('#/') && h.length > 1) {
    const t = document.getElementById(decodeURIComponent(h.slice(1)));
    if (t) { t.scrollIntoView(); if (t.focus) t.focus({ preventScroll: true }); return; }
  }
  cleanups.forEach((fn) => { try { fn(); } catch { /* noop */ } });
  cleanups = [];
  const name = (location.hash.replace(/^#\/?/, '').split(/[/?]/)[0] || 'home');
  const view = ROUTES[name] || home;
  document.querySelectorAll('.nav a[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === (ROUTES[name] ? name : 'home')));
  $('#nav').classList.remove('open');
  $('#menuBtn').setAttribute('aria-expanded', 'false');
  app.replaceChildren();
  if (!configured) app.append(el('div', { class: 'setup' }, el('div', { class: 'wrap' }, 'الموقع للحين مو مربوط بقاعدة البيانات. عبّ بيانات Firebase في ملف config.js (الشرح في README).')));
  view();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* ============ Home ============ */
function home() {
  const tweetsBox = el('div', { class: 'carousel' }, el('div', { class: 'loading' }, 'جاري تحميل التغريدات…'));
  const annBox = el('div', {}, el('div', { class: 'loading' }, 'جاري تحميل الإعلانات…'));
  const comGrid = el('div', { class: 'grid com-grid' });
  const addBtn = canPost() ? el('button', { class: 'btn btn-gold btn-sm', type: 'button', onclick: openAddTweet }, '+ إضافة تغريدة') : null;

  app.append(
    el('section', { class: 'hero' },
      el('div', { class: 'wrap hero-grid' },
        el('div', { class: 'hero-text' },
          el('span', { class: 'pill' }, 'منصة أعضاء النادي'),
          el('h1', {}, 'مكان واحد يجمع أعضاء النادي الرياضي'),
          el('p', {}, 'تابع آخر أخبار النادي، سجّل واختر لجنتك وصفتك، وتابع إعلانات لجنتك.'),
          el('div', { class: 'hero-actions' },
            state.user ? el('a', { class: 'btn btn-gold', href: '#/committees' }, 'صفحة اللجان') : el('a', { class: 'btn btn-gold', href: '#/register' }, 'انضم للنادي'),
            el('a', { class: 'btn btn-ghost', href: '#/leaders' }, 'تعرّف على القادات')
          )
        ),
        el('div', { class: 'tweets-col' },
          el('div', { class: 'tweets-head' },
            el('h2', {}, icon('x'), 'آخر تغريدات النادي'),
            addBtn
          ),
          tweetsBox
        )
      )
    ),
    el('section', { class: 'wrap ann-wrap', id: 'announcements', 'aria-labelledby': 'ann-title' },
      el('div', { class: 'ann-panel' },
        el('div', { class: 'ann-head' },
          el('div', { class: 'ann-head-text' },
            el('span', { class: 'ann-ico', html: ICON.megaphone }),
            el('div', {}, el('h2', { id: 'ann-title' }, 'إعلانات النادي'), el('p', {}, 'آخر الأخبار والتعليمات من رئاسة النادي وقادة اللجان.'))),
          (state.profile && isLeaderRole(state.profile.role)) ? el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: openAddAnnouncement }, '+ إعلان جديد') : null),
        annBox)
    ),
    el('section', { class: 'section', id: 'committees' },
      el('div', { class: 'wrap' },
        el('div', { class: 'sec-head' }, el('h2', { class: 'title' }, 'لجان النادي')),
        comGrid
      )
    ),
    state.user ? null : el('section', { class: 'section' },
      el('div', { class: 'wrap' },
        el('div', { class: 'cta' },
          el('div', {}, el('h2', {}, 'جاهز تنضم؟'), el('p', {}, 'سجّل الحين واختر لجنتك وصفتك.')),
          el('a', { class: 'btn btn-gold', href: '#/register' }, 'إنشاء حساب')
        )
      )
    )
  );
  loadTweets(tweetsBox);
  loadAnnouncements(annBox);
  loadCommitteeCounts(comGrid);
}

/* ---- Committee member counts (stats/committees, updated on signup) ---- */
function membersLabel(n) {
  if (n === 1) return 'عضو';
  if (n === 2) return 'عضوان';
  if (n >= 3 && n <= 10) return 'أعضاء';
  return 'عضو';
}
function drawCommitteeCounts(grid, counts) {
  grid.replaceChildren(...COMMITTEES.map((c) => {
    const n = Number((counts || {})[c.id]) || 0;
    return el('div', { class: 'card com-card' },
      icon('users', 'icon-box'),
      el('h3', {}, c.name),
      el('p', { class: 'com-count' }, el('strong', {}, String(n)), ' ', membersLabel(n)));
  }));
}
function loadCommitteeCounts(grid) {
  drawCommitteeCounts(grid, null);
  if (!F) return;
  const unsub = F.f.onSnapshot(F.f.doc(F.db, 'stats', 'committees'),
    (snap) => drawCommitteeCounts(grid, snap.exists() ? snap.data() : null),
    (e) => console.error(e));
  onLeave(unsub);
}

/* ---- Announcements ---- */
function loadAnnouncements(box) {
  if (!F) { renderAnnouncements(box, []); return; }
  const { collection, query, orderBy, limit, onSnapshot } = F.f;
  const unsub = onSnapshot(query(collection(F.db, 'announcements'), orderBy('createdAt', 'desc'), limit(30)),
    (snap) => renderAnnouncements(box, snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (e) => { console.error(e); renderAnnouncements(box, []); });
  onLeave(unsub);
}

function renderAnnouncements(box, items) {
  box.replaceChildren();
  if (!items.length) {
    box.append(el('div', { class: 'ann-empty' }, 'ما فيه إعلانات للحين.'));
    return;
  }
  let showAll = false;
  const list = el('div', { class: 'ann-list' });
  const more = el('button', { class: 'btn btn-outline btn-sm', type: 'button' });
  const SHOW = 4;
  const draw = () => {
    const shown = showAll ? items : items.slice(0, SHOW);
    list.replaceChildren(...shown.map(annCard));
    more.textContent = showAll ? 'عرض أقل' : `عرض كل الإعلانات (${items.length})`;
    more.classList.toggle('hidden', items.length <= SHOW);
  };
  more.addEventListener('click', () => { showAll = !showAll; draw(); });
  box.append(list, el('div', { class: 'ann-more' }, more));
  draw();
}

function annCard(a) {
  const d = tsDate(a.createdAt);
  const isNew = d && (Date.now() - d.getTime()) < 3 * 24 * 3600 * 1000;
  const canDel = state.user && (a.authorUid === state.user.uid || state.isAdmin || (state.profile && isBoardRole(state.profile.role)));
  const body = el('p', { class: 'ann-body' }, a.body || '');
  const long = (a.body || '').length > 280 || (a.body || '').split('\n').length > 5;
  const toggle = long ? el('button', { class: 'link-btn', type: 'button', onclick: () => {
    const open = body.classList.toggle('open');
    toggle.textContent = open ? 'عرض أقل' : 'اقرأ المزيد';
  } }, 'اقرأ المزيد') : null;
  return el('article', { class: 'ann' + (isNew ? ' is-new' : '') },
    el('div', { class: 'ann-top' },
      el('h3', {}, a.title || ''),
      isNew ? el('span', { class: 'badge b-new' }, 'جديد') : null),
    body, toggle,
    el('div', { class: 'ann-foot' },
      el('span', { class: `avatar av-${a.authorRole || 'leader'}` }, initial(a.authorName)),
      el('span', { class: 'ann-author' },
        el('strong', {}, a.authorName || ''),
        el('span', {}, `${ROLE_LABEL[a.authorRole] || ''}${a.authorCommittee && a.authorCommittee !== 'board' ? ' · ' + committeeName(a.authorCommittee) : ''}`)),
      el('time', {}, d ? fmtDate(d) : ''),
      canDel ? el('button', { class: 'msg-del', type: 'button', 'aria-label': 'حذف الإعلان', onclick: async () => {
        if (!confirm('تبي تحذف هذا الإعلان؟')) return;
        try { await F.f.deleteDoc(F.f.doc(F.db, 'announcements', a.id)); toast('انحذف الإعلان'); } catch (e) { toast(authError(e)); }
      } }, 'حذف') : null));
}

function openAddAnnouncement() {
  const titleIn = el('input', { type: 'text', id: 'an-title', maxlength: '100', required: true, placeholder: 'مثال: موعد اجتماع اللجان' });
  const bodyIn = el('textarea', { id: 'an-body', maxlength: '2000', required: true, placeholder: 'تفاصيل الإعلان' });
  const count = el('span', { class: 'hint' }, '0 / 2000');
  bodyIn.addEventListener('input', () => { count.textContent = `${bodyIn.value.length} / 2000`; });
  const err = el('div', { class: 'err hidden' });
  const save = el('button', { class: 'btn btn-primary', type: 'submit' }, 'نشر الإعلان');
  const dlg = el('dialog', { 'aria-labelledby': 'an-h' });
  const showErr = (m) => { err.textContent = m; err.classList.toggle('hidden', !m); };
  const form = el('form', { class: 'modal' },
    el('h2', { id: 'an-h' }, 'إعلان جديد'),
    el('label', { class: 'field', for: 'an-title' }, 'العنوان', titleIn),
    el('label', { class: 'field', for: 'an-body' }, 'النص', bodyIn, count),
    el('p', { class: 'hint' }, `بيظهر باسمك (${state.profile.name} · ${ROLE_LABEL[state.profile.role]}) في الصفحة الرئيسية للكل.`),
    err,
    el('div', { class: 'modal-actions' }, save, el('button', { class: 'btn btn-outline', type: 'button', onclick: () => dlg.close() }, 'إلغاء')));
  dlg.append(form);
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleIn.value.trim();
    const body = bodyIn.value.trim();
    if (!title) return showErr('اكتب عنوان الإعلان.');
    if (!body) return showErr('اكتب نص الإعلان.');
    save.disabled = true;
    try {
      await F.f.addDoc(F.f.collection(F.db, 'announcements'), {
        title: title.slice(0, 100), body: body.slice(0, 2000),
        authorUid: state.user.uid, authorName: state.profile.name,
        authorRole: state.profile.role, authorCommittee: state.profile.committee,
        createdAt: F.f.serverTimestamp()
      });
      dlg.close();
      toast('تم نشر الإعلان');
    } catch (er) { showErr(authError(er)); save.disabled = false; }
  });
  dlg.showModal();
  titleIn.focus();
}

function loadTweets(box) {
  if (!F) { renderCarousel(box, []); return; }
  const { collection, query, orderBy, limit, onSnapshot } = F.f;
  const q = query(collection(F.db, 'tweets'), orderBy('createdAt', 'desc'), limit(20));
  const unsub = onSnapshot(q, (snap) => {
    renderCarousel(box, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (e) => { console.error(e); renderCarousel(box, []); });
  onLeave(unsub);
}

function tweetCard(t) {
  const m = parseTweetUrl(t.url) || { user: CLUB.x };
  const isClub = m.user.toLowerCase() === CLUB.x.toLowerCase();
  const d = tsDate(t.createdAt);
  return el('a', { class: 'tweet', href: t.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'فتح التغريدة على إكس' },
    el('div', { class: 'tweet-top' },
      el('span', { class: 'tweet-avatar' }, isClub ? el('img', { src: 'logo.png', alt: '' }) : el('b', {}, m.user.charAt(0).toUpperCase())),
      el('span', { class: 'tweet-id' }, el('strong', {}, isClub ? CLUB.name : m.user), el('span', { dir: 'ltr' }, '@' + m.user)),
      icon('x', 'tweet-x')
    ),
    el('p', { class: 'tweet-text' + (t.image ? ' short' : '') }, t.text || ''),
    t.image && IMG_RE.test(t.image) ? el('img', { class: 'tweet-img', src: t.image, alt: 'صورة التغريدة', loading: 'lazy', referrerpolicy: 'no-referrer' }) : null,
    el('div', { class: 'tweet-foot' }, el('span', {}, d ? fmtDate(d) : ''), el('span', { class: 'open' }, 'عرض على إكس ←'))
  );
}

function renderCarousel(box, tweets) {
  box.replaceChildren();
  if (!tweets.length) {
    box.append(el('div', { class: 'tweet-empty' },
      el('strong', {}, 'ما فيه تغريدات مضافة للحين'),
      el('span', {}, 'تابع حساب النادي على إكس لآخر الأخبار.'),
      el('a', { class: 'btn btn-gold btn-sm', href: `https://x.com/${CLUB.x}`, target: '_blank', rel: 'noopener noreferrer', dir: 'ltr' }, '@' + CLUB.x)
    ));
    return;
  }
  let i = 0;
  const track = el('div', { class: 'track' });
  track.style.direction = 'ltr';
  tweets.forEach((t) => {
    const slide = el('div', { class: 'slide', role: 'group', 'aria-roledescription': 'شريحة' });
    slide.style.direction = 'rtl';
    slide.style.position = 'relative';
    slide.append(tweetCard(t));
    if (canPost()) {
      slide.append(el('button', {
        class: 'btn btn-danger btn-sm tweet-del', type: 'button', 'aria-label': 'حذف التغريدة',
        onclick: async (e) => {
          e.preventDefault();
          if (!confirm('تبي تحذف هذي التغريدة من الموقع؟')) return;
          try { await F.f.deleteDoc(F.f.doc(F.db, 'tweets', t.id)); toast('انحذفت التغريدة'); } catch (err) { toast(authError(err)); }
        }
      }, 'حذف'));
    }
    track.append(slide);
  });
  const viewport = el('div', { class: 'viewport', 'aria-live': 'polite' }, track);
  const dots = el('div', { class: 'dots' });
  const go = (n) => {
    i = (n + tweets.length) % tweets.length;
    track.style.transform = `translateX(-${i * 100}%)`;
    [...dots.children].forEach((d, k) => { d.classList.toggle('on', k === i); d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  };
  tweets.forEach((_, k) => dots.append(el('button', { class: 'dot', type: 'button', 'aria-label': `التغريدة ${k + 1}`, onclick: () => { go(k); restart(); } })));
  const arrows = tweets.length > 1 ? el('div', { class: 'arrows' },
    el('button', { class: 'arrow', type: 'button', 'aria-label': 'السابقة', html: ICON.prev, onclick: () => { go(i - 1); restart(); } }),
    el('button', { class: 'arrow', type: 'button', 'aria-label': 'التالية', html: ICON.next, onclick: () => { go(i + 1); restart(); } })
  ) : el('span');
  box.append(viewport, el('div', { class: 'car-controls' }, dots, arrows));
  go(0);

  // Auto-rotate, pause on hover/focus
  let timer = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = () => { if (tweets.length > 1 && !reduce) timer = setInterval(() => go(i + 1), 6000); };
  const stop = () => { clearInterval(timer); timer = null; };
  const restart = () => { stop(); start(); };
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', start);
  box.addEventListener('focusin', stop);
  box.addEventListener('focusout', start);
  start();
  onLeave(stop);

  // Swipe
  let x0 = null;
  let swiped = false;
  viewport.addEventListener('pointerdown', (e) => { x0 = e.clientX; swiped = false; });
  viewport.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { swiped = true; go(dx > 0 ? i - 1 : i + 1); restart(); }
  });
  // a swipe shouldn't also open the tweet
  viewport.addEventListener('click', (e) => { if (swiped) { e.preventDefault(); swiped = false; } }, true);
  viewport.addEventListener('dragstart', (e) => e.preventDefault());
}

/* ---- Add tweet ---- */
const TWEET_RE = /^https:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{5,25})(?:[/?#].*)?$/;
function parseTweetUrl(url) {
  const m = TWEET_RE.exec(String(url || '').trim());
  return m ? { user: m[1], id: m[2], url: `https://x.com/${m[1]}/status/${m[2]}` } : null;
}

// Fetch tweet text from X's public oEmbed endpoint (JSONP), parse as text only
// صور إكس فقط (pbs.twimg.com)
const IMG_RE = /^https:\/\/pbs\.twimg\.com\/[A-Za-z0-9_\/.?=&%-]{5,300}$/;
function normalizeImg(v) {
  v = String(v || '').trim();
  if (!v) return '';
  if (!IMG_RE.test(v)) return null;
  return v.replace(/([?&]name=)[a-z0-9]+/i, '$1medium');
}
// يحاول يجيب نص التغريدة وصورتها من خدمة إكس العامة (بدون حساب)
async function fetchTweetData(id) {
  try {
    const token = ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
    const r = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${encodeURIComponent(id)}&lang=ar&token=${token}`);
    if (!r.ok) return null;
    const d = await r.json();
    const media = (d.mediaDetails || []).find((m) => m.media_url_https) || null;
    const photo = (d.photos || [])[0];
    let image = media ? media.media_url_https : (photo ? photo.url : '');
    if (image && !IMG_RE.test(image)) image = '';
    const text = String(d.text || '').replace(/\s*https:\/\/t\.co\/\S+\s*$/g, '').trim();
    return { text, image };
  } catch { return null; }
}

function fetchTweetText(url) {
  return new Promise((resolve) => {
    const cb = '__oe' + Date.now() + Math.floor(Math.random() * 1000);
    const s = document.createElement('script');
    const done = (v) => { clearTimeout(to); delete window[cb]; s.remove(); resolve(v); };
    const to = setTimeout(() => done(null), 8000);
    window[cb] = (data) => {
      try {
        const doc = new DOMParser().parseFromString(String(data && data.html || ''), 'text/html');
        const p = doc.querySelector('blockquote p');
        if (!p) return done(null);
        p.querySelectorAll('br').forEach((b) => b.replaceWith('\n'));
        done(p.textContent.trim());
      } catch { done(null); }
    };
    s.onerror = () => done(null);
    s.src = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&dnt=true&callback=${cb}`;
    document.head.append(s);
  });
}

function openAddTweet() {
  const urlIn = el('input', { type: 'url', class: 'ltr', placeholder: `https://x.com/${CLUB.x}/status/...`, required: true, id: 'tw-url' });
  const textIn = el('textarea', { maxlength: '600', required: true, id: 'tw-text', placeholder: 'نص التغريدة' });
  const imgIn = el('input', { type: 'url', class: 'ltr', id: 'tw-img', maxlength: '300', placeholder: 'https://pbs.twimg.com/media/...' });
  const preview = el('img', { class: 'tw-preview hidden', alt: 'معاينة الصورة', referrerpolicy: 'no-referrer' });
  const showPreview = () => {
    const v = normalizeImg(imgIn.value);
    if (v) { preview.src = v; preview.classList.remove('hidden'); } else { preview.classList.add('hidden'); preview.removeAttribute('src'); }
  };
  imgIn.addEventListener('input', showPreview);
  const err = el('div', { class: 'err hidden' });
  const fetchBtn = el('button', { class: 'btn btn-outline btn-sm', type: 'button' }, 'جيب النص والصورة من الرابط');
  const save = el('button', { class: 'btn btn-primary', type: 'submit' }, 'إضافة');
  const dlg = el('dialog', { 'aria-labelledby': 'tw-title' });
  const form = el('form', { class: 'modal', method: 'dialog' },
    el('h2', { id: 'tw-title' }, 'إضافة تغريدة للرئيسية'),
    el('label', { class: 'field', for: 'tw-url' }, 'رابط التغريدة', urlIn, el('span', { class: 'hint' }, 'افتح التغريدة في إكس، اضغط مشاركة › نسخ الرابط، والصقه هنا.')),
    el('div', {}, fetchBtn),
    el('label', { class: 'field', for: 'tw-text' }, 'نص التغريدة', textIn, el('span', { class: 'hint' }, 'يظهر في البطاقة على الرئيسية، وإذا أحد ضغط عليها تفتح له التغريدة في إكس.')),
    el('label', { class: 'field', for: 'tw-img' }, 'رابط صورة التغريدة (اختياري)', imgIn, el('span', { class: 'hint' }, 'إذا ما انجابت تلقائيًا: في إكس اضغط على الصورة، بعدها كليك يمين ← نسخ عنوان الصورة، والصقه هنا.')),
    preview,
    err,
    el('div', { class: 'modal-actions' }, save, el('button', { class: 'btn btn-outline', type: 'button', onclick: () => dlg.close() }, 'إلغاء'))
  );
  dlg.append(form);
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  const showErr = (m) => { err.textContent = m; err.classList.toggle('hidden', !m); };

  fetchBtn.addEventListener('click', async () => {
    const p = parseTweetUrl(urlIn.value);
    if (!p) return showErr('الرابط لازم يكون رابط تغريدة من إكس، مثل: https://x.com/UQUFIT/status/123…');
    showErr('');
    fetchBtn.disabled = true; fetchBtn.textContent = 'جاري الجلب…';
    const d = await fetchTweetData(p.id);
    let text = d && d.text;
    if (!text) text = await fetchTweetText(p.url);
    fetchBtn.disabled = false; fetchBtn.textContent = 'جيب النص والصورة من الرابط';
    if (text) textIn.value = text.slice(0, 600);
    if (d && d.image) { imgIn.value = d.image; showPreview(); }
    if (!text) showErr('ما قدرنا نجيب النص تلقائيًا، اكتبه أو الصقه بنفسك.');
    else if (!(d && d.image)) showErr('انجاب النص. إذا التغريدة فيها صورة، الصق رابطها بنفسك.');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p = parseTweetUrl(urlIn.value);
    const text = textIn.value.trim();
    if (!p) return showErr('الرابط لازم يكون رابط تغريدة من إكس.');
    if (!text) return showErr('اكتب نص التغريدة.');
    const image = normalizeImg(imgIn.value);
    if (image === null) return showErr('رابط الصورة لازم يكون من إكس ويبدأ بـ https://pbs.twimg.com/');
    save.disabled = true;
    try {
      await F.f.addDoc(F.f.collection(F.db, 'tweets'), {
        url: p.url, text: text.slice(0, 600), image,
        authorUid: state.user.uid, authorName: state.profile.name,
        createdAt: F.f.serverTimestamp()
      });
      dlg.close();
      toast('انضافت التغريدة للرئيسية');
    } catch (er) { showErr(authError(er)); save.disabled = false; }
  });
  dlg.showModal();
  urlIn.focus();
}

/* ============ Leaders ============ */
function leaders() {
  const list = el('div', { class: 'grid' }, el('div', { class: 'loading' }, 'جاري التحميل…'));
  let filter = 'all';
  let people = [];
  const chips = el('div', { class: 'filters', role: 'group', 'aria-label': 'تصفية حسب اللجنة' });
  const drawChips = () => {
    chips.replaceChildren(...[{ id: 'all', name: 'الكل' }, { id: 'board', name: 'رئاسة النادي' }, ...COMMITTEES].map((c) =>
      el('button', { type: 'button', class: 'chip' + (filter === c.id ? ' on' : ''), 'aria-pressed': String(filter === c.id), onclick: () => { filter = c.id; drawChips(); draw(); } }, c.name.replace(/^لجنة /, ''))
    ));
  };
  const person = (p) => el('article', { class: 'member-card' + (p.role === 'deputy' ? ' dep' : '') },
    el('span', { class: `big-avatar av-${p.role}` }, initial(p.name)),
    el('h3', {}, p.name),
    el('p', { class: 'member-title' }, roleTitle(p)),
    badge(p.role),
    socialLinks(p));
  const EMPTY_LABEL = { president: 'رئيس النادي', vp: 'نائب الرئيس', leader: 'القائد', deputy: 'النائب' };
  const emptyCard = (role) => el('div', { class: 'member-card empty' },
    el('span', { class: 'big-avatar av-member' }, '؟'),
    el('h3', {}, EMPTY_LABEL[role]),
    el('p', { class: 'member-title' }, 'لم يُحدَّد بعد'));
  // يعرض الموجودين ويكمّل الباقي ببطاقات "لم يُحدَّد بعد" (قائدين ونائبين لكل لجنة، ٣ نواب للرئيس)
  const fill = (arr, n, role) => {
    const cards = arr.map(person);
    for (let k = arr.length; k < n; k++) cards.push(emptyCard(role));
    return cards;
  };
  const draw = () => {
    const coms = COMMITTEES.filter((c) => filter === 'all' || c.id === filter);
    const blocks = [];
    if (filter === 'all' || filter === 'board') {
      const pres = people.filter((p) => p.role === 'president');
      const vps = people.filter((p) => p.role === 'vp');
      const vpCards = fill(vps, 3, 'vp');
      blocks.push(el('section', { class: 'team-block board' },
        el('h2', { class: 'team-title' }, 'رئاسة النادي'),
        el('div', { class: 'team-grid board-top' }, pres.length ? pres.map(person) : emptyCard('president')),
        el('div', { class: 'team-grid' }, vpCards)));
    }
    if (filter === 'board') { list.replaceChildren(...blocks); return; }
    list.replaceChildren(...blocks, ...coms.map((c) => {
      const ls = people.filter((p) => p.committee === c.id && p.role === 'leader');
      const ds = people.filter((p) => p.committee === c.id && p.role === 'deputy');
      return el('section', { class: 'team-block' },
        el('h2', { class: 'team-title' }, c.name),
        el('div', { class: 'team-grid' },
          fill(ls, 2, 'leader'),
          fill(ds, 2, 'deputy')));
    }));
  };
  app.append(
    el('section', { class: 'page-head' }, el('div', { class: 'wrap' }, el('h1', {}, 'فريق القادات'), el('p', {}, 'رئاسة النادي، وقادة ونواب اللجان، وحساباتهم.'))),
    el('section', { class: 'page-body' }, el('div', { class: 'wrap' }, chips, list))
  );
  list.className = 'teams';
  drawChips();
  if (!F) { people = []; draw(); return; }
  const { collection, query, where, onSnapshot } = F.f;
  const unsub = onSnapshot(query(collection(F.db, 'profiles'), where('role', 'in', LEAD_ROLES)),
    (snap) => { people = snap.docs.map((d) => ({ id: d.id, ...d.data() })); draw(); },
    (e) => { console.error(e); draw(); });
  onLeave(unsub);
}

/* ============ Auth pages ============ */
function authShell(active, ...content) {
  app.append(
    el('section', { class: 'page-head' }, el('div', { class: 'wrap' }, el('h1', {}, active === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'), el('p', {}, active === 'login' ? 'ادخل بحسابك عشان توصل للشات.' : 'سجّل بياناتك واختر صفتك في النادي.'))),
    el('section', { class: 'page-body' }, el('div', { class: 'wrap' }, el('div', { class: 'card auth-wrap' },
      el('div', { class: 'form' },
        el('div', { class: 'tabs' },
          el('a', { href: '#/register', class: active === 'register' ? 'on' : '' }, 'حساب جديد'),
          el('a', { href: '#/login', class: active === 'login' ? 'on' : '' }, 'تسجيل الدخول')),
        ...content))))
  );
}

function needConfig() {
  app.append(el('section', { class: 'page-body' }, el('div', { class: 'wrap' }, el('div', { class: 'card' }, 'لازم تربط الموقع بـ Firebase أول (config.js).'))));
}

function login() {
  if (!F) return needConfig();
  if (state.user && state.profile) { location.hash = '#/committees'; return; }
  const email = el('input', { type: 'email', id: 'li-email', class: 'ltr', autocomplete: 'email', required: true });
  const pass = el('input', { type: 'password', id: 'li-pass', autocomplete: 'current-password', required: true });
  const err = el('div', { class: 'err hidden' });
  const btn = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'دخول');
  const showErr = (m) => { err.textContent = m; err.classList.toggle('hidden', !m); };
  const form = el('form', { class: 'form', novalidate: true },
    el('label', { class: 'field', for: 'li-email' }, 'البريد الإلكتروني', email),
    el('label', { class: 'field', for: 'li-pass' }, 'كلمة المرور', pass),
    el('div', {}, el('button', { type: 'button', class: 'link-btn', onclick: async () => {
      if (!email.value) return showErr('اكتب بريدك أول، بعدين اضغط نسيت كلمة المرور.');
      try { await F.a.sendPasswordResetEmail(F.auth, email.value.trim()); toast('أرسلنا رابط إعادة التعيين لبريدك'); } catch (e) { showErr(authError(e)); }
    } }, 'نسيت كلمة المرور؟')),
    err, btn);
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); showErr(''); btn.disabled = true;
    try {
      await F.a.signInWithEmailAndPassword(F.auth, email.value.trim(), pass.value);
      location.hash = '#/committees';
    } catch (er) { showErr(authError(er)); btn.disabled = false; }
  });
  authShell('login', form);
}

function register() {
  if (!F) return needConfig();
  const completing = !!(state.user && !state.profile); // account exists, profile missing
  if (state.user && state.profile) { location.hash = '#/committees'; return; }
  const f = (id, label, input, hint) => el('label', { class: 'field', for: id }, label, input, hint ? el('span', { class: 'hint' }, hint) : null);
  const name = el('input', { id: 'r-name', type: 'text', minlength: '2', maxlength: '60', autocomplete: 'name', required: true, placeholder: 'مثال: عبدالله محمد' });
  const sid = el('input', { id: 'r-sid', type: 'text', inputmode: 'numeric', pattern: '[0-9]{6,12}', maxlength: '12', class: 'ltr', required: true, placeholder: '44xxxxxxx' });
  const email = el('input', { id: 'r-email', type: 'email', class: 'ltr', autocomplete: 'email', required: true, placeholder: 's44xxxxxxx@uqu.edu.sa' });
  const phone = el('input', { id: 'r-phone', type: 'tel', class: 'ltr', pattern: '05[0-9]{8}', maxlength: '10', autocomplete: 'tel', required: true, placeholder: '05xxxxxxxx' });
  const college = el('select', { id: 'r-college', required: true }, el('option', { value: '' }, 'اختر كليتك'), COLLEGES.map((c) => el('option', { value: c }, c)));
  const committee = el('select', { id: 'r-com', required: true }, el('option', { value: '' }, 'اختر لجنتك'), COMMITTEES.map((c) => el('option', { value: c.id }, c.name)));
  const xIn = el('input', { id: 'r-x', type: 'text', class: 'ltr', maxlength: '60', placeholder: '@username' });
  const liIn = el('input', { id: 'r-li', type: 'url', class: 'ltr', maxlength: '150', placeholder: 'https://www.linkedin.com/in/...' });
  const pass = el('input', { id: 'r-pass', type: 'password', minlength: '8', autocomplete: 'new-password', required: true, placeholder: '٨ أحرف على الأقل' });
  const pass2 = el('input', { id: 'r-pass2', type: 'password', minlength: '8', autocomplete: 'new-password', required: true });
  const opt = (v, t, d, checked) => el('label', { class: 'role-opt' }, el('input', { type: 'radio', name: 'role', value: v, checked }), el('span', {}, el('b', {}, t), d ? el('small', {}, d) : null));
  const note = el('div', { class: 'note hidden' }, icon('info'), el('span', {}, 'بتظهر في صفحة القادات وينفتح لك شات القادة وإضافة التغريدات بعد ما تعتمد إدارة النادي صفتك.'));
  const roles = el('fieldset', {}, el('legend', {}, 'صفتك في النادي'),
    el('div', { class: 'role-pick' },
      opt('president', 'رئيس النادي'),
      opt('vp', 'نائب رئيس النادي'),
      opt('leader', 'قائد اللجنة'),
      opt('deputy', 'نائب قائد اللجنة'),
      opt('member', 'عضو', null, true)));
  roles.addEventListener('change', () => {
    const r = roles.querySelector('input:checked').value;
    note.classList.toggle('hidden', r === 'member');
    // رئيس النادي ونوابه ما يحتاجون لجنة
    committee.closest('label').classList.toggle('hidden', isBoardRole(r));
  });
  const err = el('div', { class: 'err hidden' });
  const btn = el('button', { class: 'btn btn-primary btn-block', type: 'submit' }, completing ? 'حفظ البيانات' : 'إنشاء الحساب');
  const showErr = (m) => { err.textContent = m; err.classList.toggle('hidden', !m); if (m) err.scrollIntoView({ block: 'center', behavior: 'smooth' }); };

  const form = el('form', { class: 'form', novalidate: true },
    completing ? el('div', { class: 'note' }, icon('info'), el('span', {}, 'حسابك موجود بس بياناته ناقصة، كمّلها عشان تدخل.')) : null,
    el('div', { class: 'form-grid' },
      f('r-name', 'الاسم الكامل', name),
      f('r-sid', 'الرقم الجامعي', sid),
      completing ? null : f('r-email', 'البريد الإلكتروني', email, REQUIRE_UQU_EMAIL ? 'لازم يكون بريدك الجامعي @uqu.edu.sa' : null),
      f('r-phone', 'رقم الجوال', phone),
      f('r-college', 'الكلية', college),
      f('r-com', 'اللجنة', committee)
    ),
    roles, note,
    el('div', { class: 'form-grid' },
      f('r-x', 'حسابك في إكس (اختياري)', xIn, 'يظهر في صفحة القادات إذا صرت قائد أو نائب'),
      f('r-li', 'رابط لنكدإن (اختياري)', liIn)),
    completing ? null : el('div', { class: 'form-grid' }, f('r-pass', 'كلمة المرور', pass), f('r-pass2', 'تأكيد كلمة المرور', pass2)),
    err, btn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); showErr('');
    const v = {
      name: name.value.trim(), sid: sid.value.trim(), email: email.value.trim().toLowerCase(), phone: phone.value.trim(),
      college: college.value, committee: committee.value, role: roles.querySelector('input:checked').value
    };
    if (v.name.length < 2) return showErr('اكتب اسمك الكامل.');
    if (!/^[0-9]{6,12}$/.test(v.sid)) return showErr('الرقم الجامعي لازم يكون أرقام فقط.');
    if (!completing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return showErr('البريد غير صحيح.');
    if (!completing && REQUIRE_UQU_EMAIL && !/@uqu\.edu\.sa$/.test(v.email)) return showErr('لازم تسجّل ببريدك الجامعي @uqu.edu.sa');
    if (!/^05[0-9]{8}$/.test(v.phone)) return showErr('رقم الجوال لازم يبدأ بـ 05 ويكون ١٠ أرقام.');
    if (!v.college) return showErr('اختر كليتك.');
    if (isBoardRole(v.role)) v.committee = 'board';
    if (!v.committee) return showErr('اختر لجنتك.');
    v.x = normalizeX(xIn.value);
    v.linkedin = normalizeLinkedin(liIn.value);
    if (v.x === null) return showErr('حساب إكس غير صحيح، اكتبه مثل: @username');
    if (v.linkedin === null) return showErr('رابط لنكدإن لازم يكون مثل: https://www.linkedin.com/in/اسمك');
    if (!completing && pass.value.length < 8) return showErr('كلمة المرور لازم ٨ أحرف على الأقل.');
    if (!completing && pass.value !== pass2.value) return showErr('كلمتا المرور غير متطابقتين.');
    btn.disabled = true;
    state.busy = true;
    try {
      let user = state.user;
      if (!completing) {
        const cred = await F.a.createUserWithEmailAndPassword(F.auth, v.email, pass.value);
        user = cred.user;
      }
      const { writeBatch, doc, serverTimestamp, increment } = F.f;
      const makeBatch = (withCount) => {
        const b = writeBatch(F.db);
        b.set(doc(F.db, 'profiles', user.uid), {
          name: v.name, college: v.college, committee: v.committee,
          role: 'member', requestedRole: v.role, x: v.x, linkedin: v.linkedin, createdAt: serverTimestamp()
        });
        b.set(doc(F.db, 'users', user.uid), {
          studentId: v.sid, phone: v.phone, email: user.email, createdAt: serverTimestamp()
        });
        // عدّاد أعضاء اللجنة يزيد واحد مع التسجيل
        if (withCount && v.committee !== 'board') b.set(doc(F.db, 'stats', 'committees'), { [v.committee]: increment(1) }, { merge: true });
        return b;
      };
      try { await makeBatch(true).commit(); } catch (er) {
        if (er && er.code === 'permission-denied') await makeBatch(false).commit(); else throw er;
      }
      if (!user.emailVerified) { try { await F.a.sendEmailVerification(user); } catch { /* ignore */ } }
      await loadProfile();
      renderNavAuth();
      state.busy = false;
      toast('تم إنشاء حسابك! فعّل بريدك من الرسالة اللي وصلتك.');
      location.hash = '#/committees';
    } catch (er) { console.error(er); state.busy = false; showErr(authError(er)); btn.disabled = false; }
  });
  authShell('register', form);
}

/* ============ Committees (بدل الشات) ============ */
// القادة (الرئاسة + قادة ونواب اللجان) والمشرف يشوفون كل اللجان: العدد، الأسماء، الإعلانات.
// العضو العادي يشوف لجنته بس.
function committees() {
  app.append(el('section', { class: 'page-head' }, el('div', { class: 'wrap' }, el('h1', {}, 'اللجان'), el('p', {}, 'عدد أعضاء كل لجنة، وأسماؤهم، وإعلانات اللجنة.'))));
  const body = el('div', { class: 'wrap' });
  app.append(el('section', { class: 'page-body' }, body));

  if (!F) return body.append(el('div', { class: 'card' }, 'لازم تربط الموقع بـ Firebase أول.'));
  if (!state.user) return body.append(el('div', { class: 'card center-state' }, el('h2', {}, 'سجّل دخولك عشان تشوف اللجان'), el('p', {}, 'صفحة اللجان للأعضاء المسجّلين فقط.'), el('div', { class: 'hero-actions' }, el('a', { class: 'btn btn-primary', href: '#/login' }, 'تسجيل الدخول'), el('a', { class: 'btn btn-outline', href: '#/register' }, 'حساب جديد'))));
  if (!state.profile) { location.hash = '#/register'; return; }
  if (!state.user.emailVerified) {
    return body.append(el('div', { class: 'card center-state' },
      el('span', { class: 'lock-ico', html: ICON.mail }),
      el('h2', {}, 'فعّل بريدك أول'),
      el('p', {}, `أرسلنا رابط تفعيل إلى ${state.user.email}. افتحه وبعدين اضغط "فعّلته". (شيّك على الرسائل غير المرغوب فيها)`),
      el('div', { class: 'hero-actions' },
        el('button', { class: 'btn btn-primary', type: 'button', onclick: async () => {
          await state.user.reload();
          if (F.auth.currentUser.emailVerified) { await F.auth.currentUser.getIdToken(true); state.user = F.auth.currentUser; route(); } else toast('للحين ما تفعّل، تأكد من الرابط.');
        } }, 'فعّلته'),
        el('button', { class: 'btn btn-outline', type: 'button', onclick: async () => {
          try { await F.a.sendEmailVerification(state.user); toast('أرسلنا الرابط مرة ثانية'); } catch (e) { toast(authError(e)); }
        } }, 'إعادة الإرسال'))));
  }

  const p = state.profile;
  const allAccess = isLeaderRole(p.role) || state.isAdmin;
  const visible = allAccess ? COMMITTEES : COMMITTEES.filter((c) => c.id === p.committee);
  if (!visible.length) return body.append(el('div', { class: 'card' }, 'ما عندك لجنة محددة.'));
  // من يقدر ينشر في لجنة معيّنة
  const canPostIn = (cid) => state.isAdmin || isBoardRole(p.role) || ((p.role === 'leader' || p.role === 'deputy') && p.committee === cid);

  let current = (allAccess && p.committee && visible.some((c) => c.id === p.committee)) ? p.committee : visible[0].id;
  let people = [];
  let annUnsub = null;
  onLeave(() => annUnsub && annUnsub());

  const tabs = el('div', { class: 'filters', role: 'tablist', 'aria-label': 'اللجان' });
  const summary = el('div', { class: 'com-summary' });
  const panel = el('div', { class: 'com-panel' });
  if (!allAccess) body.append(el('div', { class: 'note', style: 'margin-bottom:20px' }, icon('info'), el('span', {}, 'تشوف لجنتك بس. القادة يشوفون كل اللجان.')));
  // القادة يتنقلون بين اللجان من بطاقات الأعداد، والعضو يشوف لجنته بس
  body.append(allAccess ? summary : null, panel);

  const countOf = (cid) => people.filter((x) => x.committee === cid).length;
  const ORDER = { leader: 0, deputy: 1, member: 2 };

  const drawSummary = () => {
    if (!allAccess) return;
    const total = people.filter((x) => COMMITTEES.some((c) => c.id === x.committee)).length;
    summary.replaceChildren(
      el('div', { class: 'stat total' }, el('strong', {}, String(total)), el('span', {}, 'إجمالي أعضاء اللجان')),
      ...COMMITTEES.map((c) => el('button', { type: 'button', class: 'stat' + (current === c.id ? ' on' : ''), onclick: () => select(c.id) },
        el('strong', {}, String(countOf(c.id))), el('span', {}, c.name.replace(/^لجنة /, '')))));
  };
  const drawTabs = () => {
    tabs.replaceChildren(...visible.map((c) => el('button', {
      type: 'button', role: 'tab', class: 'chip' + (current === c.id ? ' on' : ''), 'aria-selected': String(current === c.id), onclick: () => select(c.id)
    }, c.name.replace(/^لجنة /, ''), ' ', el('span', { class: 'chip-count' }, String(countOf(c.id))))));
  };

  const membersBox = el('div', { class: 'card' });
  const annBox = el('div', { class: 'card' });
  panel.append(el('div', { class: 'com-cols' }, annBox, membersBox));

  const drawMembers = () => {
    const c = COMMITTEES.find((x) => x.id === current);
    const list = people.filter((x) => x.committee === current)
      .sort((a, b) => (ORDER[a.role] ?? 3) - (ORDER[b.role] ?? 3) || String(a.name).localeCompare(String(b.name), 'ar'));
    membersBox.replaceChildren(
      el('div', { class: 'box-head' }, el('h2', {}, 'أعضاء ' + c.name.replace(/^لجنة /, 'اللجنة: ')), el('span', { class: 'big-count' }, String(list.length), el('small', {}, ' ' + membersLabel(list.length)))),
      list.length
        ? el('ol', { class: 'member-list' }, list.map((m) => el('li', {},
            el('span', { class: `avatar av-${m.role || 'member'}` }, initial(m.name)),
            el('span', { class: 'm-info' }, el('strong', {}, m.name || ''), el('span', {}, m.college || '')),
            badge(m.role || 'member'),
            socialLinks(m))))
        : el('p', { class: 'empty-line' }, 'ما فيه أعضاء مسجّلين في هذي اللجنة للحين.'));
  };

  const drawAnnouncements = (items) => {
    const c = COMMITTEES.find((x) => x.id === current);
    const head = el('div', { class: 'box-head' },
      el('h2', {}, 'إعلانات اللجنة'),
      canPostIn(current) ? el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => openCommitteeAnnouncement(current) }, '+ إعلان للجنة') : null);
    if (items === null) return annBox.replaceChildren(head, el('div', { class: 'loading' }, 'جاري التحميل…'));
    annBox.replaceChildren(head, items.length
      ? el('div', { class: 'ann-list one' }, items.map((a) => committeeAnnCard(a, current)))
      : el('p', { class: 'empty-line' }, `ما فيه إعلانات لـ${c.name} للحين.`));
  };

  const loadAnn = () => {
    if (annUnsub) { annUnsub(); annUnsub = null; }
    drawAnnouncements(null);
    const { collection, query, orderBy, limit, onSnapshot } = F.f;
    annUnsub = onSnapshot(query(collection(F.db, 'committees', current, 'announcements'), orderBy('createdAt', 'desc'), limit(50)),
      (snap) => drawAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => { console.error(e); annBox.replaceChildren(el('div', { class: 'err' }, authError(e))); });
  };

  const select = (cid) => { current = cid; drawTabs(); drawSummary(); drawMembers(); loadAnn(); };

  // الأعضاء: القادة يجيبون الكل، العضو يجيب لجنته بس
  const { collection, query, where, onSnapshot } = F.f;
  const q = allAccess ? collection(F.db, 'profiles') : query(collection(F.db, 'profiles'), where('committee', '==', p.committee));
  onLeave(onSnapshot(q, (snap) => {
    people = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    drawTabs(); drawSummary(); drawMembers();
  }, (e) => { console.error(e); membersBox.replaceChildren(el('div', { class: 'err' }, authError(e))); }));

  drawTabs(); drawSummary(); drawMembers(); loadAnn();
}

function committeeAnnCard(a, cid) {
  const d = tsDate(a.createdAt);
  const isNew = d && (Date.now() - d.getTime()) < 3 * 24 * 3600 * 1000;
  const p = state.profile || {};
  const canDel = state.user && (a.authorUid === state.user.uid || state.isAdmin || isBoardRole(p.role) || ((p.role === 'leader' || p.role === 'deputy') && p.committee === cid));
  return el('article', { class: 'ann' + (isNew ? ' is-new' : '') },
    el('div', { class: 'ann-top' }, el('h3', {}, a.title || ''), isNew ? el('span', { class: 'badge b-new' }, 'جديد') : null),
    el('p', { class: 'ann-body open' }, a.body || ''),
    el('div', { class: 'ann-foot' },
      el('span', { class: `avatar av-${a.authorRole || 'leader'}` }, initial(a.authorName)),
      el('span', { class: 'ann-author' }, el('strong', {}, a.authorName || ''), el('span', {}, ROLE_LABEL[a.authorRole] || '')),
      el('time', {}, d ? fmtDate(d) : ''),
      canDel ? el('button', { class: 'msg-del', type: 'button', 'aria-label': 'حذف الإعلان', onclick: async () => {
        if (!confirm('تبي تحذف هذا الإعلان؟')) return;
        try { await F.f.deleteDoc(F.f.doc(F.db, 'committees', cid, 'announcements', a.id)); toast('انحذف الإعلان'); } catch (e) { toast(authError(e)); }
      } }, 'حذف') : null));
}

function openCommitteeAnnouncement(cid) {
  const c = COMMITTEES.find((x) => x.id === cid);
  const titleIn = el('input', { type: 'text', id: 'ca-title', maxlength: '100', required: true, placeholder: 'مثال: موعد اجتماع اللجنة' });
  const bodyIn = el('textarea', { id: 'ca-body', maxlength: '2000', required: true, placeholder: 'تفاصيل الإعلان' });
  const err = el('div', { class: 'err hidden' });
  const save = el('button', { class: 'btn btn-primary', type: 'submit' }, 'نشر');
  const dlg = el('dialog', { 'aria-labelledby': 'ca-h' });
  const showErr = (m) => { err.textContent = m; err.classList.toggle('hidden', !m); };
  const form = el('form', { class: 'modal' },
    el('h2', { id: 'ca-h' }, 'إعلان لـ' + c.name),
    el('label', { class: 'field', for: 'ca-title' }, 'العنوان', titleIn),
    el('label', { class: 'field', for: 'ca-body' }, 'النص', bodyIn),
    el('p', { class: 'hint' }, 'يشوفه أعضاء اللجنة وكل القادة، ما يطلع في الصفحة الرئيسية.'),
    err,
    el('div', { class: 'modal-actions' }, save, el('button', { class: 'btn btn-outline', type: 'button', onclick: () => dlg.close() }, 'إلغاء')));
  dlg.append(form);
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleIn.value.trim();
    const text = bodyIn.value.trim();
    if (!title) return showErr('اكتب عنوان الإعلان.');
    if (!text) return showErr('اكتب نص الإعلان.');
    save.disabled = true;
    try {
      await F.f.addDoc(F.f.collection(F.db, 'committees', cid, 'announcements'), {
        title: title.slice(0, 100), body: text.slice(0, 2000),
        authorUid: state.user.uid, authorName: state.profile.name, authorRole: state.profile.role,
        createdAt: F.f.serverTimestamp()
      });
      dlg.close();
      toast('تم نشر الإعلان');
    } catch (er) { showErr(authError(er)); save.disabled = false; }
  });
  dlg.showModal();
  titleIn.focus();
}

/* ============ Account ============ */
function account() {
  app.append(el('section', { class: 'page-head' }, el('div', { class: 'wrap' }, el('h1', {}, 'حسابي'), el('p', {}, 'عدّل اسمك وحساباتك اللي تظهر في صفحة القادات.'))));
  const body = el('div', { class: 'wrap' });
  app.append(el('section', { class: 'page-body' }, body));
  if (!F) return body.append(el('div', { class: 'card' }, 'لازم تربط الموقع بـ Firebase أول.'));
  if (!state.user) { location.hash = '#/login'; return; }
  if (!state.profile) { location.hash = '#/register'; return; }
  const p = state.profile;
  const f = (id, label, input, hint) => el('label', { class: 'field', for: id }, label, input, hint ? el('span', { class: 'hint' }, hint) : null);
  const name = el('input', { id: 'a-name', type: 'text', minlength: '2', maxlength: '60', required: true, value: p.name || '' });
  const college = el('select', { id: 'a-college' }, COLLEGES.map((c) => el('option', { value: c, selected: c === p.college }, c)));
  const xIn = el('input', { id: 'a-x', type: 'text', class: 'ltr', maxlength: '60', placeholder: '@username', value: p.x ? '@' + p.x : '' });
  const liIn = el('input', { id: 'a-li', type: 'url', class: 'ltr', maxlength: '150', placeholder: 'https://www.linkedin.com/in/...', value: p.linkedin || '' });
  const err = el('div', { class: 'err hidden' });
  const btn = el('button', { class: 'btn btn-primary', type: 'submit' }, 'حفظ');
  const showErr = (m) => { err.textContent = m; err.classList.toggle('hidden', !m); };
  const pending = p.requestedRole !== p.role && p.requestedRole !== 'member';
  const form = el('form', { class: 'form', novalidate: true },
    el('div', { class: 'row-info' },
      el('span', {}, 'صفتك: '), badge(p.role),
      pending ? el('span', { class: 'badge b-pending' }, 'طلب ' + ROLE_LABEL[p.requestedRole] + ' بانتظار الاعتماد') : null,
      el('span', { class: 'hint' }, ' · ' + committeeName(p.committee))),
    el('div', { class: 'form-grid' }, f('a-name', 'الاسم', name), f('a-college', 'الكلية', college)),
    el('div', { class: 'form-grid' }, f('a-x', 'حسابك في إكس', xIn), f('a-li', 'رابط لنكدإن', liIn)),
    err, el('div', {}, btn));
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); showErr('');
    const v = { name: name.value.trim(), college: college.value, x: normalizeX(xIn.value), linkedin: normalizeLinkedin(liIn.value) };
    if (v.name.length < 2) return showErr('اكتب اسمك.');
    if (v.x === null) return showErr('حساب إكس غير صحيح، اكتبه مثل: @username');
    if (v.linkedin === null) return showErr('رابط لنكدإن لازم يكون مثل: https://www.linkedin.com/in/اسمك');
    btn.disabled = true;
    try {
      await F.f.updateDoc(F.f.doc(F.db, 'profiles', state.user.uid), v);
      Object.assign(state.profile, v);
      renderNavAuth();
      toast('تم الحفظ');
    } catch (er) { showErr(authError(er)); }
    btn.disabled = false;
  });
  body.append(el('div', { class: 'card auth-wrap' }, form));
}

/* ============ Admin ============ */
function admin() {
  app.append(el('section', { class: 'page-head' }, el('div', { class: 'wrap' }, el('h1', {}, 'اعتماد القادات'), el('p', {}, 'اعتمد أو ارفض الطلبات. الحد: رئيس واحد، ٣ نواب للرئيس، وقائدين ونائبين لكل لجنة.'))));
  const body = el('div', { class: 'wrap' });
  app.append(el('section', { class: 'page-body' }, body));
  if (!F || !state.isAdmin) return body.append(el('div', { class: 'card' }, 'هذي الصفحة لإدارة النادي فقط.'));

  const pend = el('div', { class: 'table-wrap' });
  const all = el('div', { class: 'table-wrap' });
  const recount = el('button', { class: 'btn btn-outline btn-sm', type: 'button', onclick: async () => {
    recount.disabled = true;
    try {
      const snap = await F.f.getDocs(F.f.collection(F.db, 'profiles'));
      const counts = Object.fromEntries(COMMITTEES.map((c) => [c.id, 0]));
      snap.forEach((d) => { const c = d.data().committee; if (c in counts) counts[c] += 1; });
      await F.f.setDoc(F.f.doc(F.db, 'stats', 'committees'), counts);
      toast('تم تحديث أعداد اللجان');
    } catch (e) { toast(authError(e)); }
    recount.disabled = false;
  } }, 'إعادة حساب أعداد اللجان');
  body.append(el('div', { class: 'sec-head' }, el('h2', {}, 'طلبات بانتظار الاعتماد'), recount), pend, el('h2', {}, 'الرئاسة والقادة والنواب الحاليين'), all);

  const { collection, query, where, onSnapshot, updateDoc, doc } = F.f;
  const LIMITS = { president: 1, vp: 3, leader: 2, deputy: 2 };
  let leadRows = [];
  const setRole = async (id, role) => {
    try { await updateDoc(doc(F.db, 'profiles', id), { role, requestedRole: role }); toast('تم التحديث'); } catch (e) { toast(authError(e)); }
  };
  const table = (rows, actions, emptyText) => {
    if (!rows.length) return el('div', { class: 'card' }, emptyText);
    return el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}, 'الاسم'), el('th', {}, 'اللجنة'), el('th', {}, 'الكلية'), el('th', {}, 'الصفة'), el('th', {}, 'إجراء'))),
      el('tbody', {}, rows.map((r) => el('tr', {},
        el('td', {}, r.name), el('td', {}, committeeName(r.committee)), el('td', {}, r.college || ''),
        el('td', {}, badge(r.role), r.requestedRole !== r.role ? [' ← ', el('span', { class: 'badge b-pending' }, 'يطلب ' + ROLE_LABEL[r.requestedRole])] : null),
        el('td', {}, el('div', { class: 'row-actions' }, actions(r)))))));
  };
  onLeave(onSnapshot(query(collection(F.db, 'profiles'), where('requestedRole', 'in', LEAD_ROLES)), (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.role !== r.requestedRole);
    pend.replaceChildren(table(rows, (r) => {
      // لو انرفض طلب رئاسة النادي، لازم يتحط في لجنة
      const comSel = isBoardRole(r.requestedRole)
        ? el('select', { class: 'mini-sel', 'aria-label': 'لجنته لو انرفض' }, COMMITTEES.map((c) => el('option', { value: c.id }, c.name)))
        : null;
      return [
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => {
          const want = r.requestedRole;
          const taken = leadRows.filter((x) => x.role === want && (isBoardRole(want) || x.committee === r.committee)).length;
          const max = LIMITS[want];
          if (taken >= max && !confirm(`${isBoardRole(want) ? 'رئاسة النادي' : committeeName(r.committee)} فيها ${taken} ${ROLE_LABEL[want]} (الحد ${max}). تبي تعتمده برضو؟`)) return;
          setRole(r.id, want);
        } }, 'اعتماد'),
        comSel,
        el('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: async () => {
          const upd = { role: 'member', requestedRole: 'member' };
          if (comSel) upd.committee = comSel.value;
          try {
            const bt = F.f.writeBatch(F.db);
            bt.update(doc(F.db, 'profiles', r.id), upd);
            if (comSel) bt.set(doc(F.db, 'stats', 'committees'), { [comSel.value]: F.f.increment(1) }, { merge: true });
            await bt.commit(); toast('تم رفض الطلب');
          } catch (e) { toast(authError(e)); }
        } }, 'رفض')
      ];
    }, 'ما فيه طلبات جديدة.'));
  }, (e) => pend.replaceChildren(el('div', { class: 'err' }, authError(e)))));
  const ORDER = { president: 0, vp: 1, leader: 2, deputy: 3 };
  onLeave(onSnapshot(query(collection(F.db, 'profiles'), where('role', 'in', LEAD_ROLES)), (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => ORDER[a.role] - ORDER[b.role]);
    leadRows = rows;
    all.replaceChildren(table(rows, (r) => {
      const roleSel = el('select', { class: 'mini-sel', 'aria-label': 'الصفة' }, LEAD_ROLES.concat('member').map((k) => el('option', { value: k, selected: k === r.role }, ROLE_LABEL[k])));
      const comSel = el('select', { class: 'mini-sel', 'aria-label': 'اللجنة' }, COMMITTEES.map((c) => el('option', { value: c.id, selected: c.id === r.committee }, c.name)));
      const syncCom = () => comSel.classList.toggle('hidden', isBoardRole(roleSel.value));
      roleSel.addEventListener('change', syncCom); syncCom();
      return [roleSel, comSel,
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: async () => {
          const role = roleSel.value;
          if (role === 'member' && !confirm('إزالة الصفة وإرجاعه عضو؟')) return;
          const committee = isBoardRole(role) ? 'board' : comSel.value;
          try {
            const bt = F.f.writeBatch(F.db);
            bt.update(doc(F.db, 'profiles', r.id), { role, requestedRole: role, committee });
            if (committee !== r.committee) {
              const upd = {};
              if (r.committee && r.committee !== 'board') upd[r.committee] = F.f.increment(-1);
              if (committee !== 'board') upd[committee] = F.f.increment(1);
              if (Object.keys(upd).length) bt.set(doc(F.db, 'stats', 'committees'), upd, { merge: true });
            }
            await bt.commit(); toast('تم التحديث');
          } catch (e) { toast(authError(e)); }
        } }, 'حفظ'),
        el('button', { class: 'btn btn-outline btn-sm', type: 'button', onclick: async () => {
          const t = prompt('المنصب اللي يظهر تحت اسمه في صفحة القادات (مثال: نائب الرئيس للشؤون الإدارية). خلّه فاضي للمنصب الافتراضي:', r.title || '');
          if (t === null) return;
          try { await updateDoc(doc(F.db, 'profiles', r.id), { title: t.trim().slice(0, 60) }); toast('تم تحديث المنصب'); } catch (e) { toast(authError(e)); }
        } }, 'المنصب')];
    }, 'ما فيه قادة معتمدين للحين.'));
  }));
}

/* ============ Boot ============ */
(async () => {
  renderNavAuth();
  try { await initFirebase(); } catch (e) { console.error('Firebase init failed', e); }
  state.ready = true;
  route();
})();
