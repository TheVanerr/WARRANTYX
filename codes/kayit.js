/* WarrantyX kayıtları: garanti belgesi ve ayarlar.
   Depoda düz JSON dosyası olarak durur: belgeler/<Seri No>.json ve ayarlar.json.
   Belge yalnız makineye özgü bilgiyi tutar. Garanti süresi ve çalışma saati her belgede ayarlardan gelir
   (1 yıl veya 2500 saat); kapak ve satıcı boş bırakılırsa ayarlardan gelir.
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
  const BOLUMLER = ['kapak', 'sartlar', 'belge', 'servis'];
  const FIRMA_ALANLARI = ['unvan', 'adres', 'telefon', 'faks', 'eposta', 'web'];

  const VARSAYILAN_AYARLAR = Object.freeze({
    surum: 1,
    kapakTasarimi: 'bant',
    marka: 'DOLFIN',
    urunCinsi: {
      tr: 'ENDÜSTRİYEL PARÇA YIKAMA MAKİNESİ',
      en: 'INDUSTRIAL PARTS WASHING MACHINE',
      de: 'INDUSTRIELLE TEILEREINIGUNGSMASCHINE'
    },
    garantiYil: 1,
    garantiSaat: 2500,
    yedekParcaYil: 10,
    kullanimOmruYil: 10,
    onayTarihiSayisi: '18.10.2010-92367',
    imalatci: {
      unvan: 'CNK ELEKTRONİK MAKİNE SANAYİ A.Ş.',
      adres: '1. Organize Sanayi Bölgesi Orhan Işık Bulvarı No:8 SİNCAN - ANKARA',
      telefon: '+90 312 267 30 15 (pbx)',
      faks: '+90 312 267 30 11',
      eposta: '',
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
    return {
      surum: 1,
      kapakTasarimi: KAPAKLAR.includes(src.kapakTasarimi) ? src.kapakTasarimi : d.kapakTasarimi,
      marka: pick('marka') || d.marka,
      urunCinsi: Object.fromEntries(DILLER.map((l) => [l, cinsi[l] === undefined ? d.urunCinsi[l] : clean(cinsi[l])])),
      garantiYil: positive(src.garantiYil) || d.garantiYil,
      garantiSaat: positive(src.garantiSaat) || d.garantiSaat,
      yedekParcaYil: positive(src.yedekParcaYil) || d.yedekParcaYil,
      kullanimOmruYil: positive(src.kullanimOmruYil) || d.kullanimOmruYil,
      onayTarihiSayisi: pick('onayTarihiSayisi'),
      imalatci: firma(src.imalatci, d.imalatci)
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
      teslimYeri: clean(src.teslimYeri),
      faturaTarihi: isoDate(src.faturaTarihi),
      dil: DILLER.includes(src.dil) ? src.dil : 'tr',
      kapak: KAPAKLAR.includes(src.kapak) ? src.kapak : '',
      satici: Object.assign({ ayni: satici.ayni !== false }, firma(satici)),
      bolumler: Object.fromEntries(BOLUMLER.map((k) => [k, bolum[k] !== false])),
      olusturma: clean(src.olusturma),
      guncelleme: clean(src.guncelleme)
    };
  }

  /** Belge bu değerlerle basılır: garanti süresi ayarlardan, boş bırakılan kapak ve satıcı ayarlardan */
  function etkin(belge, ayarlar) {
    const b = belgeNormalize(belge);
    const a = ayarlariNormalize(ayarlar);
    return {
      belge: b,
      ayarlar: a,
      kapak: b.kapak || a.kapakTasarimi,
      garantiYil: a.garantiYil,
      garantiSaat: a.garantiSaat,
      yedekParcaYil: a.yedekParcaYil,
      kullanimOmruYil: a.kullanimOmruYil,
      imalatci: a.imalatci,
      satici: b.satici.ayni ? a.imalatci : firma(b.satici)
    };
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

  const belgeYolu = (seri) => `${BELGE_DIR}/${dosyaAdi(seri)}.json`;

  /** Çakışma kopyaları (.catisma-…) ve alt klasörler belge sayılmaz */
  const belgeYoluMu = (path) => new RegExp(`^${BELGE_DIR}/[^/]+\\.json$`).test(path);

  /** "0626051-DÜNYA-ULT M200 3B GARANTİ BELGESİ TR-EN.pdf" */
  function pdfDosyaAdi(belge, baslik, diller) {
    const b = belgeNormalize(belge);
    const parts = [b.seriNo, b.musteri, b.model].filter(Boolean);
    const tag = diller && diller.length > 1 ? ` ${diller.map((l) => l.toUpperCase()).join('-')}` : '';
    const name = `${parts.join('-')}${parts.length ? ' ' : ''}${baslik}${tag}`;
    return `${name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim()}.pdf`;
  }

  /* ─── Dosya içeriği ───────────────────────────────────── */

  const encode = (obj) => new TextEncoder().encode(`${JSON.stringify(obj, null, 2)}\n`);

  function decode(bytes) {
    return JSON.parse(new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, ''));
  }

  return {
    BELGE_DIR,
    AYARLAR_YOLU,
    DILLER,
    KAPAKLAR,
    BOLUMLER,
    VARSAYILAN_AYARLAR,
    bugun,
    tarihYaz,
    ayarlariNormalize,
    bosBelge,
    belgeNormalize,
    etkin,
    dosyaAdi,
    seriHatasi,
    belgeYolu,
    belgeYoluMu,
    pdfDosyaAdi,
    encode,
    decode
  };
});
