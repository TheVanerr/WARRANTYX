/* CE uygunluk beyanı: tek A4 sayfa, EN ve DE. Taranmış CE belgesinin düzeni olduğu gibi kurulur.
   Her satırın yeri belgeden ölçüldü (mm, taban çizgisi): satırlar kendi taban çizgisine oturur, akışa bağlı değildir.
   Değişen yerler: ürün bilgileri, seri no, imal yılı, düzenleme tarihi ve imza (belgenin kendi imzası).
   İmza görselleri özel veri deposundan gelir (imzalar/<ad>.png); programın açık deposunda imza yoktur.
   Sayfalar .print-sheet öğesidir; ekranda önizleme, PDF'te pdf-dom.js aynı öğeleri ölçüp çizer.
   Yazı tipleri: Segoe UI (PDF'te Selawik), Caladea (Cambria ölçülerinde), Barlow Semi Condensed (DIN). */

const WxCe = (() => {
  const esc = WxMetin.esc;
  const K = WxKayit;

  const PAGE_W = 793.7;
  const PAGE_H = 1122.5;
  const PT = 25.4 / 72;
  /** İmzalar sayfaya daha büyük atıldı: CE belgesindeki boya küçülür (taranmış belgedeki imza ~27,6 mm geniş) */
  const IMZA_OLCEK = 0.82;
  /** Başka çözünürlükte yüklenen imza bu kutuyu aşmaz (mm) */
  const IMZA_EN_FAZLA = { w: 34, h: 21 };

  const gorsel = () => (typeof window !== 'undefined' && window.WX_GORSEL) || { logo: 'assets/logos/dolfin.png' };

  /* Yazı tiplerinin satır ölçüsü (em): tarayıcı satırı yükseklik ve derinlik toplamına göre ortalar.
     Segoe UI ve Selawik Windows ölçüsü, Caladea ve Barlow typo ölçüsü kullanır. */
  const YAZI = {
    sans: { a: 1.079, d: 0.251 },
    serif: { a: 0.9, d: 0.25 },
    din: { a: 1.0, d: 0.2 }
  };
  /** Tarayıcı satır ölçüsünü tam piksele yuvarlar: taramayla karşılaştırınca taban çizgisi bu kadar yukarıda kaldı */
  const TABAN_DUZELTME = 0.13;

  /* ─── Ölçüler (mm) ────────────────────────────────────────
     x: yazının sol kenarı, r: sağ kenarı (sağa yaslı), b: taban çizgisi. */
  const ORTAK = {
    logo: { x: 30.13, y: 44.14, w: 56.49, h: 20.15 },
    ayrac: { x: 97.04, y: 15.6, h: 24.4 },
    baslik: { x: 102.2, b: 30.65 },
    etiket: { x: 89.76, b: 47.92 },
    firma: { x: 89.85, b: 54.53 },
    adres: { x: 90.0, b: 58.0 },
    web: { x: 90.1, b: 61.38 },
    tablo: { x: 25.16, xd: 62.75, b: [74.51, 78.66, 82.8, 87.04, 91.19] },
    kriterBaslik: { x: 25.59, b: 105.58 },
    kriter: { x: 25.27, xd: 50.31, b: [110.74, 114.89, 118.96] },
    cizgi: { x: 24.65, w: 160.7, y: 124.88, h: 0.59 },
    // Standart açıklamaları belgedeki satırlarıyla yazılır; satır aralığı taramadan
    metin: { x: 25.07, aralik: 3.257 },
    isaret: { x: 36.17, w: 16.68, h: 14.9 },
    beyan: { x: 57.84 },
    imzaSatir: { r: 132.6 },
    tarih: { x: 136.92 },
    imzaCizgi: { x: 134.97, w: 50.38 },
    imza: { x: 133.0 },
    alt: { cx: 105.0 }
  };
  const DIL = {
    en: {
      ust: { r: 92.89, b: [[22.1, 25.23, 28.53], [32.77, 35.9]] },
      std: [[132.59, 136.91], [155.96, 160.1], [178.22, 182.37], [193.97, 198.2], [209.63, 213.87]],
      beyan: [231.06, 235.03, 239.01],
      isaret: 226.82,
      imzaSatir: 256.79,
      imzaCizgi: 257.81,
      tarih: 260.86,
      alt: 268.56
    },
    de: {
      ust: { r: 92.89, b: [[17.1, 19.81, 22.69, 25.48], [30.06, 32.94, 35.73, 38.61]] },
      std: [[130.47, 134.79], [157.06, 161.29], [176.11, 180.25], [195.07, 199.31], [210.82, 215.05]],
      beyan: [228.94, 232.92, 236.98, 240.96],
      isaret: 226.48,
      imzaSatir: 253.24,
      imzaCizgi: 254.3,
      tarih: 257.3,
      alt: 265.09
    }
  };

  /* ─── Yazı ölçüleri (pt) ──────────────────────────────────
     Sınıf → yazı ailesi, boy ve satır aralığı. Renk ve harf aralığı ce.css'te. */
  const SINIF = {
    'ce-ust': { yazi: 'din', boy: { en: 7.4, de: 6.32 } },
    'ce-baslik': { yazi: 'serif', boy: { en: 20, de: 21.1 } },
    'ce-etiket': { yazi: 'din', boy: 6.2 },
    'ce-firma': { yazi: 'serif', boy: 16 },
    'ce-adres': { yazi: 'din', boy: 8 },
    'ce-web': { yazi: 'din', boy: 8 },
    'ce-tablo': { yazi: 'sans', boy: 8.8 },
    'ce-kriter-baslik': { yazi: 'serif', boy: 20 },
    'ce-kriter': { yazi: 'sans', boy: 8.8 },
    'ce-std-ad': { yazi: 'sans', boy: 7.93 },
    'ce-std-metin': { yazi: 'sans', boy: 6.85 },
    'ce-beyan': { yazi: 'serif', boy: 10.8 },
    'ce-imza-satir': { yazi: 'sans', boy: 8.6 },
    'ce-tarih': { yazi: 'sans', boy: 7 },
    'ce-alt': { yazi: 'sans', boy: 6.84 }
  };

  const boyOf = (cls, dil) => {
    const s = SINIF[cls].boy;
    return typeof s === 'object' ? s[dil] : s;
  };

  /** Taban çizgisi b (mm) olan satırın kutusu. Satır yüksekliği yazının kendi ölçüsüdür: taban çizgisi
      kutunun üstünden yükseklik (ascent) kadar aşağıdadır. */
  function satirStil(cls, dil, b, pos) {
    const m = YAZI[SINIF[cls].yazi];
    const s = boyOf(cls, dil);
    const top = b + TABAN_DUZELTME - m.a * s * PT;
    return `top:${top.toFixed(3)}mm;${pos};font-size:${s}pt;line-height:${((m.a + m.d) * s).toFixed(3)}pt`;
  }

  const sol = (x) => `left:${x}mm`;
  const sag = (r) => `right:${(210 - r).toFixed(3)}mm`;

  /** ® ve ™ belgede küçük ve yukarıda yazar */
  const isaretli = (text) => esc(text).replace(/[®™]/g, (c) => `<span class="ce-sup">${c}</span>`);

  /* ─── CE işareti: iki yarım halka, E'nin ortasında halka kalınlığında çubuk (taranmış belgedeki oranlar) ── */
  const R = 88;
  const RI = 60.7;
  const UC = 4;
  const halka = (cx) => `M${cx + UC} 0H${cx}A${R} ${R} 0 0 0 ${cx} ${2 * R}H${cx + UC}V${R + RI}H${cx}A${RI} ${RI} 0 0 1 ${cx} ${R - RI}H${cx + UC}Z`;
  const ISARET = `<svg class="ce-isaret-svg" viewBox="0 0 197 176" xmlns="http://www.w3.org/2000/svg" aria-label="CE">
      <path d="${halka(88)}"/><path d="${halka(193)}"/><path d="M130 74.5H197V101.5H130Z"/></svg>`;

  /** İmzanın sayfadaki boyu (mm): taramanın gerçek boyu küçültülür, çok büyük görsel kutuya sığar */
  function imzaBoyu(v) {
    const dpi = v.dpi || 300;
    let w = (v.w / dpi) * 25.4 * IMZA_OLCEK;
    let h = (v.h / dpi) * 25.4 * IMZA_OLCEK;
    const k = Math.min(1, IMZA_EN_FAZLA.w / w, IMZA_EN_FAZLA.h / h);
    w *= k;
    h *= k;
    return { w, h };
  }

  function imzaHtml(v, g, d) {
    if (!v || !v.src) return '';
    const { w, h } = imzaBoyu(v);
    // İmzanın ortası ad satırının taban çizgisinde (taranmış belgelerdeki gibi)
    return `<img class="ce-imza" src="${esc(v.src)}" alt="" style="left:${g.imza.x}mm;top:${(d.imzaSatir - h / 2).toFixed(3)}mm;width:${w.toFixed(3)}mm;height:${h.toFixed(3)}mm">`;
  }

  function sayfaHtml(b, id, imzalar) {
    const t = WxMetin.ceDil(id);
    const g = ORTAK;
    const d = DIL[id];
    const line = (cls, bb, pos, html, extra) => `<div class="ce-l ${cls}${extra ? ` ${extra}` : ''}" style="${satirStil(cls, id, bb, pos)}">${html}</div>`;

    const ustSatirlar = t.ust.flatMap((p, i) => p.map((s, j) => line('ce-ust', d.ust.b[i][j], sag(d.ust.r), esc(s))));

    const tablo = [
      [t.urunAdi, isaretli(t.urun)],
      [t.tipModel, `${isaretli(b.model)} | ${esc(t.seriNo)}: <span class="ce-alan">${esc(b.seriNo)}</span>`],
      [t.imalYili, esc(b.imalYili)],
      [t.marka, isaretli(b.marka)],
      [t.raporlar, `${esc(t.lvd)} ${esc(b.lvdRapor)} | ${esc(t.risk)} ${esc(b.riskRapor)}`]
    ].flatMap(([k, v], i) => [
      line('ce-tablo', g.tablo.b[i], sol(g.tablo.x), esc(k), 'ce-tablo-k'),
      line('ce-tablo', g.tablo.b[i], sol(g.tablo.xd), `: ${v}`, 'ce-tablo-v')
    ]);

    const kriterler = t.kriterler.flatMap(([kod, ad], i) => [
      line('ce-kriter', g.kriter.b[i], sol(g.kriter.x), esc(kod)),
      line('ce-kriter', g.kriter.b[i], sol(g.kriter.xd), esc(ad))
    ]);

    const standartlar = t.standartlar.flatMap((s, i) => [
      line('ce-std-ad', d.std[i][0], sol(g.metin.x), `<b>${esc(s.kod)}</b> | ${esc(s.ad)}`),
      ...s.metin.map((m, j) => line('ce-std-metin', d.std[i][1] + j * g.metin.aralik, sol(g.metin.x), esc(m)))
    ]);

    const beyan = t.beyan.map((s, i) => line('ce-beyan', d.beyan[i], sol(g.beyan.x), esc(s)));

    const imzalayan = t.imzalayan.map(([s, kalin, buyuk]) => `<span class="${kalin ? 'ce-kalin' : ''}${buyuk ? ' ce-buyuk' : ''}">${esc(s)}</span>`).join('');

    return `
      ${ustSatirlar.join('')}
      <div class="ce-ayrac" style="left:${g.ayrac.x}mm;top:${g.ayrac.y}mm;height:${g.ayrac.h}mm"></div>
      ${line('ce-baslik', g.baslik.b, sol(g.baslik.x), esc(t.baslik))}
      <img class="ce-logo" src="${esc(gorsel().logo)}" alt="" style="left:${g.logo.x}mm;top:${g.logo.y}mm;width:${g.logo.w}mm;height:${g.logo.h}mm">
      ${line('ce-etiket', g.etiket.b, sol(g.etiket.x), esc(t.imalatciEtiket))}
      ${line('ce-firma', g.firma.b, sol(g.firma.x), esc(t.firma))}
      ${line('ce-adres', g.adres.b, sol(g.adres.x), esc(t.adres))}
      ${line('ce-web', g.web.b, sol(g.web.x), esc(t.web))}
      ${tablo.join('')}
      ${line('ce-kriter-baslik', g.kriterBaslik.b, sol(g.kriterBaslik.x), esc(t.kriterBaslik))}
      ${kriterler.join('')}
      <div class="ce-cizgi" style="left:${g.cizgi.x}mm;top:${g.cizgi.y}mm;width:${g.cizgi.w}mm;height:${g.cizgi.h}mm"></div>
      ${standartlar.join('')}
      <div class="ce-isaret" style="left:${g.isaret.x}mm;top:${d.isaret}mm;width:${g.isaret.w}mm;height:${g.isaret.h}mm">${ISARET}</div>
      ${beyan.join('')}
      ${line('ce-imza-satir', d.imzaSatir, sag(g.imzaSatir.r), imzalayan)}
      <div class="ce-imza-cizgi" style="left:${g.imzaCizgi.x}mm;top:${(d.imzaCizgi - 0.085).toFixed(3)}mm;width:${g.imzaCizgi.w}mm"></div>
      ${line('ce-tarih', d.tarih, sag(g.imzaSatir.r), esc(t.tarihEtiket))}
      ${line('ce-tarih', d.tarih, sol(g.tarih.x), `<span class="ce-alan">${esc(K.tarihYaz(b.tarih))}</span>`)}
      ${imzaHtml(b.imza && imzalar ? imzalar.get(b.imza) : null, g, d)}
      ${line('ce-alt', d.alt, `left:0;width:${2 * g.alt.cx}mm;text-align:center`, esc(t.alt))}`;
  }

  /**
   * CE sayfası; dil verilmezse belgenin dili.
   * @param imzalar Map: imza adı → { src, w, h, dpi } (veritabanındaki imzalar/<ad>.png)
   */
  function sayfa(belge, dil, imzalar) {
    const b = K.ceNormalize(belge);
    const id = K.CE_DILLER.includes(dil) ? dil : b.dil;
    const page = document.createElement('div');
    page.className = 'print-sheet wx-page wx-ce';
    page.lang = id;
    page.innerHTML = sayfaHtml(b, id, imzalar);
    return page;
  }

  /** Sayfayı host'a ekler; garanti belgesindeki olustur ile aynı biçim */
  function olustur(host, belge, dil, imzalar) {
    const page = sayfa(belge, dil, imzalar);
    host.appendChild(page);
    return [page];
  }

  return { PAGE_W, PAGE_H, IMZA_OLCEK, imzaBoyu, sayfa, olustur };
})();
