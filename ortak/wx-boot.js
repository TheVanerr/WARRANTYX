/* WarrantyX açılışı: veritabanı bağlantısı. P&PX'in ppx-boot.js düzenini izler.
   Veritabanı özel bir GitHub deposudur (warrantyx-veri). Her kayıt önce bu cihazın tarayıcı veritabanına
   (IndexedDB) yazılır, sonra en geç 1 dakikada bir tek commit olarak depoya gönderilir.
   Bağlantı ayarı ve erişim anahtarı yalnız bu tarayıcıda (localStorage) durur. */

(function () {
  'use strict';

  const SETTINGS_KEY = 'wx_ayarlar';
  const DB_NAME = 'warrantyx-veri';
  const DEFAULT_REPO = 'TheVanerr/warrantyx-veri';
  const FOREGROUND_SYNC_MS = 5 * 60 * 1000;
  const FOCUS_SYNC_GAP_MS = 60 * 1000;
  const FIRST_SYNC_WAIT_MS = 3000;

  const README = {
    message: 'WarrantyX veri deposu',
    text: [
      '# WarrantyX veri deposu',
      '',
      'Dolfin garanti belgeleri. Bu depo WarrantyX programı tarafından yönetilir; dosyaları elle değiştirmeyin.',
      '',
      '- `ayarlar.json`: firma bilgileri ve garanti varsayılanları',
      '- `belgeler/<Seri No>.json`: her garanti belgesi bir dosya',
      '',
      'Eski bir sürüm GitHub geçmişinden alınabilir.',
      ''
    ].join('\n')
  };

  let db = null;
  let readyPromise = null;

  function settings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveSettings(value) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
  }

  /* ─── Durum yazısı ──────────────────────────────────────── */

  function statusText(s) {
    if (!s) return { text: '', cls: '' };
    if (s.mode === 'local') return { text: 'Yerel mod: veriler yalnız bu tarayıcıda', cls: 'warn' };
    if (s.state === 'error') return { text: `Depoya gönderilemedi, bu cihazda kayıtlı. ${s.error}`, cls: 'err' };
    if (s.state === 'offline') return { text: `Çevrimdışı: ${s.pending} dosya bu cihazda bekliyor`, cls: 'warn' };
    if (s.state === 'syncing') return { text: 'Eşitleniyor…', cls: '' };
    if (s.pending) return { text: `Bu cihazda kayıtlı, ${s.pending} dosya depoya gönderilecek`, cls: '' };
    const time = s.lastSync ? new Date(s.lastSync).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
    return { text: `Depoda kayıtlı${time ? ` · ${time}` : ''}`, cls: 'ok' };
  }

  function renderChip(status) {
    const chip = document.getElementById('wxChip');
    if (!chip) return;
    const { text, cls } = statusText(status);
    chip.textContent = text;
    chip.className = `wx-chip ${cls}`;
    chip.hidden = !text;
  }

  /* ─── Bağlantı ──────────────────────────────────────────── */

  async function lockFn() {
    // Sekmeler aynı anda göndermesin; tarayıcı kilit vermezse kilitsiz devam edilir
    try {
      await navigator.locks.query();
      return (fn) => navigator.locks.request('wx-sync', fn);
    } catch {
      return (fn) => fn();
    }
  }

  function watchPage() {
    let lastFocusSync = Date.now();
    const syncIfDue = () => {
      if (Date.now() - lastFocusSync < FOCUS_SYNC_GAP_MS) return;
      lastFocusSync = Date.now();
      db.sync();
    };
    document.addEventListener('visibilitychange', () => {
      // Sayfa kapanırken gönderim yarım kalsa da kayıt cihazda bekler, sonraki açılışta gider
      if (document.visibilityState === 'hidden') db.flush();
      else syncIfDue();
    });
    setInterval(() => {
      if (document.visibilityState === 'visible') syncIfDue();
    }, FOREGROUND_SYNC_MS);
    window.addEventListener('online', () => db.sync());
  }

  const remoteFor = (repo, token) => PpxGitHub.createRemote({ repo, token, readme: README });

  async function connect() {
    const { mode, repo, token } = settings();
    const remote = mode === 'github' ? remoteFor(repo, token) : null;
    const local = PpxDb.indexedDbLocal(DB_NAME);
    db = PpxDb.createDb({ local, remote, lock: await lockFn() });
    db.onStatus(renderChip);
    renderChip(db.status());
    await db.refreshPending();
    if (remote) {
      // Bu cihazda veri varsa açılış ağa takılmaz; yoksa ilk alma bitmeden gösterilecek bir şey yok
      const first = db.sync();
      if ((await db.list()).length) await Promise.race([first, new Promise((r) => setTimeout(r, FIRST_SYNC_WAIT_MS))]);
      else await first;
      watchPage();
    }
    return db;
  }

  /** Depoyu dener; müşteri verisi açık depoya yazılmasın diye yalnız özel depo kabul edilir */
  async function connectGitHub(repo, token) {
    const remote = remoteFor(repo, token);
    const info = await remote.info();
    if (!info.private) throw new Error('Bu depo herkese açık. Müşteri verileri için özel (Private) depo gerekir.');
    saveSettings({ mode: 'github', repo: remote.id, token });
  }

  window.WxBoot = {
    DEFAULT_REPO,
    ready() {
      if (!readyPromise) readyPromise = connect();
      return readyPromise;
    },
    db: () => db,
    settings,
    statusText,
    connectGitHub,
    useLocal: () => saveSettings({ mode: 'yerel' }),
    /** Anahtar silinir, veriler bu cihazda kalır */
    disconnect: () => saveSettings({ mode: 'yerel' })
  };
})();
