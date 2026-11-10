/* Dosyadan (çift tıkla) açılan sayfa diskteki dosyayı programla okuyamaz; tarayıcı fotoğrafı da PDF için
   piksel olarak okutmaz. Bu yüzden belgede kullanılan görseller ve PDF'e gömülen yazı tipleri script dosyası
   olarak gelir. Logo, fotoğraf ya da yazı tipi değişince çalıştırın:  npm run gomulu */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const FONTS = ['Carlito-Regular.ttf', 'Carlito-Bold.ttf', 'selawk.ttf', 'selawksb.ttf', 'selawkb.ttf'];
const IMAGES = {
  logo: ['logos/dolfin.png', 'image/png']
};

const b64 = (rel) => fs.readFileSync(path.join(ASSETS, rel)).toString('base64');
const header = (what) => `/* Üretilmiş dosya: elle değiştirmeyin. Kaynak: assets/${what}. Yeniden üretmek için: npm run gomulu */\n`;

function write(name, body) {
  const file = path.join(ASSETS, name);
  fs.writeFileSync(file, body);
  console.log(`${name}: ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}

write('gomulu-gorsel.js', `${header('logos')}window.WX_GORSEL = {\n${Object.entries(IMAGES)
  .map(([key, [rel, mime]]) => `  ${key}: 'data:${mime};base64,${b64(rel)}'`).join(',\n')}\n};\n`);

write('gomulu-yazitipi.js', `${header('fonts')}window.WX_YAZITIPI = {\n${FONTS
  .map((f) => `  '${f}': '${b64(`fonts/${f}`)}'`).join(',\n')}\n};\n`);
