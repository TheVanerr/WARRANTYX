/* WarrantyX arayüzü: garanti belgeleri, CE belgeleri, düzenleyici, ayarlar, veritabanı ve PDF.
   Her değişiklik önce bu cihazın tarayıcı veritabanına yazılır (wx-boot.js), depo eşitlemesi arka planda yürür.
   Ekranlar adres çubuğundan seçilir: #/ garanti belgeleri, #/ce CE belgeleri, #/ayarlar, #/veritabani,
   #/belge/<Seri No> garanti belgesi, #/ce/<Seri No> CE belgesi.
   CE belgesinin imzası veritabanındaki imzalar/ klasöründen rastgele gelir (özel depo; program deposu açıktır). */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = WxMetin.esc;
  const K = WxKayit;

  const SAVE_MS = 400;
  const PREVIEW_MS = 120;
  const ZOOMS = [0.4, 0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5];

  const BOLUM_ADLARI = {
    kapak: ['Kapak', 'Seçili kapak tasarımı'],
    sartlar: ['Garanti şartları', 'Sayfalara kendiliğinden bölünür'],
    belge: ['Garanti belgesi', 'Firma ve ürün bilgileri, kaşe / imza'],
    servis: ['Servis kayıt sayfası', 'Elle doldurulacak bakım tablosu']
  };

  const state = {
    db: null,
    ready: false,
    ayarlar: K.ayarlariNormalize(null),
    ayarlarVar: false,
    belgeler: [],
    ceBelgeler: [],
    /** imza adı → { ad, path, hash, b64, src, w, h, dpi } */
    imzalar: new Map(),
    /** { tur: 'garanti' | 'ce', path, belge } */
    acik: null,
    acikDirty: false,
    saveTimer: null,
    saving: Promise.resolve(),
    previewTimer: null,
    zoom: null,
    pdfLangs: null,
    cePdfLangs: null,
    pdfBusy: false,
    tab: 'belgeler'
  };

  /** Belge türleri: liste, depo yolu, kayıt biçimi ve adres */
  const TUR = {
    garanti: {
      ad: 'garanti belgesi',
      liste: () => state.belgeler,
      yaz: (list) => { state.belgeler = list; },
      yol: K.belgeYolu,
      normalize: K.belgeNormalize,
      hash: (seri) => `#/belge/${encodeURIComponent(seri)}`,
      listeHash: '#/',
      diller: () => WxMetin.DIL_SIRASI
    },
    ce: {
      ad: 'CE belgesi',
      liste: () => state.ceBelgeler,
      yaz: (list) => { state.ceBelgeler = list; },
      yol: K.ceYolu,
      normalize: K.ceNormalize,
      hash: (seri) => `#/ce/${encodeURIComponent(seri)}`,
      listeHash: '#/ce',
      diller: () => WxMetin.CE_DIL_SIRASI
    }
  };
  const turOf = (path) => (K.ceYoluMu(path) ? 'ce' : 'garanti');
  const imzaAdlari = () => [...state.imzalar.keys()];

  /* ─── Küçük yardımcılar ──────────────────────────────── */

  let toastTimer = null;
  function toast(text, kind) {
    const el = $('toast');
    el.textContent = text;
    el.className = `toast${kind === 'error' ? ' error' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), kind === 'error' ? 7000 : 3800);
  }

  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  function set(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] && typeof o[k] === 'object' ? o[k] : (o[k] = {})), obj);
    target[last] = value;
  }

  const clone = (v) => JSON.parse(JSON.stringify(v));
  const nowIso = () => new Date().toISOString();
  const belgeHash = (seri) => TUR.garanti.hash(seri);

  function zamanYaz(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /** Aranan metni vurgular; önce kaçış yapılır */
  function vurgula(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    const i = String(text).toLocaleLowerCase('tr').indexOf(q);
    if (i < 0) return safe;
    return `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + q.length))}</mark>${esc(text.slice(i + q.length))}`;
  }

  function langSeg(current, attr, sira) {
    return (sira || WxMetin.DIL_SIRASI).map(([id, code, name]) =>
      `<button type="button" ${attr}="${id}" title="${name}" class="${id === current ? 'active' : ''}" aria-pressed="${id === current}">${code}</button>`).join('');
  }

  function scaleInto(box, page, width) {
    const k = width / WxBelge.PAGE_W;
    page.style.transform = `scale(${k})`;
    box.replaceChildren(page);
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  }

  /** Görseller hazır olana kadar bekler; arka plan sekmesinde çözme bitmeyebilir, süre sınırı var */
  function imagesDecoded(root) {
    const images = Array.from(root.querySelectorAll('img'));
    const decoded = Promise.all(images.map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
    return Promise.race([decoded, new Promise((resolve) => setTimeout(resolve, 3000))]);
  }

  /** Düzenin oturması için iki kare bekler */
  function nextPaint() {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, 500);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        clearTimeout(timer);
        resolve();
      }));
    });
  }

  function scriptYukle(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      // Yayında içerik özeti eklenir: dosya değişince eskisi önbellekten gelmez
      s.src = WxBoot.versioned(src);
      s.onload = resolve;
      s.onerror = () => reject(new Error(`${src} yüklenemedi. "npm run gomulu" ile yeniden üretin.`));
      document.head.appendChild(s);
    });
  }

  /* ─── Pencereler ─────────────────────────────────────── */

  function pencere(inner, opts) {
    const o = opts || {};
    const root = $('modalRoot');
    root.innerHTML = `<div class="modal-overlay"><form class="modal${o.wide ? ' wide' : ''}" novalidate>${inner}</form></div>`;
    const form = root.querySelector('form');
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    function close() {
      document.removeEventListener('keydown', onKey, true);
      root.innerHTML = '';
      if (o.onClose) o.onClose();
    }
    document.addEventListener('keydown', onKey, true);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!o.onSubmit) return close();
      const btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      try {
        if ((await o.onSubmit(form)) !== false) close();
      } finally {
        if (btn && btn.isConnected) btn.disabled = false;
      }
    });
    form.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    root.querySelector('.modal-overlay').addEventListener('mousedown', (e) => {
      if (e.target === e.currentTarget) close();
    });
    if (o.onOpen) o.onOpen(form, close);
    const first = form.querySelector('input:not([type=hidden]):not([type=checkbox]), select, textarea') || form.querySelector('[type=submit]');
    if (first) setTimeout(() => first.focus(), 0);
    return close;
  }

  function onayla(title, text, okLabel) {
    return new Promise((resolve) => {
      let answer = false;
      pencere(`
        <h2>${esc(title)}</h2>
        <p>${esc(text)}</p>
        <div class="modal-actions">
          <button type="button" class="btn" data-close>Vazgeç</button>
          <button type="submit" class="btn btn-primary">${esc(okLabel || 'Tamam')}</button>
        </div>`, {
        onSubmit: () => { answer = true; },
        onClose: () => resolve(answer)
      });
    });
  }

  /* ─── Veri ───────────────────────────────────────────── */

  const sirala = (list) => list.sort((a, b) => (b.belge.guncelleme || '').localeCompare(a.belge.guncelleme || '') || a.belge.seriNo.localeCompare(b.belge.seriNo, 'tr'));

  /** Garanti ve CE belgeleri, imzalar: tek geçişte */
  async function belgeleriOku() {
    const garanti = [];
    const ce = [];
    const imza = [];
    for (const r of await state.db.list()) {
      if (r.kind !== 'file') continue;
      const tur = K.belgeYoluMu(r.path) ? 'garanti' : K.ceYoluMu(r.path) ? 'ce' : null;
      if (!tur) {
        if (K.imzaYoluMu(r.path)) imza.push(r);
        continue;
      }
      try {
        (tur === 'ce' ? ce : garanti).push({ path: r.path, belge: TUR[tur].normalize(K.decode(r.bytes)) });
      } catch (e) {
        console.warn('Belge okunamadı:', r.path, e);
      }
    }
    state.belgeler = sirala(garanti);
    state.ceBelgeler = sirala(ce);
    imzalariKur(imza);
  }

  /** imzalar/<ad>.png kayıtları → görsel; değişmeyen imza yeniden kodlanmaz */
  function imzalariKur(records) {
    const yeni = new Map();
    for (const r of records.slice().sort((a, b) => a.path.localeCompare(b.path))) {
      const ad = K.imzaAdi(r.path);
      const eski = state.imzalar.get(ad);
      if (eski && eski.hash === r.hash) {
        yeni.set(ad, eski);
        continue;
      }
      const bilgi = K.pngBilgi(r.bytes);
      if (!bilgi) continue;
      const b64 = WxDb.bytesToBase64(r.bytes);
      yeni.set(ad, Object.assign({ ad, path: r.path, hash: r.hash, b64, src: `data:image/png;base64,${b64}` }, bilgi));
    }
    state.imzalar = yeni;
  }

  async function ayarlariOku() {
    const r = await state.db.read(K.AYARLAR_YOLU);
    state.ayarlarVar = !!r;
    try {
      state.ayarlar = K.ayarlariNormalize(r ? K.decode(r.bytes) : null);
    } catch {
      state.ayarlar = K.ayarlariNormalize(null);
    }
  }

  async function ayarlariYaz(raw) {
    state.ayarlar = K.ayarlariNormalize(raw);
    await state.db.write(K.AYARLAR_YOLU, K.encode(state.ayarlar));
    state.ayarlarVar = true;
  }

  async function belgeYaz(path, belge) {
    const T = TUR[turOf(path)];
    const clean = T.normalize(belge);
    await state.db.write(path, K.encode(clean));
    T.yaz([{ path, belge: clean }, ...T.liste().filter((x) => x.path !== path)]);
  }

  /** Belge yolu türünü taşır: belgeler/… garanti, ce/… CE belgesi */
  const belgeVar = (path) => TUR[turOf(path)].liste().some((x) => x.path === path);

  /* ─── Ekranlar ve yönlendirme ────────────────────────── */

  function ekran(name) {
    for (const id of ['setup', 'home', 'editor']) $(id).classList.toggle('hidden', id !== name);
    document.body.classList.toggle('in-editor', name === 'editor');
  }

  async function route() {
    if (!state.ready) return;
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (h.startsWith('belge/') || h.startsWith('ce/')) {
      await kaydetSimdi();
      const tur = h.startsWith('ce/') ? 'ce' : 'garanti';
      editorAc(tur, h.slice(h.indexOf('/') + 1));
      return;
    }
    await kaydetSimdi();
    state.acik = null;
    anaEkran(['ayarlar', 'veritabani', 'ce'].includes(h) ? h : h === 'ce-yeni' ? 'ce' : 'belgeler');
    // Uygulama kısayolu (görev çubuğu simgesinde sağ tık): yeni belge penceresi açılır, adres listeye döner
    if (h === 'yeni') {
      history.replaceState(null, '', '#/');
      yeniBelgePenceresi(null);
    } else if (h === 'ce-yeni') {
      history.replaceState(null, '', '#/ce');
      yeniCePenceresi(null);
    }
  }

  /* ─── Ana ekran ──────────────────────────────────────── */

  const SEKME_BASLIK = {
    garanti: ['Garanti Belgesi', 'WarrantyX · Endüstriyel parça yıkama makineleri · TR · EN · DE', '+ Yeni Garanti Belgesi'],
    ce: ['CE Belgesi', 'WarrantyX · EC / EG uygunluk beyanı · EN · DE · rastgele imza', '+ Yeni CE Belgesi']
  };

  function anaEkran(tab) {
    state.tab = tab;
    ekran('home');
    document.querySelectorAll('.home-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $('pageBelgeler').classList.toggle('hidden', tab !== 'belgeler');
    $('pageCe').classList.toggle('hidden', tab !== 'ce');
    $('pageAyarlar').classList.toggle('hidden', tab !== 'ayarlar');
    $('pageVeritabani').classList.toggle('hidden', tab !== 'veritabani');
    const [baslik, alt, yeni] = SEKME_BASLIK[tab === 'ce' ? 'ce' : 'garanti'];
    $('homeTitle').textContent = baslik;
    $('homeSub').textContent = alt;
    $('btnNew').textContent = yeni;
    document.title = `WarrantyX · Dolfin ${baslik}`;
    $('ceCount').textContent = state.ceBelgeler.length ? String(state.ceBelgeler.length) : '';
    if (tab === 'belgeler') belgeListesi();
    else if (tab === 'ce') {
      ceListesi();
      // Önizlemeler CE yazı tipleriyle yeniden çizilir (ilk açılışta yüklenir)
      ceHazirla().then(() => { if (state.tab === 'ce' && !state.acik) ceListesi(); });
    } else if (tab === 'ayarlar') ayarFormu();
    else veritabaniSayfasi();
  }

  function belgeListesi() {
    $('docCount').textContent = state.belgeler.length ? String(state.belgeler.length) : '';
    const empty = !state.belgeler.length;
    $('docTools').classList.toggle('hidden', empty);
    $('docList').classList.toggle('hidden', empty);
    $('docEmpty').classList.toggle('hidden', !empty);
    if (empty) {
      bosEkran();
      return;
    }
    const q = $('docSearch').value.trim().toLocaleLowerCase('tr');
    const hits = state.belgeler.filter(({ belge: b }) =>
      !q || [b.seriNo, b.model, b.musteri].some((v) => v.toLocaleLowerCase('tr').includes(q)));
    $('docResult').textContent = q ? `${hits.length} / ${state.belgeler.length} belge` : `${state.belgeler.length} belge`;
    const list = $('docList');
    if (!hits.length) {
      list.innerHTML = '<div class="empty-list">Aramaya uyan belge yok.</div>';
      return;
    }
    list.replaceChildren(...hits.map(({ belge: b }) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'doc-card';
      card.dataset.seri = b.seriNo;
      card.innerHTML = `
        <div class="doc-thumb"></div>
        <div class="doc-info">
          <div class="dc-no">${vurgula(b.seriNo, q)}</div>
          <div class="dc-model">${vurgula(b.model || '—', q)}</div>
          <div class="dc-customer">${vurgula(b.musteri || 'Müşteri yazılmadı', q)}</div>
          <div class="dc-chips">
            <span class="dc-chip lang">${esc(b.dil.toUpperCase())}</span>
            ${b.teslimTarihi ? `<span class="dc-chip">Teslim ${esc(K.tarihYaz(b.teslimTarihi))}</span>` : ''}
          </div>
          <div class="dc-meta">${b.guncelleme ? `Güncellendi ${esc(zamanYaz(b.guncelleme))}` : ''}</div>
        </div>`;
      scaleInto(card.querySelector('.doc-thumb'), WxBelge.kapak(b, state.ayarlar, b.dil), 112);
      return card;
    }));
  }

  function bosEkran() {
    const s = WxBoot.settings();
    const where = s.mode === 'github'
      ? `Belgeler <b>${esc(s.repo)}</b> deposuna yazılacak. Depo şu an boş olabilir: ilk belgeyle birlikte README, <code>ayarlar.json</code> ve <code>belgeler/</code> klasörü kendiliğinden oluşur.`
      : 'Yerel moddasınız: belgeler yalnız bu tarayıcıda durur. Veritabanı sekmesinden GitHub deposuna bağlanınca hepsi depoya gönderilir.';
    $('docEmpty').innerHTML = `
      <div class="empty-hero">
        <div>
          <h2>Henüz garanti belgesi yok</h2>
          <p>Seri numarası, model ve müşteriyi yazın; kapak, garanti şartları, garanti belgesi ve servis sayfası hazırlanır. Belgeyi Türkçe, İngilizce ya da Almanca görüp tek tıkla PDF alırsınız.</p>
          <p>${where}</p>
          <div class="actions"><button type="button" class="btn btn-primary" data-new>+ İlk garanti belgesini oluştur</button></div>
        </div>
        <div class="empty-thumb"></div>
      </div>`;
    scaleInto($('docEmpty').querySelector('.empty-thumb'), WxBelge.kapak(K.bosBelge(), state.ayarlar, 'tr'), 260);
  }

  /* ─── CE belgeleri ───────────────────────────────────── */

  function ceListesi() {
    $('ceCount').textContent = state.ceBelgeler.length ? String(state.ceBelgeler.length) : '';
    $('ceImzalar').textContent = state.imzalar.size ? `İmzalar (${state.imzalar.size})` : 'İmzalar';
    $('ceUyari').innerHTML = state.imzalar.size ? '' : `
      <div class="imza-uyari">
        <div><b>İmzalar henüz yüklenmedi.</b> CE belgesine imza gelmesi için imza dosyalarını bir kez yükleyin
          (proje klasöründeki <code>imzalar/</code>: 23 imza). İmzalar yalnız özel veri deposunda durur.</div>
        <button type="button" class="btn btn-sm btn-primary" data-imzalar>İmzaları yükle</button>
      </div>`;
    const empty = !state.ceBelgeler.length;
    $('ceList').classList.toggle('hidden', empty);
    $('ceEmpty').classList.toggle('hidden', !empty);
    $('ceSearch').classList.toggle('hidden', empty);
    $('ceResult').classList.toggle('hidden', empty);
    if (empty) {
      ceBosEkran();
      return;
    }
    const q = $('ceSearch').value.trim().toLocaleLowerCase('tr');
    const hits = state.ceBelgeler.filter(({ belge: b }) =>
      !q || [b.seriNo, b.model, b.musteri].some((v) => v.toLocaleLowerCase('tr').includes(q)));
    $('ceResult').textContent = q ? `${hits.length} / ${state.ceBelgeler.length} belge` : `${state.ceBelgeler.length} belge`;
    const list = $('ceList');
    if (!hits.length) {
      list.innerHTML = '<div class="empty-list">Aramaya uyan belge yok.</div>';
      return;
    }
    list.replaceChildren(...hits.map(({ belge: b }) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'doc-card';
      card.dataset.seri = b.seriNo;
      const imzaYok = !b.imza || !state.imzalar.has(b.imza);
      card.innerHTML = `
        <div class="doc-thumb"></div>
        <div class="doc-info">
          <div class="dc-no">${vurgula(b.seriNo, q)}</div>
          <div class="dc-model">${vurgula(b.model || '—', q)}</div>
          <div class="dc-customer">${vurgula(b.musteri || 'Müşteri yazılmadı', q)}</div>
          <div class="dc-chips">
            <span class="dc-chip lang">${esc(b.dil.toUpperCase())}</span>
            ${b.tarih ? `<span class="dc-chip">${esc(K.tarihYaz(b.tarih))}</span>` : ''}
            ${imzaYok ? '<span class="dc-chip red">İmza yok</span>' : ''}
          </div>
          <div class="dc-meta">${b.guncelleme ? `Güncellendi ${esc(zamanYaz(b.guncelleme))}` : ''}</div>
        </div>`;
      scaleInto(card.querySelector('.doc-thumb'), WxCe.sayfa(b, b.dil, state.imzalar), 112);
      return card;
    }));
  }

  function ceBosEkran() {
    $('ceEmpty').innerHTML = `
      <div class="empty-hero">
        <div>
          <h2>Henüz CE belgesi yok</h2>
          <p>Seri numarasını ve tarihi yazın; EC uygunluk beyanı İngilizce ya da Almanca, taranmış belgedeki düzeniyle hazırlanır. Ürün adı her belgede aynıdır (Industrial Parts Washing Machine · Industrie-Teilereinigungsmaschine); model, marka ve test raporları hazır gelir, sol menüden değişir.</p>
          <p>Her yeni CE belgesine imzalardan biri rastgele gelir; bir önceki CE belgesindeki imza gelmez.</p>
          <div class="actions"><button type="button" class="btn btn-primary" data-new>+ İlk CE belgesini oluştur</button></div>
        </div>
        <div class="empty-thumb"></div>
      </div>`;
    scaleInto($('ceEmpty').querySelector('.empty-thumb'), WxCe.sayfa(K.bosCe(), 'en', null), 260);
  }

  /* ─── CE yazı tipleri ekranda ────────────────────────────
     Caladea ve Barlow bilgisayarda yüklü değildir: önizleme PDF'teki dosyalarla çizilir. */

  let ceYazi = null;
  function ceHazirla() {
    if (!ceYazi) {
      ceYazi = (async () => {
        await yaziTipleri();
        PidPdfDom.useOnScreen('Caladea');
        PidPdfDom.useOnScreen('Barlow Semi Condensed');
        await document.fonts.ready;
      })().catch((e) => {
        ceYazi = null;
        toast(`CE yazı tipleri yüklenemedi: ${e.message}`, 'error');
      });
    }
    return ceYazi;
  }

  /* ─── Yeni belge ─────────────────────────────────────── */

  /** @param dolum CE belgesinden gelinince { seriNo, model, musteri } */
  function yeniBelgePenceresi(kaynak, dolum) {
    const base = kaynak ? clone(kaynak) : K.bosBelge();
    const d = dolum || {};
    if (!kaynak && dolum) Object.assign(base, { model: d.model || '', musteri: d.musteri || '' });
    let dil = base.dil || 'tr';
    const title = kaynak ? 'Benzer garanti belgesi' : 'Yeni garanti belgesi';
    const intro = kaynak
      ? `<p>"${esc(kaynak.seriNo)}" belgesinin model, müşteri, teslim ve satıcı bilgileri kopyalanır. Fatura tarihi boş gelir.</p>`
      : dolum
        ? `<p>"${esc(d.seriNo)}" seri numaralı CE belgesinin model ve müşteri bilgisi geldi. Diğer bilgileri belgeyi açınca tamamlayabilirsiniz.</p>`
        : '<p>Diğer bilgileri belgeyi açınca tamamlayabilirsiniz.</p>';
    pencere(`
      <h2>${title}</h2>
      ${intro}
      <div class="field"><label for="nwSeri">Seri No</label><input id="nwSeri" class="field-input" name="seriNo" placeholder="0626051" maxlength="60" value="${esc(d.seriNo || '')}"></div>
      <div class="field"><label for="nwModel">Makine Modeli</label><input id="nwModel" class="field-input" name="model" placeholder="ULT M200 3B" value="${esc(base.model)}"></div>
      <div class="field"><label for="nwMusteri">Alıcı Firma</label><input id="nwMusteri" class="field-input" name="musteri" placeholder="Firma adı" value="${esc(base.musteri)}"></div>
      <div class="field-row">
        <div class="field"><label for="nwTeslim">Teslim Tarihi</label><input id="nwTeslim" class="field-input" type="date" name="teslimTarihi" value="${esc(base.teslimTarihi || K.bugun())}"></div>
        <div class="field"><span class="field-label">Belge dili</span><div class="lang-seg" id="nwLang">${langSeg(dil, 'data-lang')}</div></div>
      </div>
      <div class="modal-error" id="nwError"></div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>Vazgeç</button>
        <button type="submit" class="btn btn-primary">Oluştur ve aç</button>
      </div>`, {
      onOpen: (form) => {
        form.querySelector('#nwLang').addEventListener('click', (e) => {
          const b = e.target.closest('[data-lang]');
          if (!b) return;
          dil = b.dataset.lang;
          form.querySelector('#nwLang').innerHTML = langSeg(dil, 'data-lang');
        });
      },
      onSubmit: async (form) => {
        const v = (name) => form.elements[name].value.trim();
        const seri = v('seriNo');
        const path = K.belgeYolu(seri);
        let err = K.seriHatasi(seri);
        if (!err && belgeVar(path)) err = `"${seri}" seri numaralı belge zaten var.`;
        if (!err && !v('model')) err = 'Makine modeli gerekli.';
        if (err) {
          form.querySelector('#nwError').textContent = err;
          form.elements[err.startsWith('Makine') ? 'model' : 'seriNo'].focus();
          return false;
        }
        const now = nowIso();
        const belge = K.belgeNormalize(Object.assign(base, {
          seriNo: seri,
          model: v('model'),
          musteri: v('musteri'),
          teslimTarihi: v('teslimTarihi'),
          dil,
          faturaTarihi: kaynak ? '' : base.faturaTarihi,
          olusturma: now,
          guncelleme: now
        }));
        try {
          // İlk yazmada ayarlar da depoya girer: firma bilgileri depodan düzenlenebilir olur
          if (!state.ayarlarVar) await ayarlariYaz(state.ayarlar);
          await belgeYaz(path, belge);
        } catch (e) {
          form.querySelector('#nwError').textContent = `Kaydedilemedi: ${e.message}`;
          return false;
        }
        state.db.sync();
        location.hash = belgeHash(seri);
        toast(`"${seri}" oluşturuldu.`);
        return true;
      }
    });
  }

  /**
   * Yeni CE belgesi. İmza burada seçilir: rastgele, en son oluşturulan CE belgesindeki imza gelmez.
   * @param kaynak benzer belge @param dolum garanti belgesinden gelinince { seriNo, model, musteri }
   */
  function yeniCePenceresi(kaynak, dolum) {
    const base = kaynak ? clone(kaynak) : K.bosCe();
    const d = dolum || {};
    let dil = base.dil || 'en';
    const title = kaynak ? 'Benzer CE belgesi' : 'Yeni CE belgesi';
    const intro = kaynak
      ? `<p>"${esc(kaynak.seriNo)}" belgesinin model, müşteri ve ürün bilgileri kopyalanır. Tarih bugün olur, imza yeniden rastgele seçilir.</p>`
      : dolum
        ? `<p>"${esc(d.seriNo)}" seri numaralı garanti belgesinin model ve müşteri bilgisi geldi. Ürün bilgileri taranmış CE belgesindeki gibi gelir, belgeyi açınca sol menüden değişir.</p>`
        : '<p>Ürün bilgileri taranmış CE belgesindeki gibi gelir (model, marka, test raporları); belgeyi açınca sol menüden değişir.</p>';
    const imzaNotu = state.imzalar.size ? '' : '<div class="note" style="margin-top:0">Henüz imza yüklenmedi: belge şimdilik imzasız olur. CE Belgesi sekmesindeki <b>İmzalar</b> düğmesinden yükleyince belgeyi açtığınızda imza gelir.</div>';
    pencere(`
      <h2>${title}</h2>
      ${intro}
      <div class="field"><label for="nwSeri">Seri No</label><input id="nwSeri" class="field-input" name="seriNo" placeholder="0226089" maxlength="60" value="${esc(d.seriNo || '')}"></div>
      <div class="field"><label for="nwModel">Makine Modeli</label><input id="nwModel" class="field-input" name="model" placeholder="LYM 1350 NS" value="${esc(d.model || base.model)}"></div>
      <div class="field"><label for="nwMusteri">Alıcı Firma <small>belgede yazmaz, PDF dosya adında</small></label><input id="nwMusteri" class="field-input" name="musteri" placeholder="Firma adı" value="${esc(d.musteri || base.musteri)}"></div>
      <div class="field-row">
        <div class="field"><label for="nwTarih">Düzenleme Tarihi</label><input id="nwTarih" class="field-input" type="date" name="tarih" value="${esc(K.bugun())}"></div>
        <div class="field"><span class="field-label">Belge dili</span><div class="lang-seg" id="nwLang">${langSeg(dil, 'data-lang', WxMetin.CE_DIL_SIRASI)}</div></div>
      </div>
      ${imzaNotu}
      <div class="modal-error" id="nwError"></div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>Vazgeç</button>
        <button type="submit" class="btn btn-primary">Oluştur ve aç</button>
      </div>`, {
      onOpen: (form) => {
        form.querySelector('#nwLang').addEventListener('click', (e) => {
          const b = e.target.closest('[data-lang]');
          if (!b) return;
          dil = b.dataset.lang;
          form.querySelector('#nwLang').innerHTML = langSeg(dil, 'data-lang', WxMetin.CE_DIL_SIRASI);
        });
      },
      onSubmit: async (form) => {
        const v = (name) => form.elements[name].value.trim();
        const seri = v('seriNo');
        let err = K.seriHatasi(seri);
        if (!err && belgeVar(K.ceYolu(seri))) err = `"${seri}" seri numaralı CE belgesi zaten var.`;
        if (!err && !v('model')) err = 'Makine modeli gerekli.';
        if (err) {
          form.querySelector('#nwError').textContent = err;
          form.elements[err.startsWith('Makine') ? 'model' : 'seriNo'].focus();
          return false;
        }
        const now = nowIso();
        const belge = K.ceNormalize(Object.assign(base, {
          seriNo: seri,
          model: v('model'),
          musteri: v('musteri'),
          tarih: v('tarih'),
          imalYili: String(new Date().getFullYear()),
          dil,
          imza: K.yeniCeImzasi(state.ceBelgeler, imzaAdlari()),
          olusturma: now,
          guncelleme: now
        }));
        try {
          await belgeYaz(K.ceYolu(seri), belge);
        } catch (e) {
          form.querySelector('#nwError').textContent = `Kaydedilemedi: ${e.message}`;
          return false;
        }
        state.db.sync();
        location.hash = TUR.ce.hash(seri);
        toast(`"${seri}" CE belgesi oluşturuldu${belge.imza ? ` · ${belge.imza}` : ' · imzasız'}.`);
        return true;
      }
    });
  }

  /* ─── Düzenleyici ────────────────────────────────────── */

  const FORM = [
    { section: 'Makine' },
    { key: 'seriNo', label: 'Seri No', ph: '0626051', help: 'Depoda dosya adı olur: belgeler/<Seri No>.json' },
    { key: 'model', label: 'Makine Modeli', ph: 'ULT M200 3B' },
    { key: 'musteri', label: 'Alıcı Firma', ph: 'Firma adı' },
    { section: 'Teslim ve Fatura' },
    { key: 'teslimTarihi', label: 'Teslim Tarihi', type: 'date', half: true },
    { key: 'teslimYeri', label: 'Teslim Yeri', ph: 'Ankara', half: true },
    { key: 'faturaTarihi', label: 'Fatura Tarihi', type: 'date', help: 'Garanti süresi bu tarihten başlar' },
    { section: 'Satıcı Firma' },
    { key: 'satici.ayni', label: 'Satıcı, imalatçı firma ile aynı', type: 'switch' },
    { key: 'satici.unvan', label: 'Unvanı', seller: true },
    { key: 'satici.adres', label: 'Adresi', type: 'textarea', seller: true },
    { key: 'satici.telefon', label: 'Telefon', half: true, seller: true },
    { key: 'satici.faks', label: 'Faks', half: true, seller: true },
    { key: 'satici.eposta', label: 'E-posta', seller: true }
  ];

  /** CE belgesi: değişen alanlar. Ürün bilgileri taranmış belgedeki değerlerle gelir. */
  const CE_FORM = [
    { section: 'Makine' },
    { key: 'seriNo', label: 'Seri No', ph: '0226089', help: 'Belgede "Serial Number / Seriennummer". Depoda dosya adı olur: ce/<Seri No>.json' },
    { key: 'model', label: 'Makine Modeli', ph: 'LYM 1350 NS', help: 'Type / Model · Typ / Modell' },
    { key: 'imalYili', label: 'İmal Yılı', ph: '2026', half: true },
    { key: 'tarih', label: 'Düzenleme Tarihi', type: 'date', half: true },
    { key: 'musteri', label: 'Alıcı Firma', ph: 'Firma adı', help: 'Belgede yazmaz; listede ve PDF dosya adında kullanılır' },
    { section: 'Ürün bilgileri', hint: 'taranmış belgedeki değerlerle gelir' },
    { key: 'marka', label: 'Marka', ph: 'Dolfin®' },
    { key: 'lvdRapor', label: 'LVD Test Raporu No', ph: '62024041.001' },
    { key: 'riskRapor', label: 'Risk Değerlendirme Raporu No', ph: 'RA62024041001' }
  ];

  const acikForm = () => (state.acik && state.acik.tur === 'ce' ? CE_FORM : FORM);

  function alanHtml(f, belge) {
    const value = get(belge, f.key);
    const id = `ed-${f.key.replace('.', '-')}`;
    const ph = typeof f.ph === 'function' ? f.ph() : f.ph;
    const attrs = `id="${id}" class="field-input" data-key="${f.key}"${ph !== undefined ? ` placeholder="${esc(ph)}"` : ''}`;
    if (f.type === 'switch') {
      return `<label class="switch-row${value ? ' is-on' : ''}"><span>${esc(f.label)}</span><input type="checkbox" data-key="${f.key}"${value ? ' checked' : ''}></label>`;
    }
    const control = f.type === 'textarea'
      ? `<textarea ${attrs} rows="2">${esc(value == null ? '' : value)}</textarea>`
      : `<input ${attrs} type="${f.type || 'text'}"${f.type === 'number' ? ' min="0" step="any"' : ''} value="${esc(value == null ? '' : value)}">`;
    const label = f.label ? `<label for="${id}">${esc(f.label)}</label>` : '';
    const help = f.help ? `<span class="default-hint">${esc(f.help)}</span>` : '';
    return `<div class="field${f.seller ? ' seller-field' : ''}">${label}${control}${help}</div>`;
  }

  function editorFormu() {
    const belge = state.acik.belge;
    const form = acikForm();
    const out = [];
    for (let i = 0; i < form.length; i += 1) {
      const f = form[i];
      if (f.section) {
        out.push(`<div class="side-section">${esc(f.section)}${f.hint ? ` <small>${esc(f.hint)}</small>` : ''}</div>`);
        continue;
      }
      if (f.half && form[i + 1] && form[i + 1].half) {
        out.push(`<div class="field-row${f.seller ? ' seller-field' : ''}">${alanHtml(f, belge)}${alanHtml(form[i + 1], belge)}</div>`);
        i += 1;
        continue;
      }
      out.push(alanHtml(f, belge));
    }
    $('edForm').innerHTML = out.join('');
    saticiAlanlari();
  }

  function saticiAlanlari() {
    if (state.acik.tur !== 'garanti') return;
    const same = state.acik.belge.satici.ayni;
    $('edForm').querySelectorAll('.seller-field').forEach((el) => el.classList.toggle('hidden', same));
  }

  function editorBaslik() {
    const b = state.acik.belge;
    const ce = state.acik.tur === 'ce';
    $('edTitle').textContent = [ce ? 'CE' : '', b.seriNo, b.model].filter(Boolean).join(' · ');
    document.title = `${b.seriNo}${ce ? ' · CE' : ''} · WarrantyX`;
  }

  function kayitDurumu() {
    const el = $('edState');
    if (!el || !state.acik) return;
    if (state.acikDirty) {
      el.textContent = 'Kaydediliyor…';
      el.className = 'save-state dirty';
      return;
    }
    const { text, cls } = WxBoot.statusText(state.db.status());
    el.textContent = text;
    el.className = `save-state${cls === 'err' ? ' err' : cls === 'warn' ? ' dirty' : ''}`;
  }

  function dilDugmeleri() {
    $('edLang').innerHTML = langSeg(state.acik.belge.dil, 'data-doc-lang', TUR[state.acik.tur].diller());
  }

  /** Aynı seri numaralı öbür belge (garanti ↔ CE) */
  function karsiBelgeVar() {
    const { tur, belge } = state.acik;
    const hedef = tur === 'ce' ? 'garanti' : 'ce';
    return !!belge.seriNo && belgeVar(TUR[hedef].yol(belge.seriNo));
  }

  function sagPanel() {
    if (state.acik.tur === 'ce') {
      ceSagPanel();
      return;
    }
    const b = state.acik.belge;
    $('edRight').innerHTML = `
      <div class="side-section">Belgedeki bölümler</div>
      ${K.BOLUMLER.map((k) => `
        <label class="switch-row${b.bolumler[k] ? ' is-on' : ''}"><span>${esc(BOLUM_ADLARI[k][0])}<br><small>${esc(BOLUM_ADLARI[k][1])}</small></span><input type="checkbox" data-bolum="${k}"${b.bolumler[k] ? ' checked' : ''}></label>`).join('')}
      <div class="side-section">Belge</div>
      <button type="button" class="btn btn-sm" id="edKarsi">${karsiBelgeVar() ? 'Bu makinenin CE belgesini aç' : 'Bu makine için CE belgesi oluştur'}</button>
      <button type="button" class="btn btn-sm" id="edCopy">Benzer belge oluştur</button>
      <button type="button" class="btn btn-sm btn-danger" id="edDelete">Belgeyi sil</button>
      <span class="default-hint">${b.olusturma ? `Oluşturuldu ${esc(zamanYaz(b.olusturma))}` : ''}</span>`;
  }

  /** CE belgesi: imza önizlemesi; imza değiştirilebilir, belge garanti belgesine bağlanır */
  function ceSagPanel() {
    const b = state.acik.belge;
    const v = b.imza ? state.imzalar.get(b.imza) : null;
    const n = state.imzalar.size;
    const imza = v
      ? `<div class="ce-imza-onizleme"><img src="${esc(v.src)}" alt="İmza ${esc(b.imza)}"></div>
         <span class="default-hint">${esc(b.imza)} · ${n} imzadan rastgele seçildi. Bir önceki ve bir sonraki CE belgesindeki imza gelmez.</span>`
      : `<div class="imza-yok">${b.imza ? `Bu belgenin imzası (${esc(b.imza)}) veritabanında artık yok.` : n ? 'Belgede imza yok.' : 'Henüz imza yüklenmedi: belge imzasız basılır.'}</div>`;
    $('edRight').innerHTML = `
      <div class="side-section">İmza</div>
      ${imza}
      <div class="side-actions">
        ${n && (n > 1 || !v) ? '<button type="button" class="btn btn-sm" id="edImzaDegis" title="Rastgele başka imza; komşu CE belgelerindeki imzalar gelmez">Başka imza</button>' : ''}
        <button type="button" class="btn btn-sm" id="edImzalar">İmzalar…</button>
      </div>
      <div class="side-section">Belge</div>
      <button type="button" class="btn btn-sm" id="edKarsi">${karsiBelgeVar() ? 'Bu makinenin garanti belgesini aç' : 'Bu makine için garanti belgesi oluştur'}</button>
      <button type="button" class="btn btn-sm" id="edCopy">Benzer CE belgesi oluştur</button>
      <button type="button" class="btn btn-sm btn-danger" id="edDelete">Belgeyi sil</button>
      <span class="default-hint">${b.olusturma ? `Oluşturuldu ${esc(zamanYaz(b.olusturma))}` : ''}</span>`;
  }

  /** İmzasız açılan CE belgesine imza gelir (imzalar belge oluşturulduktan sonra yüklendiyse) */
  function imzaYoksaAta() {
    const acik = state.acik;
    // Silinen imza kendiliğinden değişmez: "Başka imza" ile seçilir
    if (!acik || acik.tur !== 'ce' || acik.belge.imza || !state.imzalar.size) return false;
    acik.belge.imza = K.baskaCeImzasi(acik.belge, state.ceBelgeler, imzaAdlari(), null, acik.path);
    kayitPlanla();
    return true;
  }

  function imzaDegistir() {
    const acik = state.acik;
    const yeni = K.baskaCeImzasi(acik.belge, state.ceBelgeler, imzaAdlari(), null, acik.path);
    if (!yeni || yeni === acik.belge.imza) {
      toast('Seçilecek başka imza yok.');
      return;
    }
    acik.belge.imza = yeni;
    sagPanel();
    onizle();
    kayitPlanla();
  }

  async function karsiBelge() {
    await kaydetSimdi();
    const { tur, belge } = state.acik;
    const hedef = tur === 'ce' ? 'garanti' : 'ce';
    if (karsiBelgeVar()) {
      location.hash = TUR[hedef].hash(belge.seriNo);
      return;
    }
    const dolum = { seriNo: belge.seriNo, model: belge.model, musteri: belge.musteri };
    if (hedef === 'ce') yeniCePenceresi(null, dolum);
    else yeniBelgePenceresi(null, dolum);
  }

  function editorAc(tur, seri) {
    const T = TUR[tur];
    const item = T.liste().find((x) => x.path === T.yol(seri));
    if (!item) {
      toast(`"${seri}" seri numaralı ${T.ad} bulunamadı.`, 'error');
      location.hash = T.listeHash;
      return;
    }
    state.acik = { tur, path: item.path, belge: clone(item.belge) };
    state.acikDirty = false;
    ekran('editor');
    editorFormu();
    dilDugmeleri();
    sagPanel();
    editorBaslik();
    kayitDurumu();
    onizle();
    $('preview').scrollTop = 0;
    if (tur === 'ce') {
      const acik = state.acik;
      ceHazirla().then(() => {
        if (state.acik !== acik) return;
        imzaYoksaAta();
        sagPanel();
        onizle();
      });
    }
  }

  /* ─── Önizleme ───────────────────────────────────────── */

  function zoomK() {
    if (state.zoom) return state.zoom;
    const width = $('preview').clientWidth - 48;
    return Math.max(0.3, Math.min(1, width / WxBelge.PAGE_W));
  }

  function olcekle() {
    const k = zoomK();
    $('pages').querySelectorAll('.page-slot').forEach((slot) => {
      slot.style.width = `${WxBelge.PAGE_W * k}px`;
      slot.style.height = `${WxBelge.PAGE_H * k}px`;
      slot.querySelector('.print-sheet').style.transform = `scale(${k})`;
    });
    $('zoomValue').textContent = `${Math.round(k * 100)}%`;
  }

  function onizlePlanla() {
    clearTimeout(state.previewTimer);
    state.previewTimer = setTimeout(onizle, PREVIEW_MS);
  }

  function onizle() {
    clearTimeout(state.previewTimer);
    if (!state.acik) return;
    const host = $('measureRoot');
    host.replaceChildren();
    const { tur, belge } = state.acik;
    const pages = tur === 'ce'
      ? WxCe.olustur(host, belge, belge.dil, state.imzalar)
      : WxBelge.olustur(host, belge, state.ayarlar, belge.dil);
    let n = 0;
    const slots = pages.map((page) => {
      const slot = document.createElement('div');
      slot.className = 'page-slot';
      const tag = document.createElement('span');
      tag.className = 'page-tag';
      tag.textContent = page.classList.contains('wx-cover') ? 'Kapak' : `Sayfa ${(n += 1)}`;
      slot.append(tag, page);
      return slot;
    });
    host.replaceChildren();
    if (!slots.length) {
      $('pages').innerHTML = '<div class="empty-list">Sağdan en az bir bölüm seçin.</div>';
    } else {
      $('pages').replaceChildren(...slots);
    }
    olcekle();
  }

  /* ─── Kayıt ──────────────────────────────────────────── */

  function kayitPlanla() {
    state.acikDirty = true;
    kayitDurumu();
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(kaydetSimdi, SAVE_MS);
  }

  function kaydetSimdi() {
    clearTimeout(state.saveTimer);
    state.saveTimer = null;
    state.saving = state.saving.then(async () => {
      if (!state.acik || !state.acikDirty) return;
      state.acikDirty = false;
      const { path, belge } = state.acik;
      belge.guncelleme = nowIso();
      try {
        await belgeYaz(path, belge);
      } catch (e) {
        state.acikDirty = true;
        toast(`Kaydedilemedi: ${e.message}`, 'error');
      }
      kayitDurumu();
    });
    return state.saving;
  }

  async function seriDegistir(input) {
    const acik = state.acik;
    const T = TUR[acik.tur];
    const yeni = input.value.trim();
    const eski = acik.belge.seriNo;
    if (yeni === eski) return;
    const newPath = T.yol(yeni);
    let err = K.seriHatasi(yeni);
    if (!err && newPath !== acik.path && belgeVar(newPath)) err = `"${yeni}" seri numaralı ${T.ad} zaten var.`;
    if (err) {
      toast(err, 'error');
      input.value = eski;
      input.classList.remove('invalid');
      return;
    }
    await kaydetSimdi();
    const oldPath = acik.path;
    acik.belge.seriNo = yeni;
    acik.belge.guncelleme = nowIso();
    acik.path = newPath;
    await belgeYaz(newPath, acik.belge);
    if (oldPath !== newPath) {
      await state.db.remove(oldPath);
      T.yaz(T.liste().filter((x) => x.path !== oldPath));
    }
    history.replaceState(null, '', T.hash(yeni));
    editorBaslik();
    kayitDurumu();
    onizle();
    // Aynı seri numaralı öbür belgeye giden düğme yeni numaraya göre yazılır
    sagPanel();
    toast(`Seri No "${yeni}" oldu.`);
  }

  async function belgeSil() {
    const { tur, path, belge } = state.acik;
    const T = TUR[tur];
    const github = WxBoot.settings().mode === 'github';
    const ok = await onayla('Belgeyi sil', `"${belge.seriNo}" seri numaralı ${T.ad} silinsin mi? ${github ? 'Depodaki eski sürüm GitHub geçmişinde kalır.' : 'Yerel modda geri alınamaz; gerekirse önce yedek indirin.'}`, 'Sil');
    if (!ok) return;
    clearTimeout(state.saveTimer);
    state.acikDirty = false;
    await state.db.remove(path);
    T.yaz(T.liste().filter((x) => x.path !== path));
    state.acik = null;
    location.hash = T.listeHash;
    toast(`"${belge.seriNo}" silindi.`);
  }

  function editorOlaylari() {
    const form = $('edForm');
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', (e) => {
      const key = e.target.dataset && e.target.dataset.key;
      if (!key || !state.acik || e.target.type === 'checkbox') return;
      if (key === 'seriNo') {
        // Seri No yazılırken değil, bitince uygulanır: dosya adı değişir
        const v = e.target.value.trim();
        const p = TUR[state.acik.tur].yol(v);
        e.target.classList.toggle('invalid', !!K.seriHatasi(v) || (p !== state.acik.path && belgeVar(p)));
        return;
      }
      set(state.acik.belge, key, e.target.value);
      if (key === 'model') editorBaslik();
      onizlePlanla();
      kayitPlanla();
    });
    form.addEventListener('change', (e) => {
      const key = e.target.dataset && e.target.dataset.key;
      if (!key || !state.acik) return;
      if (key === 'seriNo') {
        seriDegistir(e.target);
        return;
      }
      if (e.target.type === 'checkbox') {
        set(state.acik.belge, key, e.target.checked);
        e.target.closest('.switch-row').classList.toggle('is-on', e.target.checked);
        if (key === 'satici.ayni') saticiAlanlari();
        onizle();
        kayitPlanla();
      }
    });
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur();
    });

    $('edLang').addEventListener('click', (e) => {
      const b = e.target.closest('[data-doc-lang]');
      if (!b || !state.acik) return;
      state.acik.belge.dil = b.dataset.docLang;
      dilDugmeleri();
      onizle();
      kayitPlanla();
    });

    $('edRight').addEventListener('click', async (e) => {
      if (!state.acik) return;
      const id = e.target.id;
      if (id === 'edCopy') {
        await kaydetSimdi();
        if (state.acik.tur === 'ce') yeniCePenceresi(state.acik.belge);
        else yeniBelgePenceresi(state.acik.belge);
      } else if (id === 'edDelete') {
        belgeSil();
      } else if (id === 'edKarsi') {
        karsiBelge();
      } else if (id === 'edImzaDegis') {
        imzaDegistir();
      } else if (id === 'edImzalar') {
        imzaPenceresi();
      }
    });
    $('edRight').addEventListener('change', (e) => {
      const key = e.target.dataset && e.target.dataset.bolum;
      if (!key || !state.acik) return;
      state.acik.belge.bolumler[key] = e.target.checked;
      e.target.closest('.switch-row').classList.toggle('is-on', e.target.checked);
      onizle();
      kayitPlanla();
    });

    $('btnHome').addEventListener('click', () => { location.hash = '#/'; });
    $('edSave').addEventListener('click', simdiEsitle);
    $('edPdf').addEventListener('click', pdfPenceresi);
    $('zoomValue').addEventListener('click', () => { state.zoom = null; olcekle(); });
    const step = (dir) => {
      const k = zoomK();
      const next = dir > 0 ? ZOOMS.find((z) => z > k + 0.001) : [...ZOOMS].reverse().find((z) => z < k - 0.001);
      state.zoom = next || k;
      olcekle();
    };
    $('zoomIn').addEventListener('click', () => step(1));
    $('zoomOut').addEventListener('click', () => step(-1));
    window.addEventListener('resize', () => {
      if (state.acik && !state.zoom) olcekle();
    });
  }

  async function simdiEsitle() {
    await kaydetSimdi();
    if (WxBoot.settings().mode !== 'github') {
      toast('Bu cihazda kaydedildi. Yerel moddasınız; depoya göndermek için Veritabanı sekmesinden bağlanın.');
      return;
    }
    toast('Depoya gönderiliyor…');
    const s = await state.db.sync();
    if (s.error) toast(s.error, 'error');
    else toast('Depoya gönderildi.');
  }

  /* ─── PDF ────────────────────────────────────────────── */

  async function yaziTipleri() {
    if (!window.WX_YAZITIPI) await scriptYukle('assets/gomulu-yazitipi.js');
    await PidPdfDom.loadFonts(async (file) => {
      const b64 = window.WX_YAZITIPI && window.WX_YAZITIPI[file];
      return b64 ? { ok: true, bytes: WxDb.base64ToBytes(b64) } : { ok: false };
    });
  }

  /**
   * Belgeyi vektörel PDF'e çevirir. Her dil tam belge olarak TR, EN, DE sırasıyla arka arkaya eklenir.
   * @returns { bytes, pages, missing, failedImages, name }
   */
  /** Seçili diller belge türünün sırasıyla: garanti TR, EN, DE; CE EN, DE */
  const dilSirasi = (tur, langs) => TUR[tur].diller().map(([id]) => id).filter((id) => langs.includes(id));

  /** "0626051-DÜNYA-ULT M200 3B GARANTİ BELGESİ TR-EN.pdf", "0226089-KSYSTE-LYM 1350 NS CE CONFORMITY (EN-DEU).pdf" */
  function pdfAdi(tur, belge, order) {
    if (tur === 'ce') return K.cePdfDosyaAdi(belge, WxMetin.CE_DOSYA_ADI, order.map((l) => WxMetin.ceDil(l).dosyaEtiketi));
    return K.pdfDosyaAdi(belge, WxMetin.dil(order[0]).belgeAdi, order);
  }

  async function pdfOlustur(belge, langs, bolumler, onProgress, tur) {
    const t = tur === 'ce' ? 'ce' : 'garanti';
    const order = dilSirasi(t, langs);
    const root = $('printRoot');
    await yaziTipleri();
    PidPdfDom.begin();
    try {
      root.replaceChildren();
      await document.fonts.ready;
      for (const lang of order) {
        if (t === 'ce') WxCe.olustur(root, belge, lang, state.imzalar);
        else WxBelge.olustur(root, belge, state.ayarlar, lang, bolumler);
      }
      if (!root.children.length) throw new Error('Belgede basılacak bölüm yok');
      await imagesDecoded(root);
      await nextPaint();
      const name = pdfAdi(t, belge, order);
      const pdf = await PidPdfDom.render(root, { title: name.replace(/\.pdf$/, ''), producer: 'WarrantyX', onProgress });
      return Object.assign({ name }, pdf);
    } finally {
      root.replaceChildren();
      PidPdfDom.end();
    }
  }

  /** Kayıt yeri tıklamayla hemen sorulur: üretim uzun sürerse tarayıcı pencereyi açmaya izin vermez */
  async function kayitYeri(name) {
    if (typeof window.showSaveFilePicker !== 'function') return null;
    try {
      return await window.showSaveFilePicker({ suggestedName: name, types: [{ description: 'PDF belgesi', accept: { 'application/pdf': ['.pdf'] } }] });
    } catch (e) {
      if (e.name === 'AbortError') return false;
      return null;
    }
  }

  async function pdfIndir(langs, bolumler) {
    if (state.pdfBusy) return;
    state.pdfBusy = true;
    const { tur } = state.acik;
    const belge = clone(state.acik.belge);
    try {
      await kaydetSimdi();
      const order = dilSirasi(tur, langs);
      const handle = await kayitYeri(pdfAdi(tur, belge, order));
      if (handle === false) {
        toast('PDF kaydedilmedi.');
        return;
      }
      toast('PDF hazırlanıyor…');
      const pdf = await pdfOlustur(belge, order, bolumler, (done, total) => toast(`PDF hazırlanıyor: ${done} / ${total} sayfa`), tur);
      let where = pdf.name;
      if (handle) {
        const w = await handle.createWritable();
        await w.write(pdf.bytes);
        await w.close();
        where = handle.name;
      } else {
        downloadBlob(new Blob([pdf.bytes], { type: 'application/pdf' }), pdf.name);
      }
      const notes = [];
      if (pdf.missing.length) notes.push(`yazı tipinde olmayan karakterler: ${pdf.missing.join(' ')}`);
      if (pdf.failedImages) notes.push(`${pdf.failedImages} görsel eklenemedi`);
      if (notes.length) toast(`PDF kaydedildi, eksikler var (${notes.join('; ')})`, 'error');
      else toast(`PDF ${handle ? 'kaydedildi' : 'indirildi'}: ${where} · ${pdf.pages} sayfa · ${(pdf.bytes.length / 1024).toFixed(0)} KB`);
    } catch (e) {
      toast(`PDF oluşturulamadı: ${e.message}`, 'error');
    } finally {
      state.pdfBusy = false;
    }
  }

  /** CE belgesi tek sayfadır: yalnız dil seçilir */
  function cePdfPenceresi() {
    const b = state.acik.belge;
    const langs = new Set(state.cePdfLangs && state.cePdfLangs.length ? state.cePdfLangs : [b.dil]);
    const order = () => dilSirasi('ce', [...langs]);
    const name = () => (order().length ? pdfAdi('ce', b, order()) : '—');
    const langRow = () => WxMetin.CE_DIL_SIRASI.map(([id, code, title]) =>
      `<label class="pdf-lang${langs.has(id) ? ' is-on' : ''}" title="${title}"><input type="checkbox" data-pdf-lang="${id}"${langs.has(id) ? ' checked' : ''}>${code}</label>`).join('');
    const imzasiz = !b.imza || !state.imzalar.has(b.imza);
    pencere(`
      <h2>PDF İndir</h2>
      <p>CE uygunluk beyanı, vektörel PDF: yazılar seçilebilir ve aranabilir, yazı tipleri gömülüdür.</p>
      <div class="pdf-langs"><span>Diller</span><span id="pdfLangs" style="display:flex;gap:6px;flex:none">${langRow()}</span></div>
      <span class="default-hint">İki dil seçilirse EN ve DE sayfası tek dosyada arka arkaya gelir.</span>
      ${imzasiz ? '<div class="imza-yok">Belgede imza yok: PDF imzasız olur.</div>' : ''}
      <div class="pdf-name" id="pdfName">${esc(name())}</div>
      <div class="modal-error" id="pdfError"></div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>Vazgeç</button>
        <button type="submit" class="btn btn-primary">PDF İndir</button>
      </div>`, {
      onOpen: (form) => {
        form.addEventListener('change', (e) => {
          const lang = e.target.dataset.pdfLang;
          if (!lang) return;
          if (e.target.checked) langs.add(lang);
          else langs.delete(lang);
          e.target.closest('.pdf-lang').classList.toggle('is-on', e.target.checked);
          form.querySelector('#pdfName').textContent = name();
        });
      },
      onSubmit: (form) => {
        if (!langs.size) {
          form.querySelector('#pdfError').textContent = 'En az bir dil seçin.';
          return false;
        }
        state.cePdfLangs = order();
        pdfIndir(order(), null);
        return true;
      }
    });
  }

  function pdfPenceresi() {
    if (!state.acik || state.pdfBusy) return;
    if (state.acik.tur === 'ce') {
      cePdfPenceresi();
      return;
    }
    const b = state.acik.belge;
    const langs = new Set(state.pdfLangs && state.pdfLangs.length ? state.pdfLangs : [b.dil]);
    const bol = Object.assign({}, b.bolumler);
    const order = () => WxMetin.DIL_SIRASI.map(([id]) => id).filter((id) => langs.has(id));
    const name = () => (order().length ? K.pdfDosyaAdi(b, WxMetin.dil(order()[0]).belgeAdi, order()) : '—');
    const langRow = () => WxMetin.DIL_SIRASI.map(([id, code, title]) =>
      `<label class="pdf-lang${langs.has(id) ? ' is-on' : ''}" title="${title}"><input type="checkbox" data-pdf-lang="${id}"${langs.has(id) ? ' checked' : ''}>${code}</label>`).join('');
    const bolRows = () => K.BOLUMLER.map((k) =>
      `<label class="switch-row${bol[k] ? ' is-on' : ''}"><span>${esc(BOLUM_ADLARI[k][0])}</span><input type="checkbox" data-pdf-bolum="${k}"${bol[k] ? ' checked' : ''}></label>`).join('');
    pencere(`
      <h2>PDF İndir</h2>
      <p>Vektörel PDF: yazılar seçilebilir ve aranabilir, yazı tipleri gömülüdür, her bilgisayarda aynı görünür.</p>
      <div class="pdf-langs"><span>Diller</span><span id="pdfLangs" style="display:flex;gap:6px;flex:none">${langRow()}</span></div>
      <span class="default-hint">Birden çok dil seçilirse her dil tam belge olarak TR, EN, DE sırasıyla arka arkaya eklenir.</span>
      <div id="pdfBol" style="display:flex;flex-direction:column;gap:6px">${bolRows()}</div>
      <div class="pdf-name" id="pdfName">${esc(name())}</div>
      <div class="modal-error" id="pdfError"></div>
      <div class="modal-actions">
        <button type="button" class="btn" data-close>Vazgeç</button>
        <button type="submit" class="btn btn-primary">PDF İndir</button>
      </div>`, {
      onOpen: (form) => {
        form.addEventListener('change', (e) => {
          const lang = e.target.dataset.pdfLang;
          const key = e.target.dataset.pdfBolum;
          if (lang) {
            if (e.target.checked) langs.add(lang);
            else langs.delete(lang);
            e.target.closest('.pdf-lang').classList.toggle('is-on', e.target.checked);
          }
          if (key) {
            bol[key] = e.target.checked;
            e.target.closest('.switch-row').classList.toggle('is-on', e.target.checked);
          }
          form.querySelector('#pdfName').textContent = name();
        });
      },
      onSubmit: (form) => {
        if (!langs.size) {
          form.querySelector('#pdfError').textContent = 'En az bir dil seçin.';
          return false;
        }
        if (!K.BOLUMLER.some((k) => bol[k])) {
          form.querySelector('#pdfError').textContent = 'En az bir bölüm seçin.';
          return false;
        }
        state.pdfLangs = order();
        pdfIndir(order(), bol);
        return true;
      }
    });
  }

  /* ─── CE imzaları ────────────────────────────────────────
     Veritabanında imzalar/<ad>.png. Programın deposu ve yayındaki site herkese açıktır; imzalar yalnız özel
     veri deposunda durur. Belge imzanın adını taşır; havuzdan çıkarılan imza o belgelerde görünmez olur. */

  const IMZA_EN_BUYUK = 2 * 1024 * 1024;

  /** @returns { eklenen, ayni, hatalar } */
  async function imzaEkle(files) {
    const icerik = new Map([...state.imzalar.values()].map((v) => [v.b64, v.ad]));
    // Havuzdan çıkarılmış ama belgede adı geçen imzanın adı başka görsele verilmez
    const dolu = new Set([...state.imzalar.keys(), ...state.ceBelgeler.map((x) => x.belge.imza).filter(Boolean)]);
    const out = { eklenen: 0, ayni: 0, hatalar: [] };
    for (const f of files) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (bytes.length > IMZA_EN_BUYUK) {
        out.hatalar.push(`${f.name}: 2 MB'tan büyük`);
        continue;
      }
      if (!K.pngBilgi(bytes)) {
        out.hatalar.push(`${f.name}: PNG değil`);
        continue;
      }
      const b64 = WxDb.bytesToBase64(bytes);
      if (icerik.has(b64)) {
        out.ayni += 1;
        continue;
      }
      const kok = K.imzaAdiTemizle(f.name);
      let ad = kok;
      for (let i = 2; dolu.has(ad); i += 1) ad = `${kok}-${i}`;
      await state.db.write(K.imzaYolu(ad), bytes);
      icerik.set(b64, ad);
      dolu.add(ad);
      out.eklenen += 1;
    }
    await belgeleriOku();
    if (out.eklenen) state.db.sync();
    return out;
  }

  async function imzaKaldir(ad) {
    const v = state.imzalar.get(ad);
    if (!v) return;
    await state.db.remove(v.path);
    await belgeleriOku();
    state.db.sync();
  }

  function imzaPenceresi() {
    let silinecek = null;
    const s = WxBoot.settings();
    const yer = s.mode === 'github'
      ? `yalnız özel veri deposunda (<b>${esc(s.repo)}</b>, <code>imzalar/</code>) durur`
      : 'bu tarayıcının veritabanında durur (yerel mod); GitHub deposuna bağlanınca özel veri deposuna gider';
    pencere(`
      <h2>CE imzaları</h2>
      <p>Yeni CE belgesine bu imzalardan biri rastgele gelir; bir önceki CE belgesindeki imza gelmez.</p>
      <div class="imza-grid" id="imzaGrid"></div>
      <span class="default-hint">PNG, saydam arka planlı. Proje klasöründeki <code>imzalar/</code> klasöründe 23 imza hazır (tools/imza-ayir.py). Hepsini birden seçebilirsiniz.</span>
      <div class="note" style="margin-top:0">İmzalar ${yer}. Programın deposu ve yayındaki site herkese açıktır; imzalar oraya girmez.</div>
      <div class="result" id="imzaSonuc" role="status"></div>
      <input type="file" id="imzaDosya" accept="image/png,.png" multiple hidden>
      <div class="modal-actions">
        <button type="button" class="btn" id="imzaEkle">İmza dosyası ekle…</button>
        <button type="button" class="btn btn-primary" data-close>Kapat</button>
      </div>`, {
      wide: true,
      onOpen: (form) => {
        const grid = form.querySelector('#imzaGrid');
        const sonuc = form.querySelector('#imzaSonuc');
        const say = (text, cls) => {
          sonuc.textContent = text;
          sonuc.className = `result${cls ? ` ${cls}` : ''}`;
        };
        const kullanim = (ad) => state.ceBelgeler.filter((x) => x.belge.imza === ad).length;
        const ciz = () => {
          if (!state.imzalar.size) {
            grid.innerHTML = '<div class="imza-bos">Henüz imza yok.</div>';
            return;
          }
          grid.innerHTML = [...state.imzalar.values()].map((v) => {
            const n = kullanim(v.ad);
            const sil = silinecek === v.ad;
            return `<div class="imza-kutu${sil ? ' silinecek' : ''}" title="${esc(v.ad)}${n ? ` · ${n} CE belgesinde` : ''}">
              <img src="${esc(v.src)}" alt="">
              <span>${esc(v.ad)}${n ? ` · ${n}` : ''}</span>
              <button type="button" data-sil="${esc(v.ad)}" title="${sil ? (n ? `${n} CE belgesinde kullanılıyor; orada imza görünmez olur` : 'Havuzdan çıkar') : 'Havuzdan çıkar'}">${sil ? 'Çıkar?' : '×'}</button>
            </div>`;
          }).join('');
        };
        ciz();
        form.querySelector('#imzaEkle').addEventListener('click', () => form.querySelector('#imzaDosya').click());
        form.querySelector('#imzaDosya').addEventListener('change', async (e) => {
          const files = [...e.target.files];
          e.target.value = '';
          if (!files.length) return;
          say('Yükleniyor…');
          try {
            const r = await imzaEkle(files);
            const parts = [];
            if (r.eklenen) parts.push(`${r.eklenen} imza eklendi`);
            if (r.ayni) parts.push(`${r.ayni} imza zaten vardı`);
            if (r.hatalar.length) parts.push(r.hatalar.join(', '));
            say(parts.join(' · ') || 'Eklenecek imza yok.', r.hatalar.length ? 'err' : 'ok');
          } catch (err) {
            say(`Eklenemedi: ${err.message}`, 'err');
          }
          silinecek = null;
          ciz();
        });
        grid.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-sil]');
          if (!b) return;
          const ad = b.dataset.sil;
          if (silinecek !== ad) {
            silinecek = ad;
            ciz();
            return;
          }
          silinecek = null;
          await imzaKaldir(ad);
          say(`${ad} havuzdan çıkarıldı.`, 'ok');
          ciz();
        });
      },
      onClose: () => {
        if (state.acik && state.acik.tur === 'ce') {
          imzaYoksaAta();
          sagPanel();
          onizle();
        } else if (state.tab === 'ce' && !state.acik) {
          ceListesi();
        }
      }
    });
  }

  /* ─── Ayarlar ────────────────────────────────────────── */

  const AYAR_FORM = [
    { card: 'İmalatçı Firma', hint: 'Garanti belgesinde, kapakta ve sayfa altında yazar', cols: 3, fields: [
      { key: 'imalatci.unvan', label: 'Unvanı', span: 3 },
      { key: 'imalatci.adres', label: 'Merkez Adresi', span: 3 },
      { key: 'imalatci.telefon', label: 'Telefon' },
      { key: 'imalatci.faks', label: 'Faks' },
      { key: 'imalatci.eposta', label: 'E-posta' },
      { key: 'imalatci.web', label: 'Web' }
    ] },
    { card: 'Ürün', hint: 'Garanti belgesindeki "Cinsi" her dilde ayrı yazılır', cols: 2, fields: [
      { key: 'marka', label: 'Marka' },
      { key: 'urunCinsi.tr', label: 'Cinsi (TR)' },
      { key: 'urunCinsi.en', label: 'Cinsi (EN)' },
      { key: 'urunCinsi.de', label: 'Cinsi (DE)' }
    ] },
    { card: 'Garanti', hint: 'Her garanti belgesine ve şart metnine bu değerler yazılır', cols: 4, fields: [
      { key: 'garantiYil', label: 'Garanti süresi (yıl)', type: 'number' },
      { key: 'garantiSaat', label: 'Çalışma saati', type: 'number' },
      { key: 'yedekParcaYil', label: 'Yedek parça temini (yıl)', type: 'number' },
      { key: 'kullanimOmruYil', label: 'Kullanım ömrü (yıl)', type: 'number' }
    ] },
    { card: 'Belge', hint: 'Bakanlık onayı', cols: 1, fields: [
      { key: 'onayTarihiSayisi', label: 'Belge onay tarihi ve sayısı (eski Bakanlık onayı; boşsa belgede elle doldurma çizgisi kalır)' }
    ] }
  ];

  function ayarFormu(values) {
    const a = values || state.ayarlar;
    const field = (f) => {
      const id = `st-${f.key.replace('.', '-')}`;
      const value = get(a, f.key);
      const control = f.options
        ? `<select id="${id}" class="field-input" name="${f.key}">${f.options.map(([v, t]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`
        : `<input id="${id}" class="field-input" name="${f.key}" type="${f.type || 'text'}"${f.type === 'number' ? ' min="0" step="any"' : ''} value="${esc(value == null ? '' : value)}">`;
      return `<div class="field${f.span ? ` span-${f.span}` : ''}"><label for="${id}">${esc(f.label)}</label>${control}</div>`;
    };
    $('settingsForm').innerHTML = `
      ${AYAR_FORM.map((c) => `
        <div class="card">
          <div class="card-head"><h2>${esc(c.card)}</h2><span>${esc(c.hint)}</span></div>
          <div class="grid-${c.cols}">${c.fields.map(field).join('')}</div>
        </div>`).join('')}
      <div class="field-help">${state.ayarlarVar ? 'Ayarlar depoda <code>ayarlar.json</code> dosyasında durur.' : 'Ayarlar henüz depoya yazılmadı; programdaki varsayılanlar görünüyor. İlk belgeyle ya da "Ayarları kaydet" ile yazılır.'} Değişiklik bundan sonra açılan ve PDF alınan tüm belgelerde geçerli olur.</div>
      <div class="sticky-actions">
        <button type="button" class="btn" id="stDefaults">Program varsayılanlarına dön</button>
        <button type="submit" class="btn btn-primary">Ayarları kaydet</button>
      </div>`;
  }

  function ayarOlaylari() {
    const form = $('settingsForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const raw = clone(state.ayarlar);
      for (const el of form.elements) if (el.name) set(raw, el.name, el.value);
      try {
        await ayarlariYaz(raw);
        ayarFormu();
        toast('Ayarlar kaydedildi.');
      } catch (err) {
        toast(`Ayarlar kaydedilemedi: ${err.message}`, 'error');
      }
    });
    form.addEventListener('click', (e) => {
      if (e.target.id === 'stDefaults') {
        ayarFormu(K.ayarlariNormalize(null));
        toast('Varsayılanlar forma geldi; kalıcı olması için "Ayarları kaydet" deyin.');
      }
    });
  }

  /* ─── Veritabanı ─────────────────────────────────────── */

  const REPO_NEW_URL = 'https://github.com/new?name=warrantyx-veri&visibility=private&description=WarrantyX%20garanti%20belgeleri';
  const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new?name=WarrantyX%20veri&description=WarrantyX%20veri%20deposu&contents=write&expires_in=365';

  /** Yayında depo sabittir, yalnız anahtar sorulur. Anahtarı programı yöneten kişi verir. */
  function yayinBaglantiHtml() {
    return `
      <h2>Erişim anahtarı</h2>
      <p>Garanti belgeleri özel <strong>${esc(WxBoot.DEFAULT_REPO)}</strong> deposunda durur. Programı kullanmak için size verilen erişim anahtarını yapıştırıp <strong>Bağlan</strong> deyin. Anahtar yalnız bu tarayıcıda saklanır; bu bilgisayarda bir kez girmeniz yeterlidir.</p>
      <form class="connect-form" data-connect>
        <div class="field"><label>Erişim anahtarı</label><input class="field-input" name="token" type="password" placeholder="github_pat_…" autocomplete="off" spellcheck="false"></div>
        <div class="actions"><button type="submit" class="btn btn-primary">Bağlan</button></div>
      </form>
      <div class="result" data-connect-result role="status"></div>
      <div class="note">Ortak kullanılan bir bilgisayarda işiniz bitince Veritabanı sekmesinden <strong>Bağlantıyı kaldır</strong> deyin.<br>
        Yönetici için: <a href="${TOKEN_URL}" target="_blank" rel="noopener">yeni anahtar oluşturun</a>, "Repository access" altında <strong>Only select repositories</strong> seçip yalnız <strong>warrantyx-veri</strong> deposunu işaretleyin. <strong>Contents: Read and write</strong> hazır gelir. Her kişiye ayrı anahtar verin: biri ayrılınca yalnız onunki silinir.</div>`;
  }

  function baglantiHtml(isSetup) {
    if (WxBoot.PUBLISHED) return yayinBaglantiHtml();
    const s = WxBoot.settings();
    const repo = s.mode === 'github' && s.repo ? s.repo : WxBoot.DEFAULT_REPO;
    return `
      <h2>Verileriniz nerede dursun?</h2>
      <p>Özel bir GitHub deposu veritabanı olur: ücretsizdir, sunucu ve kurulum gerektirmez, her kayıt geçmişte durur, her bilgisayardan erişilir.</p>
      <ol class="steps">
        <li><a href="${REPO_NEW_URL}" target="_blank" rel="noopener">Özel depo oluşturun</a>. Ad (<strong>warrantyx-veri</strong>) ve görünürlük (<strong>Private</strong>) hazır gelir. Depoyu boş bırakın ve "Create repository" deyin.</li>
        <li><a href="${TOKEN_URL}" target="_blank" rel="noopener">Erişim anahtarı oluşturun</a>. "Repository access" altında <strong>Only select repositories</strong> seçip yalnız <strong>warrantyx-veri</strong> deposunu işaretleyin. <strong>Contents: Read and write</strong> izni hazır gelir. "Generate token" deyin ve anahtarı kopyalayın.</li>
        <li>Anahtarı aşağıya yapıştırıp <strong>Bağlan</strong> deyin. Anahtar yalnız bu tarayıcıda saklanır.</li>
      </ol>
      <form class="connect-form" data-connect>
        <div class="field"><label>Depo (kullanıcı/depo)</label><input class="field-input" name="repo" value="${esc(repo)}" autocomplete="off" spellcheck="false"></div>
        <div class="field"><label>Erişim anahtarı</label><input class="field-input" name="token" type="password" placeholder="github_pat_…" autocomplete="off" spellcheck="false"></div>
        <div class="actions">
          <button type="submit" class="btn btn-primary">Bağlan</button>
          ${isSetup ? '<button type="button" class="btn" data-local>Şimdilik yalnız bu bilgisayarda kullan</button>' : ''}
        </div>
      </form>
      <div class="result" data-connect-result role="status"></div>
      <div class="note">Depo boşsa sorun değil: ilk garanti belgesini kaydettiğinizde program depoya README, <code>ayarlar.json</code> ve <code>belgeler/</code> klasörünü kendisi yazar. Anahtarın süresi dolunca Veritabanı sekmesinden yenileyin. Anahtar yalnız warrantyx-veri deposuna izinli olmalı; bu tarayıcıda bilinmeyen HTML dosyalarını açmayın.</div>`;
  }

  function baglantiOlaylari(box) {
    const form = box.querySelector('[data-connect]');
    const result = box.querySelector('[data-connect-result]');
    const say = (text, cls) => {
      result.textContent = text;
      result.className = `result${cls ? ` ${cls}` : ''}`;
    };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const repo = form.elements.repo ? form.elements.repo.value.trim() : WxBoot.DEFAULT_REPO;
      const token = form.elements.token.value.trim();
      if (!repo || !token) {
        say(form.elements.repo ? 'Depo adı ve erişim anahtarı gerekli.' : 'Erişim anahtarı gerekli.', 'err');
        return;
      }
      say('Deneniyor…');
      try {
        if (state.db) await kaydetSimdi();
        await WxBoot.connectGitHub(repo, token);
        say('Bağlandı. Program yeniden açılıyor…', 'ok');
        location.hash = '#/';
        location.reload();
      } catch (err) {
        say(err.message, 'err');
      }
    });
    const local = box.querySelector('[data-local]');
    if (local) {
      local.addEventListener('click', () => {
        WxBoot.useLocal();
        location.reload();
      });
    }
  }

  async function veritabaniSayfasi() {
    const s = WxBoot.settings();
    const github = s.mode === 'github';
    $('dbMode').textContent = github ? 'GitHub' : 'Yerel mod';
    $('dbSync').hidden = !github;
    $('dbDisconnect').hidden = !github;
    $('dbShowConnect').textContent = WxBoot.PUBLISHED ? 'Anahtarı değiştir' : github ? 'Depoyu ya da anahtarı değiştir' : 'GitHub deposuna bağla';
    const rows = await state.db.list();
    const size = rows.reduce((n, r) => n + (r.bytes ? r.bytes.length : 0), 0);
    const st = state.db.status();
    const where = github ? `GitHub deposu: <b>${esc(s.repo)}</b>` : '<b>Yerel mod</b>: veriler yalnız bu tarayıcıda';
    const status = github ? WxBoot.statusText(st).text : '';
    const v = WxBoot.VERSION;
    const program = WxBoot.PUBLISHED
      ? `Program: yayındaki sürüm <b>${esc(v.surum)}</b>${v.tarih ? ` · ${esc(zamanYaz(v.tarih))}` : ''}`
      : 'Program: bu bilgisayardaki kopya (dosyadan açıldı)';
    $('dbInfo').innerHTML = `${where}<br>${state.belgeler.length} garanti belgesi · ${state.ceBelgeler.length} CE belgesi · ${state.imzalar.size} imza · ${rows.length} dosya · ${(size / 1024).toFixed(1)} KB${status ? ` · ${esc(status)}` : ''}<br>${program}`;
  }

  function veritabaniOlaylari() {
    const result = $('dbResult');
    const say = (text, cls) => {
      result.textContent = text;
      result.className = `result${cls ? ` ${cls}` : ''}`;
    };
    $('dbSync').addEventListener('click', async () => {
      say('Eşitleniyor…');
      const s = await state.db.sync();
      say(s.error || 'Eşitlendi.', s.error ? 'err' : 'ok');
      veritabaniSayfasi();
    });
    $('dbShowConnect').addEventListener('click', () => {
      const box = $('dbConnect');
      const show = box.classList.contains('hidden');
      box.classList.toggle('hidden', !show);
      if (show) {
        box.innerHTML = baglantiHtml(false);
        baglantiOlaylari(box);
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    $('dbDisconnect').addEventListener('click', async () => {
      const text = WxBoot.PUBLISHED
        ? 'Erişim anahtarı bu tarayıcıdan silinir ve program yeniden anahtar ister. Depoya gönderilmemiş değişiklik varsa bu bilgisayarda bekler, yeniden bağlanınca gönderilir. Önce eşitlemek isterseniz "Şimdi eşitle" deyin.'
        : 'Erişim anahtarı bu tarayıcıdan silinir, belgeler bu bilgisayarda kalır ve yerel modda çalışmaya devam edilir. Önce eşitlemek isterseniz "Şimdi eşitle" deyin.';
      const ok = await onayla('Bağlantıyı kaldır', text, 'Bağlantıyı kaldır');
      if (!ok) return;
      WxBoot.disconnect();
      location.reload();
    });
    $('dbBackup').addEventListener('click', async () => {
      await kaydetSimdi();
      const blob = new Blob([JSON.stringify(await state.db.exportBackup())], { type: 'application/json' });
      downloadBlob(blob, `warrantyx-yedek-${K.bugun()}.json`);
      say('Yedek indirildi.', 'ok');
    });
    $('dbRestore').addEventListener('click', () => $('dbRestoreFile').click());
    $('dbRestoreFile').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const res = await state.db.importBackup(JSON.parse(await file.text()));
        await ayarlariOku();
        await belgeleriOku();
        say(`${res.written} dosya yüklendi, ${res.kept} dosya zaten vardı ve korundu.`, 'ok');
        veritabaniSayfasi();
      } catch (err) {
        say(err.message, 'err');
      }
    });
  }

  /* ─── Başka cihazdan gelen değişiklik ────────────────── */

  async function disaridanGelen(paths) {
    const docs = paths.filter((p) => K.belgeYoluMu(p) || K.ceYoluMu(p) || K.imzaYoluMu(p) || p === K.AYARLAR_YOLU);
    if (!docs.length || !state.ready) return;
    if (paths.includes(K.AYARLAR_YOLU)) await ayarlariOku();
    await belgeleriOku();
    if (state.acik) {
      if (paths.includes(state.acik.path) && !state.acikDirty) {
        const item = TUR[state.acik.tur].liste().find((x) => x.path === state.acik.path);
        if (!item) {
          toast('Bu belge başka bir bilgisayarda silindi. Kaydederseniz yeniden oluşur.', 'error');
          return;
        }
        state.acik.belge = clone(item.belge);
        editorFormu();
        dilDugmeleri();
        editorBaslik();
        toast('Belge başka bir bilgisayarda değiştirildi; güncel hâli açıldı.');
      }
      // İmzalar başka bilgisayardan gelmiş olabilir: imzasız CE belgesine imza gelir
      imzaYoksaAta();
      sagPanel();
      onizle();
    } else if (state.tab === 'belgeler') {
      belgeListesi();
    } else if (state.tab === 'ce') {
      ceListesi();
    }
  }

  function durumDegisti(s) {
    kayitDurumu();
    if (state.tab === 'veritabani' && !state.acik && state.ready) veritabaniSayfasi();
    if (s.state === 'ok' && s.changed && s.changed.length) disaridanGelen(s.changed);
  }

  /* ─── Açılış ─────────────────────────────────────────── */

  function sabitOlaylar() {
    $('btnNew').addEventListener('click', () => {
      if (state.tab === 'ce') yeniCePenceresi(null);
      else yeniBelgePenceresi(null);
    });
    $('docEmpty').addEventListener('click', (e) => {
      if (e.target.closest('[data-new]')) yeniBelgePenceresi(null);
    });
    $('docSearch').addEventListener('input', belgeListesi);
    $('docList').addEventListener('click', (e) => {
      const card = e.target.closest('.doc-card');
      if (card) location.hash = belgeHash(card.dataset.seri);
    });
    $('ceEmpty').addEventListener('click', (e) => {
      if (e.target.closest('[data-new]')) yeniCePenceresi(null);
    });
    $('ceUyari').addEventListener('click', (e) => {
      if (e.target.closest('[data-imzalar]')) imzaPenceresi();
    });
    $('ceImzalar').addEventListener('click', imzaPenceresi);
    $('ceSearch').addEventListener('input', ceListesi);
    $('ceList').addEventListener('click', (e) => {
      const card = e.target.closest('.doc-card');
      if (card) location.hash = TUR.ce.hash(card.dataset.seri);
    });
    document.querySelectorAll('.home-tab').forEach((b) => b.addEventListener('click', () => {
      location.hash = b.dataset.tab === 'belgeler' ? '#/' : `#/${b.dataset.tab}`;
    }));
    $('wxChip').addEventListener('click', () => { location.hash = '#/veritabani'; });
    document.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || $('modalRoot').children.length) return;
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        simdiEsitle();
      } else if (key === 'p' && state.acik) {
        e.preventDefault();
        pdfPenceresi();
      }
    });
    // Sayfa kapanırken bekleyen kayıt bu cihaza yazılır
    window.addEventListener('pagehide', () => { kaydetSimdi(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') kaydetSimdi();
    });
    editorOlaylari();
    ayarOlaylari();
    veritabaniOlaylari();
  }

  /** Kayıt bu cihaza yazıldıktan sonra yenilenir; depoya gönderilmemişse sonraki açılışta gider */
  function yeniSurumBandi(latest) {
    const el = $('wxSurum');
    const when = latest.tarih ? zamanYaz(latest.tarih) : '';
    el.innerHTML = `<div>Programın yeni sürümü yayında.<small>${esc(latest.surum)}${when ? ` · ${esc(when)}` : ''} · yenileyince açılır</small></div>
      <button type="button" class="btn btn-sm btn-primary">Yenile</button>`;
    el.hidden = false;
    el.querySelector('button').addEventListener('click', async () => {
      await kaydetSimdi();
      location.reload();
    });
  }

  async function basla() {
    const s = WxBoot.settings();
    // Yayında yerel mod yoktur: anahtarı olmayan program açamaz
    if (!s.mode || (WxBoot.PUBLISHED && s.mode !== 'github')) {
      ekran('setup');
      $('setupConnect').innerHTML = baglantiHtml(true);
      baglantiOlaylari($('setupConnect'));
      return;
    }
    ekran('home');
    $('docList').innerHTML = '<div class="empty-list">Veritabanına bağlanıyor…</div>';
    sabitOlaylar();
    try {
      state.db = await WxBoot.ready();
    } catch (e) {
      $('docList').innerHTML = `<div class="empty-list">Veritabanı açılamadı: ${esc(e.message)}</div>`;
      return;
    }
    state.db.onStatus(durumDegisti);
    await ayarlariOku();
    await belgeleriOku();
    state.ready = true;
    window.addEventListener('hashchange', route);
    route();
    WxBoot.watchVersion(yeniSurumBandi);
  }

  /* ─── Uygulama olarak yükleme (PWA) ──────────────────── */

  // Tarayıcı kurulabilir dediğinde düğme görünür; kurulmuşsa ya da uygulama penceresindeyse görünmez
  let kurulum = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    kurulum = e;
    $('btnKur').hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    kurulum = null;
    $('btnKur').hidden = true;
    toast('WarrantyX yüklendi: masaüstünden ya da başlat menüsünden kendi penceresinde açılır.');
  });
  $('btnKur').addEventListener('click', async () => {
    if (!kurulum) return;
    const e = kurulum;
    kurulum = null;
    $('btnKur').hidden = true;
    await e.prompt();
  });

  // Test ve geliştirme için: tarayıcı konsolundan ya da otomatik denemeden erişilir
  window.WxApp = { state, pdfOlustur, onizle, belgeleriOku, ayarlariOku, ceHazirla, imzaEkle };

  basla();
})();
