/* GitHub Pages yayını için site klasörünü hazırlar. .github/workflows/yayin.yml her gönderimde çalıştırır.
   Yalnız programın dosyaları kopyalanır ve sürüm damgası basılır:
   - index.html'deki <meta name="wx-surum"> yayın sürümünü (commit) taşır. Program yayında olduğunu buradan anlar:
     anahtar ister, yerel mod ve depo seçimi yoktur. Dosyadan açılan kopyada damga boştur.
   - Her script ve stil adresine ?v=<içerik özeti> eklenir. Değişen dosyanın adresi değişir, tarayıcı eskisini
     önbellekten getirmez; değişmeyen dosya (ör. 1,9 MB yazı tipi) her yayında yeniden inmez.
   - sw.js'e sürüm ve çevrimdışı için saklanacak dosyaların listesi yazılır.
   - surum.json açık kalan programın yeni sürümü fark etmesi içindir.
   Yerelde denemek için:  node tools/yayin-hazirla.js _site  */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const PROGRAM = ['index.html', 'manifest.webmanifest', 'sw.js', 'codes', 'ortak', 'assets'];
/** Program bunları sonradan yükler; index.html'de adresleri yoktur, özetleri damgadan okunur */
const SONRADAN = ['assets/gomulu-yazitipi.js'];
const BOS_DAMGA = '<meta name="wx-surum" content="">';
const SW_SURUM = /^const SURUM = 'yerel';\r?$/m;
const SW_DOSYALAR = /^const DOSYALAR = \['\.\/'\];\r?$/m;

function gitSurum() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'yerel';
  }
}

const ozet = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10);

/** index.html'deki yerel adresler: script ve stiller sürümlenir, gerisi (görsel, manifest) olduğu gibi kalır */
function damgala(html, surum, tarih, ozetFn) {
  if (!html.includes(BOS_DAMGA)) throw new Error(`index.html içinde ${BOS_DAMGA} bulunamadı`);
  const surumlu = [];
  const sabit = [];
  const sonradan = Object.fromEntries(SONRADAN.map((f) => [f, ozetFn(f)]));
  const out = html
    .replace(BOS_DAMGA, `<meta name="wx-surum" content="${surum}" data-tarih="${tarih}" data-dosyalar='${JSON.stringify(sonradan)}'>`)
    .replace(/(src|href)="(?!https?:|data:|#|mailto:)([^"?#]+)"/g, (m, attr, url) => {
      if (!/\.(js|css)$/.test(url)) {
        sabit.push(url);
        return m;
      }
      const v = `${url}?v=${ozetFn(url)}`;
      surumlu.push(v);
      return `${attr}="${v}"`;
    });
  for (const [f, v] of Object.entries(sonradan)) surumlu.push(`${f}?v=${v}`);
  return { html: out, surumlu, sabit };
}

function hazirla(out, options = {}) {
  const hedef = path.resolve(out);
  // Hedef proje klasörü ya da üstü olursa silme programı götürür
  const rel = path.relative(hedef, ROOT);
  if (!rel || (!rel.startsWith('..') && !path.isAbsolute(rel))) throw new Error(`Hedef klasör proje klasörünü içeriyor: ${hedef}`);
  const surum = options.surum || gitSurum();
  const tarih = options.tarih || new Date().toISOString();

  fs.rmSync(hedef, { recursive: true, force: true });
  for (const p of PROGRAM) fs.cpSync(path.join(ROOT, p), path.join(hedef, p), { recursive: true });
  const ozetFn = (url) => {
    const file = path.join(hedef, url);
    if (!fs.existsSync(file)) throw new Error(`${url} index.html'de geçiyor ama dosyası yok`);
    return ozet(file);
  };

  const indexYolu = path.join(hedef, 'index.html');
  const { html, surumlu, sabit } = damgala(fs.readFileSync(indexYolu, 'utf8'), surum, tarih, ozetFn);
  fs.writeFileSync(indexYolu, html);

  // Kurulan uygulama çevrimdışı da açılsın: sayfa, manifest ve simgeleri, tüm sürümlü dosyalar
  const manifest = JSON.parse(fs.readFileSync(path.join(hedef, 'manifest.webmanifest'), 'utf8'));
  const dosyalar = [...new Set(['./', ...sabit, ...manifest.icons.map((i) => i.src), ...surumlu])];
  for (const d of dosyalar) {
    if (d !== './' && !fs.existsSync(path.join(hedef, d.split('?')[0]))) throw new Error(`${d} sitede yok`);
  }
  const swYolu = path.join(hedef, 'sw.js');
  const sw = fs.readFileSync(swYolu, 'utf8');
  if (!SW_SURUM.test(sw) || !SW_DOSYALAR.test(sw)) throw new Error('sw.js içinde SURUM ya da DOSYALAR satırı bulunamadı');
  fs.writeFileSync(swYolu, sw
    .replace(SW_SURUM, `const SURUM = ${JSON.stringify(surum)};`)
    .replace(SW_DOSYALAR, `const DOSYALAR = ${JSON.stringify(dosyalar)};`));

  fs.writeFileSync(path.join(hedef, 'surum.json'), `${JSON.stringify({ surum, tarih })}\n`);
  return { hedef, surum, tarih, surumlu, dosyalar };
}

module.exports = { hazirla, damgala, PROGRAM, SONRADAN };

if (require.main === module) {
  const r = hazirla(process.argv[2] || path.join(ROOT, '_site'));
  console.log(`Site hazır: ${r.hedef} · sürüm ${r.surum} · ${r.surumlu.length} sürümlü dosya · çevrimdışı için ${r.dosyalar.length} dosya`);
}
