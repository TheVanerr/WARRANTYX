# WarrantyX

Dolfin endüstriyel parça yıkama makineleri için garanti belgesi ve CE uygunluk beyanı programı. Garanti belgesi ve CE belgesi Türkçe, İngilizce ya da Almanca hazırlanır, tek tıkla vektörel PDF alınır. Veritabanı özel bir GitHub deposudur (`warrantyx-veri`): ücretsizdir, sunucu ve kurulum gerektirmez, her kayıt geçmişte durur.

## Başlatma

Program iki yoldan açılır, ikisi de aynı `warrantyx-veri` deposuna bağlanır:

- **Yayındaki adres:** <https://thevanerr.github.io/WARRANTYX/> (Chrome veya Edge). Kurulum gerekmez, her zaman son sürüm açılır. Uygulama olarak da yüklenebilir (aşağıda). Program yalnız `warrantyx-veri` deposuna erişimi olan bir erişim anahtarıyla açılır. Anahtar bu bilgisayarda bir kez girilir. Yerel mod ve depo seçimi yoktur.
- **Dosyadan:** `index.html` dosyasına çift tıklanır. Geliştirme ve internetsiz deneme içindir. Bu yolda yerel mod ve depo seçimi vardır.

### Uygulama olarak yükleme

Yayındaki program bir web uygulamasıdır (PWA). Yüklenince masaüstünde ve başlat menüsünde kendi simgesiyle durur, adres çubuğu olmayan kendi penceresinde açılır. Bağlantıyı bilen herkes yükleyebilir. Belgeleri görmek için yine anahtar gerekir.

- **Chrome / Edge (Windows):** Ana ekrandaki **Uygulama olarak yükle** düğmesi ya da adres çubuğunun sağındaki yükle simgesi. Görev çubuğundaki simgeye sağ tıklayınca **Yeni Garanti Belgesi** kısayolu çıkar.
- **Android (Chrome):** Menü (⋮) → **Uygulamayı yükle** ya da **Ana ekrana ekle**.
- **iPhone / iPad (Safari):** Paylaş → **Ana Ekrana Ekle**. iPhone'da ana ekrandaki uygulamanın saklama alanı Safari'den ayrıdır, anahtar uygulamada bir kez daha girilir.

Windows ve Android'de yüklenen uygulama tarayıcıyla aynı saklama alanını kullanır, anahtar yeniden sorulmaz. Arayüz bilgisayar ekranı için tasarlandı; telefonda açılır ama düzenleyici dar ekranda sıkışık durur.

### Yayın ve güncelleme

`main` dalına her gönderimde `.github/workflows/yayin.yml` testleri çalıştırır. Testler geçerse program 1-2 dakika içinde yayına çıkar. Test geçmezse yayın olmaz ve kullananlar önceki sürümle devam eder.

- **Açılış ve yenileme:** Uygulama her açılışta ve yenilemede (F5) önce sunucuya sorar, yeni sürüm yayındaysa o açılır. Ayrıca bir şey yapmak gerekmez.
- **İnternet yokken:** Son açılan sürüm açılır, sunucu 4 saniyede yanıt vermezse de öyle olur. PDF de alınır. Belgeler zaten bu bilgisayarda saklıdır, internet gelince depoya gönderilir.
- **Açık kalan program:** Sağ altta "Programın yeni sürümü yayında · Yenile" çıkar. Yenilemeden önce açık belge bu bilgisayara kaydedilir.
- **Gereksiz indirme yok:** Her script ve stilin adresinde içeriğinin özeti vardır (`app.js?v=3f9c…`). Değişen dosya yeni adresle iner, değişmeyen dosya inmez; 1,9 MB'lık yazı tipi dosyası yalnız değişince iner.
- Açık sürüm Veritabanı sekmesinde yazar (`Program: yayındaki sürüm 1a2b3c4`).
- **Siteye gidenler:** Yalnız `index.html`, `manifest.webmanifest`, `sw.js`, `codes/`, `ortak/` ve `assets/`. `_eski/`, `test/` ve `tools/` gitmez. Yerelde denemek için: `node tools/yayin-hazirla.js _site`.

`sw.js` uygulama katmanıdır (service worker): açılışı ve çevrimdışı çalışmayı yönetir. Yalnız yayında kaydedilir. GitHub API'sine giden isteklere, yani belgelere, hiç karışmaz.

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

- **Yeni Garanti Belgesi:** Seri No ve makine modeli yeterlidir. Alıcı firma, teslim tarihi ve belge dili de burada seçilir. Belgeyi Seri No tanımlar, ayrıca belge numarası yoktur.
- **Düzenleyici:** Solda bilgiler, ortada A4 önizleme, sağda bölümler. Her değişiklik kendiliğinden kaydedilir.
- **Kapak (Kırmızı Bant)** P&ID kapak stüdyosunun dilindedir: solda tam boy kırmızı bant, içinde dikey dev GARANTİ yazısı ve seri no; harf aralıklı kırmızı üst başlık, ağır büyük model adı, kırmızı çizgi, alıcı firma; gri etiketli bilgi satırları (Seri No, Teslim Tarihi, Alıcı Firma, Garanti Süresi, Cinsi) ve büyük rakamlı garanti göstergeleri (13 AY ya da 2 YIL · 2500 SAAT · 10 YIL). Model yazılmamışsa başlık "GARANTİ BELGESİ" olur, uzun model adı kendiliğinden küçülür.
- **Bölümler:** Kapak, garanti şartları, garanti belgesi (ürün, imalatçı ve satıcı bilgileri). İstenmeyen bölüm kapatılır. Belge sade tutuldu: kaşe / imza kutuları ve servis kayıt sayfası yoktur.
- **Garanti şartları** metni olduğu gibi basılır, yalnız düzen eklenir: paragraf ve maddeler 1., 2., … diye numaralanır, ":" ile biten maddenin altındaki koşullar a), b), c) olur; numaralar ayrı sütunda hizalı, metin sola yaslıdır. Sayfalara kendiliğinden bölünür; başlık ve giriş maddesi sayfa sonunda yalnız kalmaz. Son sayfaya yalnız birkaç satır taşarsa metin biraz sıkılaştırılıp tek sayfaya alınır.
- **Satıcı firma** varsayılan olarak imalatçıyla aynıdır (e-posta: dolfin@dolfintr.com, Ayarlar sekmesinde değişir). Farklıysa düğme kapatılıp satıcının bilgileri yazılır; boş alanlar elle doldurulacak çizgi olarak basılır.
- **Garanti süresi** sol menüde seçilir: **13 Ay** (varsayılan) ya da **2 Yıl**. Kapakta ve garanti belgesinde seçilen süre yazar ("13 AY / 2500 SAAT", "2 YIL / 2500 SAAT"). Şartlardaki cümle 13 ayda "… 1 yıl veya 2500 (çalışma) saattir", 2 yılda "… 2 yıl veya 2500 (çalışma) saattir" olur. Çalışma saati (2500) Ayarlar sekmesinde durur.
- **Fatura tarihi ve teslim yeri** garanti belgesinde yazmaz (eski belgelerde de yoktu). Eski kayıtlarda yazılı olanlar belge açılınca atılır; GitHub geçmişinde kalır.
- **Benzer belge oluştur:** Aynı model ve müşteriye giden makinede model, müşteri, teslim tarihi ve satıcı bilgileri kopyalanır.
- **Aynı makinenin CE belgesi:** Garanti belgesinin sağ panelinden açılır; yoksa seri no, model ve müşteri dolu olarak oluşturulur. CE belgesinden garanti belgesine de aynı yoldan geçilir.
- **Kısayollar:** Ctrl+S depoya hemen gönderir, Ctrl+P PDF penceresini açar.

## CE belgesi

**CE Belgesi** sekmesi AT / EC / EG uygunluk beyanlarını tutar (TR: *AT Uygunluk Beyanı*, EN: *EC Declaration of Conformity*, DE: *EG-Konformitätserklärung*). Düzenleyici garanti belgesindekiyle aynıdır: solda bilgiler, ortada A4 önizleme, sağda imza ve belge işlemleri.

- **Belgenin düzeni taranmış CE belgesinin aynısıdır.** Her satır taramadan ölçülen yerine oturur (mm, taban çizgisi); başlıklar, ürün tablosu, kriterler, beş standart ve açıklamaları, CE işareti, beyan, imza satırı ve alt bilgi aynı yerde, aynı satır sonlarıyla basılır. Metinler harfi harfine alındı (`codes/metin.js`, `CE_EN` ve `CE_DE`); satır sonları da orada, dizinin her öğesi bir satırdır.
- **TR belgesinin taraması yoktur:** metin EN belgesinden çevrildi (`CE_TR`) ve EN belgesinin düzenine oturur. Her bölüm EN ile aynı satır sayısındadır, hiçbir satır EN'in en uzun satırını geçmez; bu yüzden satırlar EN belgesindeki yerlerine basılır. Kriter ve standart numaraları EN'deki gibi kalır (2006/42/EC, EN 60204-1:2018 …).
- **Sol menü:** Seri No, Makine Modeli, İmal Yılı, Düzenleme Tarihi (Issue Date / Ausstellungsdatum), Alıcı Firma (belgede yazmaz, listede ve PDF dosya adında kullanılır), Marka, LVD ve risk değerlendirme rapor numaraları. Ürün bilgileri taranmış belgedeki değerlerle gelir (LYM 1350 NS, Dolfin®, LVD- 62024041.001, RA62024041001). Seri no ve tarih şablonda boştur, belgeye yazılır.
- **Ürün adı** her CE belgesinde aynıdır, sol menüde yoktur: *Endüstriyel Parça Yıkama Makinesi* (TR), *Industrial Parts Washing Machine* (EN), *Industrie-Teilereinigungsmaschine* (DE). Tüm makineler endüstriyel parça yıkama makinesidir; ad `codes/metin.js` içinde (`urun`) değişir.
- **Yazı tipleri:** Orijinaldeki Aptos yerine ölçüleri aynı Selawik (Segoe UI), Cambria yerine ölçüleri aynı Caladea, Bahnschrift (DIN) yerine Barlow Semi Condensed. Üçü de açık lisanslıdır (OFL) ve PDF'e gömülür. Microsoft'un yazı tipleri depoya konamaz: depo herkese açıktır.
- **İmza:** Her yeni CE belgesine imzalardan biri rastgele gelir; **bir önceki CE belgesindeki imza gelmez** (bir önceki: en son oluşturulan CE belgesi, silinmişse ondan öncekisi). İmza belgede kalır, PDF her alındığında aynıdır. Sağ paneldeki **Başka imza** rastgele yenisini seçer; bir önceki ve bir sonraki CE belgesindeki imza gelmez.
- **PDF:** TR, EN, DE ya da birkaçı tek dosyada (TR, EN, DE sırasıyla). Dosya adı eski CE dosyalarının düzenindedir: `0226089-KSYSTE-LYM 1350 NS CE CONFORMITY (EN-DEU).pdf`, üç dilde `(TR-EN-DEU)`.

### İmzalar

İmzalar programın deposunda değil, **yalnız özel veri deposunda** (`warrantyx-veri/imzalar/`) durur. Programın deposu ve yayındaki site herkese açıktır; imza oraya konsaydı herkes indirebilirdi.

1. İmza sayfasını ayırma (bir kez yapıldı): `python tools/imza-ayir.py "<imza sayfası>.pdf"` sayfadaki her imzayı ayrı, arka planı saydam PNG olarak `imzalar/` klasörüne yazar (300 dpi). Kâğıt yan çevrilerek imzalandığı için her imza 90° döndürülür; mavi olmayan lekeler (siyah ve pembe nokta) silinir. Sayfada 23 tam imza vardı; imza olmayan tek çizgi alınmadı.
2. Programa yükleme (bir kez): **CE Belgesi → İmzalar → İmza dosyası ekle…** ile `imzalar/` klasöründeki 23 PNG birden seçilir. Depoya gönderilir; diğer bilgisayarlara kendiliğinden gelir. Aynı imza ikinci kez eklenmez.
3. İmza havuzdan çıkarılabilir (× iki kez). Çıkarılan imzayı kullanan belgede imza görünmez olur; o belgede **Başka imza** ile yenisi seçilir.

`imzalar/` klasörü ve proje kökündeki PDF'ler (imzalı taramalar) `.gitignore`'dadır, depoya gitmez.

## PDF

**PDF İndir** penceresinde diller ve bölümler seçilir. Birden çok dil seçilirse her dil tam belge olarak TR, EN, DE sırasıyla tek dosyada arka arkaya gelir. Dosya adı: `0626051-DÜNYA-ULT M200 3B GARANTİ BELGESİ TR-EN.pdf`.

PDF yazdırma penceresi olmadan doğrudan üretilir (P&ID motorundaki `pdf.js` / `pdf-dom.js`). Ekrandaki her kutu, çizgi ve harf ölçülüp aynı yere çizilir. Sayfalar vektördür, yazı seçilip aranabilir. Yazı tipleri gömülüdür (Calibri yerine ölçüleri aynı Carlito, Segoe UI yerine Selawik), bu yüzden belge her bilgisayarda aynı görünür. 3 dilli 13 sayfalık belge yaklaşık 120 KB'dir.

## Depodaki düzen

```
warrantyx-veri/
├── README.md               ilk bağlantıda program yazar
├── ayarlar.json            firma bilgileri, çalışma saati, varsayılan kapak
├── belgeler/
│   └── 0626051.json        her garanti belgesi bir dosya, dosya adı = Seri No
├── ce/
│   └── 0226089.json        her CE belgesi bir dosya, dosya adı = Seri No (imzanın adını taşır)
└── imzalar/
    └── imza-01.png …       CE imzaları (yalnız bu özel depoda)
```

Aynı makinenin garanti belgesi ve CE belgesi aynı seri numarasını taşır, ayrı klasörde durur.

Seri No değişince dosya da yeni adla yazılır, eskisi silinir. Eski sürümler GitHub geçmişinde kalır.

## Kayıt nasıl çalışır

- Değişiklik önce bu bilgisayarın tarayıcı veritabanına (IndexedDB) yazılır, internet kesilse de kaybolmaz.
- Değişenler en geç 1 dakikada bir, sayfadan çıkarken ve sayfa açılırken tek commit olarak depoya gönderilir. **Kaydet** (Ctrl+S) beklemeden gönderir.
- Başka bilgisayarda değişen belge açıksa güncel hâli kendiliğinden gelir.
- İki bilgisayarda aynı belge değişirse yeni olan asıl dosya olur, eskisi yanında `.catisma-<tarih>` adıyla saklanır.
- **Yedek indir** tüm veriyi tek JSON dosyasına alır, **Yedekten yükle** geri yükler (var olan dosyalar korunur).

## Metni ve firma bilgisini değiştirme

- **Firma, ürün cinsi, çalışma saati, yedek parça ve kullanım ömrü, onay tarihi ve sayısı:** Ayarlar sekmesi. Garanti süresi (13 ay ya da 2 yıl) her belgede sol menüden seçilir; seçeneklerin şart metnindeki yılı `codes/kayit.js` içinde (`GARANTI_SURELERI`).
- **Garanti şartları ve belge yazıları:** `codes/metin.js`. Şartlar sade Markdown'dır (`#` başlık, `##` ara başlık, `>` vurgulu kutu, `*` madde, `**kalın**`, `{{yer tutucu}}`). Üç dilin yapısı aynı kalmalıdır; `npm test` denetler.
- **CE belgesinin metni:** `codes/metin.js`, `CE_TR`, `CE_EN` ve `CE_DE`. Satır sonları belgedeki gibidir (dizinin her öğesi bir satır); bir cümle değişirse satırlar elle bölünür. Satırların yeri `codes/ce.js` içindeki ölçü tablosundadır (`ORTAK`, `DIL`: mm, taban çizgisi), yazı boyları aynı dosyada (`SINIF`), renk ve harf aralığı `codes/ce.css` içindedir. TR, EN'in satır yerlerini kullanır: TR metni değişirse her bölüm EN ile aynı satır sayısında kalmalıdır (`npm test` denetler).
- **Logo, yazı tipi:** `assets/` altındaki dosyayı değiştirip `npm run gomulu` çalıştırın. Dosyadan açılan sayfa diskteki dosyayı programla okuyamadığı için görseller ve yazı tipleri `assets/gomulu-*.js` olarak programa gömülür.

## Klasörler

| Yol | İçerik |
|---|---|
| `index.html` | Program: ilk kurulum, garanti ve CE belgeleri, ayarlar, veritabanı, düzenleyici |
| `codes/app.js` | Arayüz, kayıt, PDF akışı |
| `codes/belge.js`, `codes/belge.css` | Belge motoru: kapak, antetli sayfalar, sayfalama, garanti belgesi |
| `codes/ce.js`, `codes/ce.css` | CE belgesi: taranmış belgenin düzeni (ölçü tablosu), CE işareti (vektör), imza |
| `codes/metin.js` | Garanti belgesi ve CE belgesi TR, EN, DE metinleri |
| `codes/kayit.js` | Belge ve ayar şeması, depo yolları, dosya adı |
| `codes/pdf.js`, `codes/pdf-dom.js` | Vektörel PDF motoru (P&ID'den; JPEG görsel ve `object-fit: cover` eki, ileride fotoğraf için) |
| `codes/tema.css` | Arayüz teması (koyu tema, Dolfin kırmızısı) |
| `ortak/` | Veritabanı (`wx-db.js`), GitHub bağlantısı (`wx-github.js`), açılış ve bağlantı (`wx-boot.js`) |
| `assets/` | Dolfin logosu, yazı tipleri (OFL lisanslı: Carlito, Selawik, Caladea, Barlow) ve gömülü kopyaları; imza yoktur |
| `tools/gomulu-uret.js` | `assets/gomulu-*.js` üreticisi |
| `tools/imza-ayir.py` | İmza sayfasını tek tek saydam PNG imzalara ayırır (`imzalar/`, depoya gitmez) |
| `manifest.webmanifest` | Uygulama bilgisi: ad, simgeler, kendi penceresi, Yeni Garanti Belgesi kısayolu |
| `sw.js` | Uygulama katmanı (service worker): açılışta son sürüm, internetsiz açılış |
| `assets/simge/` | Uygulama simgeleri (koyu zeminde ağır beyaz W, altında kırmızı çizgi); `tools/simge-uret.ps1` üretir |
| `tools/yayin-hazirla.js` | Yayın sitesini hazırlar: dosyaları kopyalar, içerik özetlerini, sürüm damgasını, `sw.js` dosya listesini ve `surum.json` yazar |
| `.github/workflows/yayin.yml` | `main` dalına gönderimde test ve GitHub Pages yayını |
| `test/` | Birim ve veritabanı testleri (sahte GitHub ile) |
| `_eski/` | Önceki garanti dosyaları; içerikleri bir dosya kaymış, eşleşme `_eski/OKU.md` içinde |

## Sınırlar

- **Erişim anahtarı** yalnız bu tarayıcıda saklanır. Dosyadan açılan programda bilgisayardaki başka bir yerel HTML dosyası da onu okuyabilir. Yayındaki programda anahtarı yalnız `thevanerr.github.io` altındaki sayfalar okuyabilir, yani sizin diğer yayındaki araçlarınız. Bu yüzden anahtar yalnız `warrantyx-veri` deposuna izinli olmalıdır. Süresi dolunca Veritabanı sekmesinden yenilenir.
- **Yayındaki kod açıktır:** Program dosyaları ve garanti şartlarının metni herkesçe görülebilir. Bu metin zaten her belgede basılıdır. Müşteri, makine ve belge bilgileri yalnız özel depodadır.
- **Özel depo zorunlu:** Herkese açık depoya bağlanılmaz, çünkü müşteri verisi içerir.
- **Yasal metin:** Türkçe metin ve onay sayısı eski garanti belgesinden olduğu gibi alındı. Metin 4077 sayılı Kanun'a ve Sanayi ve Ticaret Bakanlığı'na atıf yapıyor; bu kanun 2014'te 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile değişti. Güncellenmesi gerekiyorsa `codes/metin.js` içinde değiştirilir.

## Test

```
npm test
```

Kayıt modeli, üç dilin metin yapısı, boş `warrantyx-veri` deposuna ilk yazma, iki bilgisayar arası eşitleme, PDF'e JPEG gömme, yayın sitesinin hazırlanması (içerik özetleri, her dosyanın sitede olması, `sw.js` dosya listesi) ve manifest simgeleri denenir. CE belgesi için: kayıt biçimi ve depo yolu, PDF dosya adı, TR, EN ve DE metninin yapısı ve satır sayıları (TR'de EN ile aynı), imza kuralı (2000 belgede art arda aynı imza yok, her imza kullanılır, "Başka imza" komşu belgelerinkini vermez), imza PNG'sinin iki bilgisayar arasında bozulmadan taşınması ve imzaların yayındaki siteye girmemesi.
