/* WarrantyX kayıtları: garanti belgesi, CE uygunluk beyanı, imzalar ve ayarlar.
   Depoda düz dosya olarak durur: belgeler/<Seri No>.json, ce/<Seri No>.json, imzalar/<ad>.png ve ayarlar.json.
   Belge yalnız makineye özgü bilgiyi tutar. Garanti süresi belgede seçilir (13 ay ya da 2 yıl), çalışma saati
   ayarlardan gelir (2500 saat); kapak ve satıcı boş bırakılırsa ayarlardan gelir.
   CE belgesi imzasının adını taşır: oluşturulurken rastgele seçilir, bir önceki CE belgesinin imzası gelmez.
   Bu dosya tarayıcıya bağlı değildir; Node testleri aynı kodu çalıştırır. */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.WxKayit = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BELGE_DIR = 'belgeler';
  const AYARLAR_YOLU = 'ayarlar.json';
  const DILLER = ['tr', 'en', 'de'];
  // Tek kapak tasarımı var (Kırmızı Bant); eski kayıtlardaki başka değer buna düşer
  const KAPAKLAR = ['bant'];
  const BOLUMLER = ['kapak', 'sartlar', 'belge'];
  const FIRMA_ALANLARI = ['unvan', 'adres', 'telefon', 'faks', 'eposta', 'web'];

  /** Garanti süresi belgede seçilir; ilki varsayılandır. sartYil: şart metnindeki "… yıl veya 2500 (çalışma) saat" */
  const GARANTI_SURELERI = Object.freeze({
    '13ay': Object.freeze({ sayi: 13, birim: 'ay', sartYil: 1 }),
    '2yil': Object.freeze({ sayi: 2, birim: 'yil', sartYil: 2 })
  });
  const GARANTI_VARSAYILAN = Object.keys(GARANTI_SURELERI)[0];

  /** Ayarlar dosyasının biçimi. 2: imalatçı e-postası dolfin@dolfintr.com oldu (1'de boştu) */
  const AYARLAR_SURUM = 2;

  const VARSAYILAN_AYARLAR = Object.freeze({
    surum: AYARLAR_SURUM,
    kapakTasarimi: 'bant',
    marka: 'DOLFIN',
    urunCinsi: {
      tr: 'ENDÜSTRİYEL PARÇA YIKAMA MAKİNESİ',
      en: 'INDUSTRIAL PARTS WASHING MACHINE',
      de: 'INDUSTRIELLE TEILEREINIGUNGSMASCHINE'
    },
    garantiSaat: 2500,
    yedekParcaYil: 10,
    kullanimOmruYil: 10,
    onayTarihiSayisi: '18.10.2010-92367',
    imalatci: {
      unvan: 'CNK ELEKTRONİK MAKİNE SANAYİ A.Ş.',
      adres: '1. Organize Sanayi Bölgesi Orhan Işık Bulvarı No:8 SİNCAN - ANKARA',
      telefon: '+90 312 267 30 15 (pbx)',
      faks: '+90 312 267 30 11',
      eposta: 'dolfin@dolfintr.com',
      web: 'www.dolfintr.com'
    }
  });

  const text = (v) => (v === null || v === undefined ? '' : String(v));
  const clean = (v) => text(v).trim();

  /** Boş ya da geçersizse null: ayarlardaki değer kullanılır */
  function positive(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }

  function isoDate(v) {
    const s = clean(v);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  }

  /** Yerel saatle bugünün tarihi (yyyy-mm-dd) */
  function bugun(now) {
    const d = now ? new Date(now) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /** yyyy-mm-dd → gg.aa.yyyy; boşsa boş */
  function tarihYaz(iso) {
    const s = isoDate(iso);
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}.${m}.${y}`;
  }

  function firma(raw, fallback) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    for (const key of FIRMA_ALANLARI) out[key] = src[key] === undefined && fallback ? fallback[key] : clean(src[key]);
    return out;
  }

  /* ─── Ayarlar ─────────────────────────────────────────── */

  function ayarlariNormalize(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const d = VARSAYILAN_AYARLAR;
    const cinsi = src.urunCinsi && typeof src.urunCinsi === 'object' ? src.urunCinsi : {};
    const pick = (key) => (src[key] === undefined ? d[key] : clean(src[key]));
    const imalatci = firma(src.imalatci, d.imalatci);
    // Eski ayarlardaki boş e-posta o zamanki varsayılandı (silinmiş değil): yeni varsayılanı alır
    if ((Number(src.surum) || 1) < 2 && !imalatci.eposta) imalatci.eposta = d.imalatci.eposta;
    return {
      surum: AYARLAR_SURUM,
      kapakTasarimi: KAPAKLAR.includes(src.kapakTasarimi) ? src.kapakTasarimi : d.kapakTasarimi,
      marka: pick('marka') || d.marka,
      urunCinsi: Object.fromEntries(DILLER.map((l) => [l, cinsi[l] === undefined ? d.urunCinsi[l] : clean(cinsi[l])])),
      garantiSaat: positive(src.garantiSaat) || d.garantiSaat,
      yedekParcaYil: positive(src.yedekParcaYil) || d.yedekParcaYil,
      kullanimOmruYil: positive(src.kullanimOmruYil) || d.kullanimOmruYil,
      onayTarihiSayisi: pick('onayTarihiSayisi'),
      imalatci
    };
  }

  /* ─── Belge ───────────────────────────────────────────── */

  function bosBelge(now) {
    return belgeNormalize({ teslimTarihi: bugun(now) });
  }

  function belgeNormalize(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const satici = src.satici && typeof src.satici === 'object' ? src.satici : {};
    const bolum = src.bolumler && typeof src.bolumler === 'object' ? src.bolumler : {};
    return {
      surum: 1,
      seriNo: clean(src.seriNo),
      model: clean(src.model),
      musteri: clean(src.musteri),
      teslimTarihi: isoDate(src.teslimTarihi),
      garantiSuresi: GARANTI_SURELERI[src.garantiSuresi] ? src.garantiSuresi : GARANTI_VARSAYILAN,
      dil: DILLER.includes(src.dil) ? src.dil : 'tr',
      kapak: KAPAKLAR.includes(src.kapak) ? src.kapak : '',
      satici: Object.assign({ ayni: satici.ayni !== false }, firma(satici)),
      bolumler: Object.fromEntries(BOLUMLER.map((k) => [k, bolum[k] !== false])),
      olusturma: clean(src.olusturma),
      guncelleme: clean(src.guncelleme)
    };
  }

  /** Belge bu değerlerle basılır: garanti süresi belgeden, çalışma saati ayarlardan, boş bırakılan kapak ve satıcı ayarlardan */
  function etkin(belge, ayarlar) {
    const b = belgeNormalize(belge);
    const a = ayarlariNormalize(ayarlar);
    return {
      belge: b,
      ayarlar: a,
      kapak: b.kapak || a.kapakTasarimi,
      garanti: GARANTI_SURELERI[b.garantiSuresi],
      garantiSaat: a.garantiSaat,
      yedekParcaYil: a.yedekParcaYil,
      kullanimOmruYil: a.kullanimOmruYil,
      imalatci: a.imalatci,
      satici: b.satici.ayni ? a.imalatci : firma(b.satici)
    };
  }

  /* ─── CE uygunluk beyanı ──────────────────────────────── */

  const CE_DIR = 'ce';
  const CE_DILLER = ['tr', 'en', 'de'];
  /* İmzalar programın açık deposunda değil, özel veri deposunda durur: imzalar/<ad>.png.
     Belge imzanın adını taşır (ör. "imza-07"). */
  const IMZA_DIR = 'imzalar';
  const IMZA_ADI = /^[A-Za-z0-9._-]{1,80}$/;

  /** Taranmış CE belgesindeki ürün bilgileri: yeni CE belgesine gelir, sol menüden değişir.
      Ürün adı belgede tutulmaz: her makinede aynıdır, CE metninde sabittir (WxMetin.CE.<dil>.urun) */
  const CE_VARSAYILAN = Object.freeze({
    model: 'LYM 1350 NS',
    marka: 'Dolfin®',
    lvdRapor: '62024041.001',
    riskRapor: 'RA62024041001'
  });

  function ceNormalize(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const d = CE_VARSAYILAN;
    // Yazılmamış alan varsayılanla gelir; silinen alan boş kalır
    const pick = (key) => (src[key] === undefined ? d[key] : clean(src[key]));
    const imza = clean(src.imza);
    return {
      surum: 1,
      seriNo: clean(src.seriNo),
      musteri: clean(src.musteri),
      model: pick('model'),
      imalYili: clean(src.imalYili),
      tarih: isoDate(src.tarih),
      marka: pick('marka'),
      lvdRapor: pick('lvdRapor'),
      riskRapor: pick('riskRapor'),
      dil: CE_DILLER.includes(src.dil) ? src.dil : 'en',
      imza: IMZA_ADI.test(imza) ? imza : '',
      olusturma: clean(src.olusturma),
      guncelleme: clean(src.guncelleme)
    };
  }

  /** Yeni CE belgesi: tarih bugün, imal yılı bu yıl; seri no ve imza oluştururken gelir */
  function bosCe(now) {
    const d = now ? new Date(now) : new Date();
    return ceNormalize({ tarih: bugun(d), imalYili: String(d.getFullYear()) });
  }

  /* ─── CE imzası: rastgele, bir önceki CE belgesindekinden farklı ── */

  /**
   * Oluşturma sırasına göre komşu CE belgeleri.
   * @param olusturma verilmezse en son oluşturulan "önceki" olur (yeni belge için)
   * @param haric bu yoldaki belge sayılmaz (açık belgenin kendisi)
   */
  function ceKomsular(belgeler, olusturma, haricYol) {
    let onceki = null;
    let sonraki = null;
    const t = clean(olusturma);
    for (const item of belgeler || []) {
      const b = item && item.belge ? item.belge : item;
      if (!b || (haricYol && item.path === haricYol)) continue;
      const o = clean(b.olusturma);
      if (!t || o < t) {
        if (!onceki || o > clean(onceki.olusturma)) onceki = b;
      } else if (o > t && (!sonraki || o < clean(sonraki.olusturma))) {
        sonraki = b;
      }
    }
    return { onceki, sonraki };
  }

  /**
   * Rastgele imza. Önce hariç tutulanların hepsi dışarıda kalır; seçenek kalmazsa sondan başlayarak
   * birer birer serbest bırakılır (en önemlisi, bir önceki belgenin imzası, en son); tek imza varsa o gelir.
   * @param adlar mevcut imzalar @param haric verilmeyecek imzalar, en önemlisi başta @param rnd [0,1) üreteci
   * @returns imza adı; hiç imza yoksa boş
   */
  function imzaSec(adlar, haric, rnd) {
    const r = rnd || Math.random;
    const hepsi = [...new Set((adlar || []).filter((a) => IMZA_ADI.test(a)))].sort();
    if (!hepsi.length) return '';
    const h = haric || [];
    for (let n = h.length; n >= 0; n -= 1) {
      const disari = h.slice(0, n).filter(Boolean);
      const secenek = hepsi.filter((a) => !disari.includes(a));
      if (secenek.length) return secenek[Math.min(secenek.length - 1, Math.floor(r() * secenek.length))];
    }
    return hepsi[0];
  }

  /** Yeni CE belgesinin imzası: en son oluşturulan CE belgesindeki imza gelmez */
  function yeniCeImzasi(belgeler, adlar, rnd) {
    const { onceki } = ceKomsular(belgeler, '');
    return imzaSec(adlar, [onceki && onceki.imza], rnd);
  }

  /** Belgenin imzasını değiştirir: kendi imzası, bir önceki ve bir sonraki CE belgesinin imzası gelmez */
  function baskaCeImzasi(belge, belgeler, adlar, rnd, haricYol) {
    const { onceki, sonraki } = ceKomsular(belgeler, belge.olusturma, haricYol);
    return imzaSec(adlar, [onceki && onceki.imza, sonraki && sonraki.imza, belge.imza], rnd);
  }

  const imzaYolu = (ad) => `${IMZA_DIR}/${ad}.png`;
  const imzaYoluMu = (path) => new RegExp(`^${IMZA_DIR}/[A-Za-z0-9._-]{1,80}\\.png$`).test(path);
  const imzaAdi = (path) => String(path).slice(IMZA_DIR.length + 1).replace(/\.png$/, '');

  /** Yüklenen dosyanın adından imza adı: "İmza 07.PNG" → "imza-07" */
  function imzaAdiTemizle(dosya) {
    const ad = clean(dosya)
      .replace(/\.[^.]*$/, '')
      .toLocaleLowerCase('tr')
      .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c])
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 60);
    return ad || 'imza';
  }

  /**
   * PNG başlığı: genişlik, yükseklik ve çözünürlük (pHYs, yoksa 300 dpi: tarama çözünürlüğü).
   * @returns { w, h, dpi } ya da PNG değilse null
   */
  function pngBilgi(bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    const IMZA = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (b.length < 33 || IMZA.some((v, i) => b[i] !== v)) return null;
    const u32 = (at) => ((b[at] << 24) >>> 0) + (b[at + 1] << 16) + (b[at + 2] << 8) + b[at + 3];
    const tip = (at) => String.fromCharCode(b[at], b[at + 1], b[at + 2], b[at + 3]);
    if (tip(12) !== 'IHDR') return null;
    const out = { w: u32(16), h: u32(20), dpi: 300 };
    if (!out.w || !out.h) return null;
    for (let at = 8; at + 8 <= b.length;) {
      const len = u32(at);
      const t = tip(at + 4);
      if (t === 'pHYs' && len >= 9 && b[at + 16] === 1) {
        const dpi = Math.round(u32(at + 8) * 0.0254);
        if (dpi >= 72 && dpi <= 2400) out.dpi = dpi;
      }
      if (t === 'IDAT' || t === 'IEND') break;
      at += 12 + len;
    }
    return out;
  }

  /* ─── Depo yolları ────────────────────────────────────── */

  /** Seri no dosya adı olur: Windows ve Git'te sorun çıkaran karakterler atılır */
  function dosyaAdi(seri) {
    const name = clean(seri)
      .replace(/[\\/:*?"<>|#%\u0000-\u001f]/g, '_')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/, '');
    return name === '' || name === '.' || name === '..' ? '' : name;
  }

  /** @returns hata metni; geçerliyse boş */
  function seriHatasi(seri) {
    const s = clean(seri);
    if (!s) return 'Seri No gerekli.';
    if (s.length > 60) return 'Seri No en çok 60 karakter olabilir.';
    if (/[\\/]/.test(s)) return 'Seri No içinde / ya da \\ olamaz.';
    if (!dosyaAdi(s)) return 'Seri No geçersiz.';
    return '';
  }

  /** Silme onayı (GitHub'daki depo silme gibi): seri no ve "/onaylıyorum" baştan sona aynen yazılır */
  const silmeOnayMetni = (seri) => `${clean(seri)}/onaylıyorum`;
  const silmeOnaylandi = (seri, yazilan) => !!clean(seri) && text(yazilan).trim() === silmeOnayMetni(seri);

  const belgeYolu = (seri) => `${BELGE_DIR}/${dosyaAdi(seri)}.json`;

  /** Çakışma kopyaları (.catisma-…) ve alt klasörler belge sayılmaz */
  const belgeYoluMu = (path) => new RegExp(`^${BELGE_DIR}/[^/]+\\.json$`).test(path);

  const ceYolu = (seri) => `${CE_DIR}/${dosyaAdi(seri)}.json`;
  const ceYoluMu = (path) => new RegExp(`^${CE_DIR}/[^/]+\\.json$`).test(path);

  const dosyaAdiTemizle = (name) => `${name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim()}.pdf`;

  /** "0626051-DÜNYA-ULT M200 3B GARANTİ BELGESİ TR-EN.pdf" */
  function pdfDosyaAdi(belge, baslik, diller) {
    const b = belgeNormalize(belge);
    const parts = [b.seriNo, b.musteri, b.model].filter(Boolean);
    const tag = diller && diller.length > 1 ? ` ${diller.map((l) => l.toUpperCase()).join('-')}` : '';
    return dosyaAdiTemizle(`${parts.join('-')}${parts.length ? ' ' : ''}${baslik}${tag}`);
  }

  /** "0226089-KSYSTE-LYM 1350 NS CE CONFORMITY (EN-DEU).pdf": eski CE dosyalarının adı gibi */
  function cePdfDosyaAdi(belge, baslik, etiketler) {
    const b = ceNormalize(belge);
    const parts = [b.seriNo, b.musteri, b.model].filter(Boolean);
    const tag = etiketler && etiketler.length ? ` (${etiketler.join('-')})` : '';
    return dosyaAdiTemizle(`${parts.join('-')}${parts.length ? ' ' : ''}${baslik}${tag}`);
  }

  /* ─── Dosya içeriği ───────────────────────────────────── */

  const encode = (obj) => new TextEncoder().encode(`${JSON.stringify(obj, null, 2)}\n`);

  function decode(bytes) {
    return JSON.parse(new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, ''));
  }

  return {
    BELGE_DIR,
    CE_DIR,
    IMZA_DIR,
    AYARLAR_YOLU,
    DILLER,
    CE_DILLER,
    KAPAKLAR,
    BOLUMLER,
    GARANTI_SURELERI,
    VARSAYILAN_AYARLAR,
    CE_VARSAYILAN,
    bugun,
    tarihYaz,
    ayarlariNormalize,
    bosBelge,
    belgeNormalize,
    etkin,
    bosCe,
    ceNormalize,
    ceKomsular,
    imzaSec,
    yeniCeImzasi,
    baskaCeImzasi,
    imzaYolu,
    imzaYoluMu,
    imzaAdi,
    imzaAdiTemizle,
    pngBilgi,
    dosyaAdi,
    seriHatasi,
    silmeOnayMetni,
    silmeOnaylandi,
    belgeYolu,
    belgeYoluMu,
    ceYolu,
    ceYoluMu,
    pdfDosyaAdi,
    cePdfDosyaAdi,
    encode,
    decode
  };
});
