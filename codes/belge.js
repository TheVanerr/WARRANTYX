/* Belge motoru: kapak, garanti şartları, garanti belgesi ve servis kayıt sayfaları (A4 dikey).
   Sayfalar .print-sheet öğesidir; ekranda önizleme, PDF'te pdf-dom.js aynı öğeleri ölçüp çizer.
   Şartların metni değişmez, yalnız düzen eklenir: paragraf ve maddeler sırayla numaralanır,
   ":" ile biten maddenin ardındaki koşullar a), b), c) olur. Taşan madde yeni sayfaya geçer,
   başlık ve giriş maddesi sayfa sonunda yalnız kalmaz.
   Belgede ::before, liste imi ve çerçeveli yuvarlak kullanılmaz: PDF çizici bunları çizmez. */

const WxBelge = (() => {
  const esc = WxMetin.esc;

  /* A4 dikey, 96 dpi */
  const PAGE_W = 793.7;
  const PAGE_H = 1122.5;

  const gorsel = () => (typeof window !== 'undefined' && window.WX_GORSEL) || { logo: 'assets/logos/dolfin.png' };

  function baglam(belge, ayarlar, dil) {
    const e = WxKayit.etkin(belge, ayarlar);
    const id = WxMetin.DILLER[dil] ? dil : e.belge.dil;
    return {
      e,
      b: e.belge,
      a: e.ayarlar,
      t: WxMetin.dil(id),
      dil: id,
      logo: gorsel().logo,
      upper: (s) => String(s || '').toLocaleUpperCase(id)
    };
  }

  const el = (html) => {
    const box = document.createElement('div');
    box.innerHTML = html.trim();
    return box.firstElementChild;
  };

  /** Değer yoksa elle doldurulacak çizgi kalır */
  const deger = (v, cls) => (v
    ? `<span class="${cls}">${esc(v)}</span>`
    : `<span class="${cls} wx-blank"></span>`);

  /** Uzun yazı kendi alanına sığsın */
  function boy(text, sizes) {
    const len = String(text).length;
    if (len <= 10) return sizes[0];
    if (len <= 16) return sizes[1];
    if (len <= 24) return sizes[2];
    if (len <= 34) return sizes[3];
    return sizes[4];
  }

  function sayfa(cls, c) {
    const page = document.createElement('div');
    page.className = `print-sheet wx-page ${cls}`;
    // Büyük harfe çevirme belgenin dilinde: Türkçede i → İ
    page.lang = c.dil;
    return page;
  }

  const tarih = (iso) => WxKayit.tarihYaz(iso);
  const sure = (c) => c.t.sureDeger(c.e.garantiYil, c.e.garantiSaat);

  /* ─── Kapak: Kırmızı Bant ─────────────────────────────────
     P&ID kapak stüdyosunun dili: solda tam boy kırmızı bant, içinde dikey dev GARANTİ yazısı ve seri no;
     harf aralıklı kırmızı üst başlık, ağır büyük model adı, kırmızı çizgi, gri müşteri;
     gri etiketli bilgi satırları, büyük rakamlı garanti göstergeleri, kırmızı firma adı. */

  /** Başlık model adıdır; model yazılmamışsa belge adı başlık, ürün grubu üst başlık olur */
  function bas(c) {
    const h = c.b.model
      ? { kicker: c.t.belgeAdi, title: c.upper(c.b.model) }
      : { kicker: c.t.kicker, title: c.t.belgeAdi };
    return `
      <div class="wx-cv-kicker">${esc(h.kicker)}</div>
      <h1 class="wx-cv-title" style="font-size:${boy(h.title, [72, 60, 46, 38, 30])}px">${esc(h.title)}</h1>
      <div class="wx-cv-rule"></div>
      ${c.b.musteri ? `<div class="wx-cv-customer">${esc(c.upper(c.b.musteri))}</div>` : ''}`;
  }

  const satirlar = (rows) => `<div class="wx-cv-list">${rows.map(([label, value, strong]) =>
    `<div class="wx-cv-row"><span class="wx-cv-dt">${esc(label)}</span>${deger(value, strong ? 'wx-cv-dd strong' : 'wx-cv-dd')}</div>`).join('')}</div>`;

  /** Garanti göstergeleri: büyük kırmızı sayı, altında iki satır etiket */
  function gostergeler(c) {
    const items = [['garanti', c.e.garantiYil], ['saat', c.e.garantiSaat], ['yedek', c.e.yedekParcaYil]];
    return `<div class="wx-cv-stats">${items.map(([key, value]) => {
      const [a, b] = c.t.istatistik[key](value);
      return `<div class="wx-cv-stat"><b>${esc(value)}</b><span>${esc(a)}<br>${esc(b)}</span></div>`;
    }).join('')}</div>`;
  }

  function kapakHtml(c) {
    const k = c.t.kapak;
    return `
      <aside class="wx-b-band">
        <div class="wx-b-spine"><span>${esc(k.seri)}</span>${c.b.seriNo ? `<b>${esc(c.b.seriNo)}</b>` : ''}</div>
        <div class="wx-b-mark">${esc(c.t.isaret)}</div>
      </aside>
      <div class="wx-b-main">
        <div class="wx-b-top">
          <img class="wx-cv-logo" src="${esc(c.logo)}" alt="">
        </div>
        <div class="wx-b-head">${bas(c)}</div>
        ${satirlar([
          [k.seri, c.b.seriNo, true],
          [k.teslim, tarih(c.b.teslimTarihi)],
          [k.alici, c.b.musteri],
          [k.sure, sure(c)],
          [c.t.belge.cinsi, c.a.urunCinsi[c.dil]]
        ])}
        ${gostergeler(c)}
        <div class="wx-cv-foot">
          <span class="wx-cv-firm">${esc(c.e.imalatci.unvan)}</span>
          <span class="wx-cv-note">${esc(k.saklayin)}</span>
        </div>
      </div>`;
  }

  function kapak(belge, ayarlar, dil) {
    const c = baglam(belge, ayarlar, dil);
    const page = sayfa('wx-cover wx-cv-bant', c);
    page.innerHTML = kapakHtml(c);
    return page;
  }

  /* ─── Antetli iç sayfa ────────────────────────────────── */

  function icSayfa(c, extraCls) {
    const page = sayfa(`wx-inner${extraCls ? ` ${extraCls}` : ''}`, c);
    const right = [c.t.belgeAdi, c.upper(c.b.model)].filter(Boolean).join(' · ');
    const mid = c.b.seriNo ? `${c.t.kapak.seri}: ${c.b.seriNo}` : '';
    page.innerHTML = `
      <div class="wx-ph">
        <div class="wx-ph-brand"><span class="wx-ph-name">${esc(c.a.marka)}</span><span class="wx-ph-sub">${esc(c.t.markaAlt)}</span></div>
        <div class="wx-ph-right">${esc(right)}</div>
      </div>
      <div class="wx-body"></div>
      <div class="wx-pf-line"></div>
      <div class="wx-pf">
        <span class="wx-pf-left">${esc(c.e.imalatci.unvan)}</span>
        <span class="wx-pf-mid">${esc(mid)}</span>
        <span class="wx-pf-num"></span>
      </div>`;
    return page;
  }

  /* ─── Garanti şartları: düzen ve sayfalama ────────────── */

  const duzMetin = (html) => html.replace(/<[^>]+>/g, '').trim();
  const HARFLER = 'abcdefghijklmnopqrstuvwxyz';

  const madde = (no, html, cls) =>
    el(`<div class="wx-cl${cls ? ` ${cls}` : ''}"><span class="wx-cl-no">${esc(no)}</span><div class="wx-cl-text">${html}</div></div>`);

  /**
   * Bloklar → dizgi öğeleri. Metin aynen kalır.
   * Paragraf ve maddeler sırayla 1., 2., … olur; ":" ile biten paragrafın ardından gelen liste a), b), c) olur.
   */
  function dizgi(bloklar) {
    const out = [];
    let no = 0;
    for (let i = 0; i < bloklar.length; i += 1) {
      const b = bloklar[i];
      if (b.t === 'h1') out.push(el(`<h1 class="wx-h1">${b.html}</h1>`));
      else if (b.t === 'h2') out.push(el(`<h2 class="wx-h2">${b.html}</h2>`));
      else if (b.t === 'lead') out.push(el(`<p class="wx-lead">${b.html}</p>`));
      else if (b.t === 'ul') {
        for (const html of b.items) out.push(madde(`${(no += 1)}.`, html));
      } else {
        const next = bloklar[i + 1];
        const giris = next && next.t === 'ul' && duzMetin(b.html).endsWith(':');
        out.push(madde(`${(no += 1)}.`, b.html, giris ? 'wx-cl-intro' : ''));
        if (giris) {
          next.items.forEach((html, j) => out.push(madde(`${HARFLER[j] || j + 1})`, html, 'wx-cl-sub')));
          i += 1;
        }
      }
    }
    return out;
  }

  /** Sayfa sonunda yalnız kalmayacak öğe: başlık, vurgulu kutu ya da a) b) c) maddelerinin girişi */
  const birlikteGider = (prev, node) => /^H[12]$/.test(prev.tagName)
    || prev.classList.contains('wx-lead')
    || (prev.classList.contains('wx-cl-intro') && node.classList.contains('wx-cl-sub'));

  /** Öğeleri sayfalara dizer. yeniSayfa() yeni sayfanın gövdesini döndürür; gövde düzende olmalı (ölçülür). */
  function akis(ogeler, yeniSayfa) {
    let body = yeniSayfa();
    const tasti = () => body.scrollHeight > body.clientHeight + 0.5;
    for (const node of ogeler) {
      body.appendChild(node);
      if (!tasti() || body.firstElementChild === node) continue;
      node.remove();
      const carry = [];
      let next = node;
      while (body.lastElementChild && body.lastElementChild !== body.firstElementChild && birlikteGider(body.lastElementChild, next)) {
        next = body.lastElementChild;
        carry.unshift(next);
        next.remove();
      }
      body = yeniSayfa();
      for (const n of carry) body.appendChild(n);
      body.appendChild(node);
    }
  }

  /** Sayfa gövdesinin ne kadarı dolu (0–1) */
  function doluluk(page) {
    const body = page.querySelector('.wx-body');
    const last = body.lastElementChild;
    return last ? (last.offsetTop + last.offsetHeight) / body.clientHeight : 0;
  }

  const SIKI_ESIK = 0.3;

  /**
   * Şartları dizer. Son sayfada yalnız birkaç satır kalırsa metin biraz sıkılaştırılıp yeniden dizilir;
   * sayfa sayısı azalmazsa normal dizgiye dönülür.
   */
  function sartlar(c, inner, pages, yeni) {
    const bloklar = WxMetin.sartBloklari(c.dil, c.e);
    const start = inner.length;
    const diz = (cls) => {
      for (const page of inner.splice(start)) {
        page.remove();
        pages.splice(pages.indexOf(page), 1);
      }
      akis(dizgi(bloklar), () => yeni(cls));
      return inner.length - start;
    };
    const normal = diz('wx-terms');
    if (normal < 2 || doluluk(inner[inner.length - 1]) > SIKI_ESIK) return;
    if (diz('wx-terms wx-tight') >= normal) diz('wx-terms');
  }

  /* ─── Garanti belgesi sayfası ─────────────────────────── */

  const kv = (label, value, opts) => {
    const o = opts || {};
    return `<div class="wx-kv${o.full ? ' full' : ''}"><span class="wx-k">${esc(label)}</span>${deger(value, o.strong ? 'wx-v strong' : 'wx-v')}</div>`;
  };

  function firmaRows(t, f, blanks) {
    const rows = [
      [t.unvan, f.unvan],
      [t.adres, f.adres],
      [t.telefon, f.telefon],
      [t.faks, f.faks],
      [t.eposta, f.eposta],
      [t.web, f.web]
    ];
    // İmalatçının boş e-posta ve web satırı basılmaz; satıcıda elle doldurulsun diye çizgi kalır
    return rows.filter(([, v], i) => v || (blanks && i < 5)).map(([l, v]) => kv(l, v)).join('');
  }

  function belgeHtml(c) {
    const t = c.t.belge;
    const b = c.b;
    const sign = (title) => `<div class="wx-sign"><span>${esc(title)}</span><div class="wx-sign-foot"><em>${esc(t.kase)}</em><em>${esc(t.tarih)}</em></div></div>`;
    return `
      <div class="wx-cert">
        <div class="wx-cert-head">
          <div>
            <div class="wx-cert-kicker">${esc(c.a.marka)} · ${esc(c.t.kicker)}</div>
            <h1 class="wx-cert-title">${esc(t.baslik)}</h1>
          </div>
        </div>
        <div class="wx-cert-approval"><span>${esc(t.onay)}:</span>${deger(c.a.onayTarihiSayisi, 'wx-cert-approval-v')}</div>
        <p class="wx-cert-legal">${esc(t.yasal)}</p>
        <section class="wx-sec">
          <h2 class="wx-sec-title">${esc(t.urun)}</h2>
          <div class="wx-grid2">
            ${kv(t.cinsi, c.a.urunCinsi[c.dil], { full: true })}
            ${kv(t.markasi, c.a.marka)}
            ${kv(t.modeli, b.model)}
            ${kv(t.seriNo, b.seriNo, { strong: true })}
            ${kv(t.sure, sure(c))}
            ${kv(t.teslimTarihi, tarih(b.teslimTarihi))}
            ${kv(t.teslimYeri, b.teslimYeri)}
            ${kv(t.fatura, tarih(b.faturaTarihi))}
            ${kv(t.alici, b.musteri)}
          </div>
        </section>
        <div class="wx-cert-two">
          <section class="wx-sec"><h2 class="wx-sec-title">${esc(t.imalatci)}</h2>${firmaRows(t, c.e.imalatci, false)}</section>
          <section class="wx-sec"><h2 class="wx-sec-title">${esc(t.satici)}</h2>${firmaRows(t, c.e.satici, true)}</section>
        </div>
        <div class="wx-cert-alert"><b>${esc(t.dikkat)}</b><span>${esc(t.dikkatMetin)}</span></div>
        <div class="wx-cert-sign">
          ${sign(t.imalatci)}
          ${sign(t.satici)}
        </div>
      </div>`;
  }

  /* ─── Servis kayıt sayfası ────────────────────────────── */

  const SERVIS_SATIR = 15;

  function servisHtml(c) {
    const t = c.t.servis;
    const cells = (list) => list.map((v) => `<span>${esc(v)}</span>`).join('');
    const empty = '<div class="wx-tr">' + '<span></span>'.repeat(5) + '</div>';
    const meta = [
      [c.t.kapak.seri, c.b.seriNo],
      [c.t.kapak.model, c.b.model],
      [c.t.kapak.teslim, tarih(c.b.teslimTarihi)]
    ];
    return `
      <div class="wx-svc">
        <h1 class="wx-h1">${esc(t.baslik)}</h1>
        <p class="wx-p">${esc(t.aciklama)}</p>
        <div class="wx-svc-meta">${meta.map(([l, v]) => `<div><span>${esc(l)}</span>${deger(v, 'wx-svc-v')}</div>`).join('')}</div>
        <div class="wx-tbl">
          <div class="wx-tr wx-th">${cells([t.tarih, t.form, t.islem, t.saat, t.imza])}</div>
          ${empty.repeat(SERVIS_SATIR)}
        </div>
      </div>`;
  }

  /* ─── Belgenin tamamı ─────────────────────────────────── */

  /**
   * Sayfaları host'a ekler; host düzende olmalı (şartlar ölçülerek bölünür).
   * Kapak numarasız, gerisi tek sırada numaralanır.
   * @param bolumler { kapak, sartlar, belge, servis } — verilmezse belgedeki seçim
   * @returns eklenen sayfalar
   */
  function olustur(host, belge, ayarlar, dil, bolumler) {
    const c = baglam(belge, ayarlar, dil);
    const bol = Object.assign({}, c.b.bolumler, bolumler || {});
    const pages = [];
    if (bol.kapak) {
      const cover = kapak(belge, ayarlar, c.dil);
      host.appendChild(cover);
      pages.push(cover);
    }
    const inner = [];
    const yeni = (cls) => {
      const page = icSayfa(c, cls);
      host.appendChild(page);
      inner.push(page);
      pages.push(page);
      return page.querySelector('.wx-body');
    };
    if (bol.sartlar) sartlar(c, inner, pages, yeni);
    if (bol.belge) yeni('wx-certificate').innerHTML = belgeHtml(c);
    if (bol.servis) yeni('wx-service').innerHTML = servisHtml(c);
    inner.forEach((page, i) => {
      page.querySelector('.wx-pf-num').textContent = c.t.sayfa(i + 1, inner.length);
    });
    return pages;
  }

  return { PAGE_W, PAGE_H, kapak, olustur };
})();
