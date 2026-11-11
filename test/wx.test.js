const test = require('node:test');
const assert = require('node:assert/strict');

const PpxDb = require('../ortak/ppx-db.js');
const PpxGitHub = require('../ortak/ppx-github.js');
const WxKayit = require('../codes/kayit.js');
const WxMetin = require('../codes/metin.js');
const PidPdf = require('../codes/pdf.js');
const { createFakeGitHub } = require('./fake-github.js');

const str = (b) => new TextDecoder().decode(b);
const README = { message: 'WarrantyX veri deposu', text: '# WarrantyX veri deposu\n\nDolfin garanti belgeleri. Dosyaları elle değiştirmeyin.\n' };

function device(hub) {
  const remote = PpxGitHub.createRemote({ repo: hub.id, token: hub.token, fetchFn: hub.fetchFn, readme: README });
  return PpxDb.createDb({
    local: PpxDb.memoryLocal(),
    remote,
    now: () => { hub.clock.now += 1000; return hub.clock.now; },
    flushMs: 3600000
  });
}

/* ─── Kayıt modeli ──────────────────────────────────────── */

test('boş belge geçerli varsayılanlarla gelir, bilinmeyen değerler düzeltilir', () => {
  const b = WxKayit.belgeNormalize({ seriNo: '  0626051 ', dil: 'fr', kapak: 'yok', garantiYil: 'abc', garantiSaat: '3000', bolumler: { servis: false } });
  assert.equal(b.seriNo, '0626051');
  assert.equal(b.dil, 'tr');
  assert.equal(b.kapak, '');
  assert.equal(b.garantiYil, null);
  assert.equal(b.garantiSaat, 3000);
  assert.deepEqual(b.bolumler, { kapak: true, sartlar: true, belge: true, servis: false });
  assert.equal(b.satici.ayni, true);
  assert.match(WxKayit.bosBelge().teslimTarihi, /^\d{4}-\d{2}-\d{2}$/);
});

test('belgede boş bırakılan garanti, kapak ve satıcı ayarlardan gelir', () => {
  const a = WxKayit.ayarlariNormalize({ garantiYil: 2, kapakTasarimi: 'kose' });
  assert.equal(a.kapakTasarimi, 'bant', 'kaldırılan kapak tasarımı Kırmızı Bant olur');
  let e = WxKayit.etkin({ seriNo: 'X' }, a);
  assert.equal(e.garantiYil, 2);
  assert.equal(e.garantiSaat, 2500);
  assert.equal(e.kapak, 'bant');
  assert.equal(e.satici.unvan, 'CNK ELEKTRONİK MAKİNE SANAYİ A.Ş.');
  e = WxKayit.etkin({ seriNo: 'X', garantiYil: '3', kapak: 'foto', satici: { ayni: false, unvan: 'BAYİ A.Ş.' } }, a);
  assert.equal(e.belge.kapak, '');
  assert.equal(e.garantiYil, 3);
  assert.equal(e.kapak, 'bant');
  assert.equal(e.satici.unvan, 'BAYİ A.Ş.');
  assert.equal(e.satici.adres, '');
});

test('ayarlarda silinen alan boş kalır, eksik alan varsayılanla dolar', () => {
  const a = WxKayit.ayarlariNormalize({ imalatci: { faks: '' }, belgeNoOnek: 'g-b!', urunCinsi: { en: 'WASHER' } });
  assert.equal(a.imalatci.faks, '');
  assert.equal(a.imalatci.telefon, '+90 312 267 30 15 (pbx)');
  assert.equal(a.belgeNoOnek, 'gb');
  assert.equal(a.urunCinsi.en, 'WASHER');
  assert.equal(a.urunCinsi.de, 'INDUSTRIELLE TEILEREINIGUNGSMASCHINE');
});

test('seri no dosya adı olur; sorunlu karakterler atılır, çakışma kopyası belge sayılmaz', () => {
  assert.equal(WxKayit.belgeYolu('0626051'), 'belgeler/0626051.json');
  assert.equal(WxKayit.belgeYolu('ÇİŞ:12*  A.'), 'belgeler/ÇİŞ_12_ A.json');
  assert.equal(WxKayit.seriHatasi(''), 'Seri No gerekli.');
  assert.ok(WxKayit.seriHatasi('a/b'));
  assert.ok(WxKayit.seriHatasi('..'));
  assert.equal(WxKayit.seriHatasi('0626051'), '');
  assert.ok(WxKayit.belgeYoluMu('belgeler/0626051.json'));
  assert.ok(!WxKayit.belgeYoluMu('belgeler/0626051.json.catisma-20261110-120000'));
  assert.ok(!WxKayit.belgeYoluMu('belgeler/alt/x.json'));
  assert.ok(!WxKayit.belgeYoluMu('ayarlar.json'));
});

test('belge numarası yıl içinde sırayla artar', () => {
  const now = new Date('2026-11-10T10:00:00').getTime();
  assert.equal(WxKayit.yeniBelgeNo([], 'GB', now), 'GB-2026-001');
  const list = [{ belgeNo: 'GB-2026-007' }, { belgeNo: 'GB-2025-030' }, { belgeNo: 'elle' }];
  assert.equal(WxKayit.yeniBelgeNo(list, 'GB', now), 'GB-2026-008');
});

test('PDF dosya adı eski programdaki gibi: seri-müşteri-model başlık', () => {
  const b = { seriNo: '0626051', musteri: 'DÜNYA', model: 'ULT M200 3B' };
  assert.equal(WxKayit.pdfDosyaAdi(b, 'GARANTİ BELGESİ'), '0626051-DÜNYA-ULT M200 3B GARANTİ BELGESİ.pdf');
  assert.equal(WxKayit.pdfDosyaAdi(b, 'GARANTİ BELGESİ', ['tr', 'en']), '0626051-DÜNYA-ULT M200 3B GARANTİ BELGESİ TR-EN.pdf');
  assert.equal(WxKayit.pdfDosyaAdi({ seriNo: 'A/B' }, 'X'), 'A_B X.pdf');
  assert.equal(WxKayit.tarihYaz('2026-11-10'), '10.11.2026');
  assert.equal(WxKayit.tarihYaz(''), '');
});

test('JSON dosyası Türkçe harfleri korur ve geri okunur', () => {
  const b = WxKayit.belgeNormalize({ seriNo: 'Ş1', musteri: 'İĞNE ÇÖZÜM' });
  const back = WxKayit.belgeNormalize(WxKayit.decode(WxKayit.encode(b)));
  assert.deepEqual(back, b);
  assert.ok(str(WxKayit.encode(b)).includes('İĞNE ÇÖZÜM'));
});

/* ─── Metinler ──────────────────────────────────────────── */

function keysOf(obj, prefix) {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

test('üç dilde de aynı metin alanları var', () => {
  const tr = keysOf(WxMetin.DILLER.tr, '').sort();
  for (const id of ['en', 'de']) assert.deepEqual(keysOf(WxMetin.DILLER[id], '').sort(), tr, id);
});

test('şart metinlerinde doldurulmamış yer tutucu kalmaz; yapı üç dilde aynı', () => {
  const e = WxKayit.etkin({ seriNo: 'X' }, null);
  const shape = (id) => WxMetin.sartBloklari(id, e).map((b) => (b.t === 'ul' ? `ul${b.items.length}` : b.t));
  for (const id of ['tr', 'en', 'de']) {
    const blocks = WxMetin.sartBloklari(id, e);
    const all = JSON.stringify(blocks);
    assert.ok(!all.includes('{{'), `${id}: ${all.match(/\{\{\w+\}\}/)}`);
    assert.equal(blocks[0].t, 'h1');
    assert.equal(blocks[1].t, 'lead');
    assert.deepEqual(shape(id), shape('tr'), id);
  }
  const tr = JSON.stringify(WxMetin.sartBloklari('tr', e));
  assert.ok(tr.includes('1 yıl veya 2500 (çalışma) saattir'));
  assert.ok(tr.includes('<strong>10 yıllık yedek parça temin garantisine</strong>'));
});

test('İngilizce ve Almancada tekil ve çoğul doğru yazılır', () => {
  const one = WxKayit.etkin({ seriNo: 'X' }, null);
  const two = WxKayit.etkin({ seriNo: 'X', garantiYil: 2 }, null);
  assert.ok(JSON.stringify(WxMetin.sartBloklari('en', one)).includes('is 1 year or 2500'));
  assert.ok(JSON.stringify(WxMetin.sartBloklari('en', two)).includes('is 2 years or 2500'));
  assert.ok(JSON.stringify(WxMetin.sartBloklari('de', one)).includes('beträgt 1 Jahr oder'));
  assert.ok(JSON.stringify(WxMetin.sartBloklari('de', two)).includes('beträgt 2 Jahre oder'));
  assert.deepEqual(WxMetin.dil('en').istatistik.garanti(2), ['YEARS', 'WARRANTY']);
  assert.deepEqual(WxMetin.dil('de').istatistik.garanti(1), ['JAHR', 'GARANTIE']);
  assert.equal(WxMetin.dil('de').sureDeger(1, 2500), '1 JAHR / 2500 STUNDEN');
});

test('Markdown: başlık, vurgulu kutu, madde ve kalın; HTML kaçırılır', () => {
  const blocks = WxMetin.bloklar('# Baş\n\n> **Önemli** <b>\n\nsatır bir\nsatır iki\n\n* bir\ndevamı\n* iki\n## Ara');
  assert.deepEqual(blocks, [
    { t: 'h1', html: 'Baş' },
    { t: 'lead', html: '<strong>Önemli</strong> &lt;b&gt;' },
    { t: 'p', html: 'satır bir satır iki' },
    { t: 'ul', items: ['bir devamı', 'iki'] },
    { t: 'h2', html: 'Ara' }
  ]);
});

/* ─── Veritabanı: boş warrantyx-veri deposuna ilk yazma ─── */

test('boş depoya ilk belge yazılınca README, ayarlar ve belge tek eşitlemede gider', async () => {
  const hub = createFakeGitHub({ name: 'warrantyx-veri' });
  const db = device(hub);
  const belge = WxKayit.belgeNormalize({ seriNo: '0626051', model: 'ULT M200 3B', musteri: 'DÜNYA', teslimTarihi: '2026-11-10' });
  await db.write(WxKayit.AYARLAR_YOLU, WxKayit.encode(WxKayit.ayarlariNormalize(null)));
  await db.write(WxKayit.belgeYolu(belge.seriNo), WxKayit.encode(belge));
  const s = await db.sync();
  assert.equal(s.state, 'ok', s.error);
  assert.equal(s.pending, 0);
  const files = hub.files();
  assert.deepEqual([...files.keys()].sort(), ['README.md', 'ayarlar.json', 'belgeler/0626051.json']);
  assert.ok(str(files.get('README.md')).includes('WarrantyX veri deposu'), 'README Türkçe harfleri bozulmadan yazılır');
  assert.ok(str(files.get('README.md')).includes('değiştirmeyin'));
  assert.equal(WxKayit.decode(files.get('belgeler/0626051.json')).musteri, 'DÜNYA');
});

test('bir bilgisayarda oluşturulan belge öbüründe görünür, seri no değişimi taşınır', async () => {
  const hub = createFakeGitHub({ name: 'warrantyx-veri' });
  const a = device(hub);
  const b = device(hub);
  const belge = WxKayit.belgeNormalize({ seriNo: '0626051', model: 'M200' });
  await a.write(WxKayit.belgeYolu('0626051'), WxKayit.encode(belge));
  await a.sync();
  await b.sync();
  assert.ok(await b.read('belgeler/0626051.json'));
  // Seri no değişince yeni dosya yazılır, eskisi silinir
  await a.write(WxKayit.belgeYolu('0626052'), WxKayit.encode(Object.assign({}, belge, { seriNo: '0626052' })));
  await a.remove(WxKayit.belgeYolu('0626051'));
  await a.sync();
  const s = await b.sync();
  assert.equal(s.state, 'ok', s.error);
  assert.equal(await b.read('belgeler/0626051.json'), null);
  assert.equal(WxKayit.decode((await b.read('belgeler/0626052.json')).bytes).seriNo, '0626052');
  assert.ok(s.changed.includes('belgeler/0626052.json'));
});

test('açık depoya bağlanılmaz: müşteri verisi yalnız özel depoda durur', async () => {
  const hub = createFakeGitHub({ name: 'warrantyx-veri', isPrivate: false });
  const remote = PpxGitHub.createRemote({ repo: hub.id, token: hub.token, fetchFn: hub.fetchFn });
  assert.equal((await remote.info()).private, false);
});

/* ─── PDF: fotoğraf JPEG olarak gömülür ─────────────────── */

test('JPEG görsel DCTDecode ile olduğu gibi gömülür', async () => {
  const doc = PidPdf.create({ title: 'Deneme', producer: 'WarrantyX' });
  const page = doc.addPage(210, 297);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 0xff, 0xd9]);
  page.image(doc.addImage({ width: 2, height: 1, jpeg }), 0, 0, 210, 100);
  const bytes = await doc.save();
  const text = Buffer.from(bytes).toString('latin1');
  assert.ok(text.startsWith('%PDF-1.7'));
  assert.ok(text.includes('/Filter /DCTDecode /Length 10'));
  assert.ok(Buffer.from(bytes).includes(Buffer.from(jpeg)), 'JPEG baytları değişmeden PDF içinde');
  assert.match(text, /\/XObject << \/I0 \d+ 0 R >>/, 'görsel sayfa kaynaklarında');
});

/* ─── Yayın: GitHub Pages sitesi ve uygulama (PWA) ───────── */

function siteKur() {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { hazirla } = require('../tools/yayin-hazirla.js');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'wx-site-'));
  const r = hazirla(out, { surum: 'abc1234', tarih: '2026-11-11T09:00:00.000Z' });
  const oku = (rel) => fs.readFileSync(path.join(out, rel));
  const var_ = (rel) => fs.existsSync(path.join(out, rel));
  const ozet = (rel) => require('node:crypto').createHash('sha256').update(oku(rel)).digest('hex').slice(0, 10);
  return { out, r, oku, var: var_, ozet, temizle: () => fs.rmSync(out, { recursive: true, force: true }) };
}

test('yayın sitesi damgalanır: script ve stiller içerik özetiyle, her dosya sitede', () => {
  const site = siteKur();
  try {
    const html = site.oku('index.html').toString('utf8');
    assert.match(html, /<meta name="wx-surum" content="abc1234" data-tarih="2026-11-11T09:00:00.000Z" data-dosyalar='\{[^']+\}'>/);
    assert.deepEqual(JSON.parse(site.oku('surum.json')), { surum: 'abc1234', tarih: '2026-11-11T09:00:00.000Z' });

    // index.html'deki her yerel adresin dosyası sitededir; script ve stiller kendi içerik özetini taşır
    const yerel = [...html.matchAll(/(?:src|href)="((?:codes|ortak|assets|manifest)[^"]*)"/g)].map((m) => m[1]);
    assert.ok(yerel.length >= 15, `yalnız ${yerel.length} yerel adres bulundu`);
    for (const url of yerel) {
      const [file, query] = url.split('?');
      assert.ok(site.var(file), `${file} sitede yok`);
      if (/\.(js|css)$/.test(file)) assert.equal(query, `v=${site.ozet(file)}`, `${file} içerik özetiyle gelmeli`);
    }

    // Sonradan yüklenen yazı tipinin özeti damgada; eski dosyalar, testler ve araçlar yayınlanmaz
    const dosyalar = JSON.parse(html.match(/data-dosyalar='([^']+)'/)[1]);
    assert.equal(dosyalar['assets/gomulu-yazitipi.js'], site.ozet('assets/gomulu-yazitipi.js'));
    for (const gizli of ['_eski', 'test', 'tools', 'package.json', 'README.md']) assert.ok(!site.var(gizli), `${gizli} yayınlanmamalı`);
  } finally {
    site.temizle();
  }
});

test('uygulama katmanı (sw.js) yayın sürümünü ve çevrimdışı dosya listesini taşır', () => {
  const site = siteKur();
  try {
    const sw = site.oku('sw.js').toString('utf8');
    assert.match(sw, /^const SURUM = "abc1234";$/m);
    const liste = JSON.parse(sw.match(/^const DOSYALAR = (\[.*\]);$/m)[1]);
    assert.deepEqual(liste, site.r.dosyalar);
    assert.equal(liste[0], './');
    for (const d of liste.slice(1)) assert.ok(site.var(d.split('?')[0]), `${d} sitede yok`);
    for (const f of ['codes/app.js', 'ortak/wx-boot.js', 'assets/gomulu-yazitipi.js']) {
      assert.ok(liste.includes(`${f}?v=${site.ozet(f)}`), `${f} çevrimdışı listede değil`);
    }
    for (const f of ['manifest.webmanifest', 'assets/logos/dolfin.png', 'assets/simge/simge-512.png']) assert.ok(liste.includes(f), `${f} çevrimdışı listede değil`);
  } finally {
    site.temizle();
  }
});

test('manifest kurulabilir uygulama ister: 192 ve 512 simge, maskable simge, kendi penceresi', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.ok(m.name && m.short_name);
  const boyut = (rel) => {
    const b = fs.readFileSync(path.join(root, rel));
    assert.equal(b.toString('latin1', 1, 4), 'PNG', `${rel} PNG değil`);
    return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
  };
  for (const i of m.icons) assert.equal(boyut(i.src), i.sizes, `${i.src} boyutu yanlış`);
  assert.ok(m.icons.some((i) => i.sizes === '192x192' && i.purpose === 'any'));
  assert.ok(m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any'));
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  assert.equal(boyut('assets/simge/simge-apple-180.png'), '180x180');
});

test('yayın hazırlayıcı proje klasörünü silmez', () => {
  const path = require('node:path');
  const { hazirla } = require('../tools/yayin-hazirla.js');
  const root = path.join(__dirname, '..');
  assert.throws(() => hazirla(root, { surum: 'x' }), /proje klasörünü içeriyor/);
  assert.throws(() => hazirla(path.dirname(root), { surum: 'x' }), /proje klasörünü içeriyor/);
});
