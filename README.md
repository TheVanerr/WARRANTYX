# WarrantyX

Dolfin endüstriyel parça yıkama makineleri için garanti belgesi programı. Belge Türkçe, İngilizce ya da Almanca hazırlanır, tek tıkla vektörel PDF alınır. Veritabanı özel bir GitHub deposudur (`warrantyx-veri`): ücretsizdir, sunucu ve kurulum gerektirmez, her kayıt geçmişte durur. Arayüz, veritabanı ve PDF motoru P&PX ile aynı yapıdadır.

## Başlatma

Program iki yoldan açılır, ikisi de aynı `warrantyx-veri` deposuna bağlanır:

- **Yayındaki adres:** <https://thevanerr.github.io/WARRANTYX/> (Chrome veya Edge). Kurulum gerekmez, her zaman son sürüm açılır. Program yalnız `warrantyx-veri` deposuna erişimi olan bir erişim anahtarıyla açılır. Anahtar bu bilgisayarda bir kez girilir. Yerel mod ve depo seçimi yoktur.
- **Dosyadan:** `index.html` dosyasına çift tıklanır. Geliştirme ve internetsiz deneme içindir. Bu yolda yerel mod ve depo seçimi vardır.

### Yayın ve güncelleme

`main` dalına her gönderimde `.github/workflows/yayin.yml` testleri çalıştırır. Testler geçerse program 1-2 dakika içinde yayına çıkar. Test geçmezse yayın olmaz ve kullananlar önceki sürümle devam eder.

- Yeni açılan program son sürümle gelir. Her dosyanın adresinde sürüm vardır, bu yüzden tarayıcı önbellekten eski dosya getirmez.
- Açık kalan programın sağ altında "Programın yeni sürümü yayında · Yenile" çıkar. Yenilemeden önce açık belge bu bilgisayara kaydedilir.
- Açık sürüm Veritabanı sekmesinde yazar (`Program: yayındaki sürüm 1a2b3c4`).
- Siteye yalnız `index.html`, `codes/`, `ortak/` ve `assets/` gider. `_eski/`, `test/` ve `tools/` gitmez. Yerelde denemek için: `node tools/yayin-hazirla.js _site`.

Bir kez yapılacak ayar: depo **Settings → General → Change visibility → Public**, sonra **Settings → Pages → Source: GitHub Actions**. Ücretsiz hesapta Pages yalnız açık depodan yayınlanır. Kod açık olur ama belgeler açılmaz: belgeler özel `warrantyx-veri` deposunda durur ve anahtar olmadan okunamaz.

### Başka kullanıcıya anahtar verme

Her kişiye ayrı anahtar oluşturun (adı örneğin `WarrantyX - Ahmet`). Her anahtar yalnız `warrantyx-veri` deposuna, *Contents: Read and write* izniyle verilir. Biri ayrılınca GitHub → Settings → Personal access tokens altından yalnız onun anahtarı silinir, diğerleri çalışmaya devam eder. Ortak kullanılan bilgisayarda iş bitince Veritabanı sekmesinden **Bağlantıyı kaldır** denir.

### İlk kurulum (dosyadan)

İlk açılışta ekrandaki üç adımı izleyin (yaklaşık 3 dakika):

1. **Özel depo oluşturun.** Bağlantı adı (`warrantyx-veri`) ve görünürlüğü (Private) hazır getirir. Depoyu boş bırakıp "Create repository" deyin.
2. **Erişim anahtarı oluşturun.** "Repository access" altında *Only select repositories* seçip yalnız `warrantyx-veri` deposunu işaretleyin. *Contents: Read and write* izni hazır gelir. "Generate token" deyin.
3. **Anahtarı yapıştırıp Bağlan deyin.** Anahtar yalnız bu tarayıcıda saklanır.

Depo boşsa sorun değildir: program bağlanınca `README.md` yazar, ilk garanti belgesiyle birlikte `ayarlar.json` ve `belgeler/` klasörü oluşur.

GitHub'a bağlanmadan denemek için **Şimdilik yalnız bu bilgisayarda kullan** seçilir. Sonradan Veritabanı sekmesinden bağlanınca yapılanlar depoya gönderilir.

Başka bir bilgisayarda yayındaki adresi açıp anahtarı girmek yeterlidir, belgeler kendiliğinden gelir. Program klasörünü kopyalamak gerekmez.

## Kullanım

- **Yeni Garanti Belgesi:** Seri No ve makine modeli yeterlidir. Alıcı firma, teslim tarihi ve belge dili de burada seçilir. Belge no yıl içinde sırayla verilir (`GB-2026-001`).
- **Düzenleyici:** Solda bilgiler, ortada A4 önizleme, sağda bölümler. Her değişiklik kendiliğinden kaydedilir.
- **Kapak (Kırmızı Bant)** P&ID kapak stüdyosunun dilindedir: solda tam boy kırmızı bant, içinde dikey dev GARANTİ yazısı ve seri no; harf aralıklı kırmızı üst başlık, ağır büyük model adı, kırmızı çizgi, alıcı firma; gri etiketli bilgi satırları (Seri No, Teslim Tarihi, Alıcı Firma, Garanti Süresi, Cinsi) ve büyük rakamlı garanti göstergeleri (1 YIL · 2500 SAAT · 10 YIL). Model yazılmamışsa başlık "GARANTİ BELGESİ" olur, uzun model adı kendiliğinden küçülür.
- **Bölümler:** Kapak, garanti şartları, garanti belgesi (firma ve ürün bilgileri, imalatçı ve satıcı için kaşe / imza kutuları), servis kayıt sayfası. İstenmeyen bölüm kapatılır.
- **Garanti şartları** metni olduğu gibi basılır, yalnız düzen eklenir: paragraf ve maddeler 1., 2., … diye numaralanır, ":" ile biten maddenin altındaki koşullar a), b), c) olur; numaralar ayrı sütunda hizalı, metin sola yaslıdır. Sayfalara kendiliğinden bölünür; başlık ve giriş maddesi sayfa sonunda yalnız kalmaz. Son sayfaya yalnız birkaç satır taşarsa metin biraz sıkılaştırılıp tek sayfaya alınır.
- **Satıcı firma** varsayılan olarak imalatçıyla aynıdır. Farklıysa düğme kapatılıp satıcının bilgileri yazılır; boş alanlar elle doldurulacak çizgi olarak basılır.
- **Garanti süresi ve çalışma saati** belgede boş bırakılırsa Ayarlar'daki değer kullanılır. Değerler şart metnine de yazılır ("1 yıl veya 2500 (çalışma) saat").
- **Benzer belge oluştur:** Aynı model ve müşteriye giden makinede model, müşteri, teslim, garanti ve satıcı bilgileri kopyalanır.
- **Kısayollar:** Ctrl+S depoya hemen gönderir, Ctrl+P PDF penceresini açar.

## PDF

**PDF İndir** penceresinde diller ve bölümler seçilir. Birden çok dil seçilirse her dil tam belge olarak TR, EN, DE sırasıyla tek dosyada arka arkaya gelir. Dosya adı: `0626051-DÜNYA-ULT M200 3B GARANTİ BELGESİ TR-EN.pdf`.

PDF yazdırma penceresi olmadan doğrudan üretilir (P&ID motorundaki `pdf.js` / `pdf-dom.js`). Ekrandaki her kutu, çizgi ve harf ölçülüp aynı yere çizilir. Sayfalar vektördür, yazı seçilip aranabilir. Yazı tipleri gömülüdür (Calibri yerine ölçüleri aynı Carlito, Segoe UI yerine Selawik), bu yüzden belge her bilgisayarda aynı görünür. 3 dilli 13 sayfalık belge yaklaşık 120 KB'dir.

## Depodaki düzen

```
warrantyx-veri/
├── README.md               ilk bağlantıda program yazar
├── ayarlar.json            firma bilgileri, garanti varsayılanları, varsayılan kapak
└── belgeler/
    └── 0626051.json        her garanti belgesi bir dosya, dosya adı = Seri No
```

Seri No değişince dosya da yeni adla yazılır, eskisi silinir. Eski sürümler GitHub geçmişinde kalır.

## Kayıt nasıl çalışır

- Değişiklik önce bu bilgisayarın tarayıcı veritabanına (IndexedDB) yazılır, internet kesilse de kaybolmaz.
- Değişenler en geç 1 dakikada bir, sayfadan çıkarken ve sayfa açılırken tek commit olarak depoya gönderilir. **Kaydet** (Ctrl+S) beklemeden gönderir.
- Başka bilgisayarda değişen belge açıksa güncel hâli kendiliğinden gelir.
- İki bilgisayarda aynı belge değişirse yeni olan asıl dosya olur, eskisi yanında `.catisma-<tarih>` adıyla saklanır.
- **Yedek indir** tüm veriyi tek JSON dosyasına alır, **Yedekten yükle** geri yükler (var olan dosyalar korunur).

## Metni ve firma bilgisini değiştirme

- **Firma, ürün cinsi, garanti varsayılanları, onay tarihi ve sayısı, belge no öneki:** Ayarlar sekmesi.
- **Garanti şartları ve belge yazıları:** `codes/metin.js`. Şartlar sade Markdown'dır (`#` başlık, `##` ara başlık, `>` vurgulu kutu, `*` madde, `**kalın**`, `{{yer tutucu}}`). Üç dilin yapısı aynı kalmalıdır; `npm test` denetler.
- **Logo, yazı tipi:** `assets/` altındaki dosyayı değiştirip `npm run gomulu` çalıştırın. Dosyadan açılan sayfa diskteki dosyayı programla okuyamadığı için görseller ve yazı tipleri `assets/gomulu-*.js` olarak programa gömülür.

## Klasörler

| Yol | İçerik |
|---|---|
| `index.html` | Program: ilk kurulum, belgeler, ayarlar, veritabanı, düzenleyici |
| `codes/app.js` | Arayüz, kayıt, PDF akışı |
| `codes/belge.js`, `codes/belge.css` | Belge motoru: 3 kapak, antetli sayfalar, sayfalama, garanti belgesi, servis sayfası |
| `codes/metin.js` | TR, EN, DE metinler |
| `codes/kayit.js` | Belge ve ayar şeması, depo yolları, dosya adı |
| `codes/pdf.js`, `codes/pdf-dom.js` | Vektörel PDF motoru (P&ID'den; JPEG görsel ve `object-fit: cover` eki, ileride fotoğraf için) |
| `codes/tema.css` | Arayüz teması (P&PX ile aynı) |
| `ortak/` | Veritabanı (`ppx-db.js`) ve GitHub bağlantısı (`ppx-github.js`) P&PX'ten; açılış ve bağlantı (`wx-boot.js`) |
| `assets/` | Dolfin logosu, yazı tipleri (OFL lisanslı) ve gömülü kopyaları |
| `tools/gomulu-uret.js` | `assets/gomulu-*.js` üreticisi |
| `tools/yayin-hazirla.js` | Yayın sitesini hazırlar: dosyaları kopyalar, sürüm damgası ve `surum.json` yazar |
| `.github/workflows/yayin.yml` | `main` dalına gönderimde test ve GitHub Pages yayını |
| `test/` | Birim ve veritabanı testleri (sahte GitHub ile) |
| `_eski/` | Önceki garanti dosyaları; içerikleri bir dosya kaymış, eşleşme `_eski/OKU.md` içinde |
| `P&PX/` | Arayüz ve yapı için başvuru alınan P&PX programı (kendi deposu var) |

## Sınırlar

- **Erişim anahtarı** yalnız bu tarayıcıda saklanır. Dosyadan açılan programda bilgisayardaki başka bir yerel HTML dosyası da onu okuyabilir. Yayındaki programda anahtarı yalnız `thevanerr.github.io` altındaki sayfalar okuyabilir, yani sizin diğer yayındaki araçlarınız. Bu yüzden anahtar yalnız `warrantyx-veri` deposuna izinli olmalıdır. Süresi dolunca Veritabanı sekmesinden yenilenir.
- **Yayındaki kod açıktır:** Program dosyaları ve garanti şartlarının metni herkesçe görülebilir. Bu metin zaten her belgede basılıdır. Müşteri, makine ve belge bilgileri yalnız özel depodadır.
- **Özel depo zorunlu:** Herkese açık depoya bağlanılmaz, çünkü müşteri verisi içerir.
- **Yasal metin:** Türkçe metin ve onay sayısı eski garanti belgesinden olduğu gibi alındı. Metin 4077 sayılı Kanun'a ve Sanayi ve Ticaret Bakanlığı'na atıf yapıyor; bu kanun 2014'te 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile değişti. Güncellenmesi gerekiyorsa `codes/metin.js` içinde değiştirilir.

## Test

```
npm test
```

Kayıt modeli, üç dilin metin yapısı, boş `warrantyx-veri` deposuna ilk yazma, iki bilgisayar arası eşitleme, PDF'e JPEG gömme ve yayın sitesinin hazırlanması (sürüm damgası, her dosyanın sitede olması) denenir.
