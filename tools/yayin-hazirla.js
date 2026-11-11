/* GitHub Pages yayını için site klasörünü hazırlar. .github/workflows/yayin.yml her gönderimde çalıştırır.
   Yalnız programın dosyaları kopyalanır (index.html, codes, ortak, assets) ve sürüm damgası basılır:
   - index.html'deki <meta name="wx-surum"> sürümü taşır. Program yayında olduğunu buradan anlar:
     anahtar ister, yerel mod ve depo seçimi yoktur. Dosyadan açılan kopyada damga boştur.
   - Her script ve stil adresine ?v=<sürüm> eklenir; tarayıcı yeni sürümde eski dosyayı önbellekten getirmez.
   - surum.json açık kalan programın yeni sürümü fark etmesi içindir.
   Yerelde denemek için:  node tools/yayin-hazirla.js _site  */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const PROGRAM = ['index.html', 'codes', 'ortak', 'assets'];
const BOS_DAMGA = '<meta name="wx-surum" content="">';

function gitSurum() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'yerel';
  }
}

/** Damgalı index.html; adresi eklenen dosyalar da döner */
function damgala(html, surum, tarih) {
  if (!html.includes(BOS_DAMGA)) throw new Error(`index.html içinde ${BOS_DAMGA} bulunamadı`);
  const dosyalar = [];
  const out = html
    .replace(BOS_DAMGA, `<meta name="wx-surum" content="${surum}" data-tarih="${tarih}">`)
    .replace(/(src|href)="((?:codes|ortak|assets)\/[^"?#]+\.(?:js|css))"/g, (m, attr, url) => {
      dosyalar.push(url);
      return `${attr}="${url}?v=${surum}"`;
    });
  return { html: out, dosyalar };
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

  const indexYolu = path.join(hedef, 'index.html');
  const { html, dosyalar } = damgala(fs.readFileSync(indexYolu, 'utf8'), surum, tarih);
  fs.writeFileSync(indexYolu, html);
  fs.writeFileSync(path.join(hedef, 'surum.json'), `${JSON.stringify({ surum, tarih })}\n`);
  return { hedef, surum, tarih, dosyalar };
}

module.exports = { hazirla, damgala, PROGRAM };

if (require.main === module) {
  const r = hazirla(process.argv[2] || path.join(ROOT, '_site'));
  console.log(`Site hazır: ${r.hedef} · sürüm ${r.surum} · ${r.dosyalar.length} dosya adresi damgalandı`);
}
