/* Belge metinleri: garanti belgesi TR, EN, DE; CE uygunluk beyanı EN, DE (dosyanın sonunda).
   Garanti şartları sade Markdown'dır; sayfalara bölme belge.js'te kendiliğinden yapılır.
     # Başlık   ## Ara başlık   > Vurgulu kutu   * Madde   **kalın**   {{yer tutucu}}
   Yer tutucular ayarlardaki garanti süresi, çalışma saati, yedek parça ve kullanım ömrüyle dolar.
   TR ve DE metni eski garanti belgesinden alındı; EN metni bu ikisinden çevrildi.
   Bu dosya tarayıcıya bağlı değildir; Node testleri aynı kodu çalıştırır. */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.WxMetin = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const sayi = (n) => String(n);

  /* ─── Türkçe ──────────────────────────────────────────── */

  const TR_SARTLAR = `
# GARANTİ ŞARTLARI VE KOŞULLARI

> **Garanti süresi fatura tarihinden itibaren başlar ve {{garantiYilMetin}} veya {{garantiSaat}} (çalışma) saattir. (Hangisi önce dolarsa)**

Ürün, sadece bu kullanım kılavuzunda açıklandığı şekilde kullanılması, hiçbir şekilde kurcalanmamış olması, yetkisiz personel tarafından onarılmamış olması ve gerektiğinde sadece orijinal yedek parçaların kullanılmış olması kaydıyla, beyan edilen özelliklere göre tüm uygunsuzluklara karşı şirketimizin garantisi altındadır ve yasalarca korunmaktadır.

Ürünün garanti süresi içinde arızalanması durumunda, onarım sürecinde geçen süre garanti süresine eklenir. Ürünün azami tamir süresi 30 iş günüdür. Bu süre, ürünün arızasının servis istasyonuna, servis istasyonunun olmaması durumunda sırasıyla satıcısına, bayisine, acentesine, temsilciliğine, ithalatçısına veya imalatçısına-üreticisine bildirildiği tarihten itibaren başlar. Ürünün arızasının 15 iş günü içerisinde giderilememesi halinde imalatçı/üretici veya ithalatçı; ürünün tamiri tamamlanıncaya kadar, benzer özelliklere sahip başka bir ürünü tüketicinin kullanımına tahsis etmek zorundadır.

Ürünün garanti süresi içerisinde gerek malzeme ve işçilik, gerekse montaj hatalarından dolayı arızalanması halinde, işçilik masrafı, değiştirilen parça bedeli ya da başka herhangi bir ad altında hiçbir ücret talep edilmeksizin tamiri yapılacaktır.

## Değişim veya İade İçin Müşteri Hakları

Müşteri, aşağıdaki durumlarda ürünün tamamen değiştirilmesi, iadesi veya ayıp oranında bedel indirimi hakkına sahiptir:

* Tüketiciye teslim edildiği tarihten itibaren bir yıl içerisinde, belirlenen garanti süresi içinde kalmak kaydıyla; aynı arızanın ikiden fazla tekrarlanması veya farklı arızaların dörtten fazla meydana gelmesi veya belirlenen garanti süresi içerisinde farklı arızaların toplamının altıdan fazla olması ve bu arızaların maldan sürekli olarak yararlanamamaya neden olması.
* Tamiri için gereken azami sürenin aşılması.
* Şirketin servis istasyonunun veya herhangi bir servis istasyonunun bulunmaması durumunda; sırasıyla satıcı, bayi, acente, ithalatçı veya imalatçıdan/üreticiden birisi tarafından düzenlenecek raporla arızanın tamirinin mümkün bulunmadığının belirlenmesi durumlarında tüketici malın ücretsiz değiştirilmesini, bedel iadesini veya ayıp oranında bedel indirimini talep edebilir.

## Garanti İstisnaları ve Genel Şartlar

* Kullanıcının ürünü hatalı kullanması (kullanım kılavuzuna uymaması) durumunda meydana gelen arızalar garanti kapsamı dışındadır.
* Garanti Belgesi ile ilgili olarak çıkabilecek sorunlar için kullanıcı, Sanayi ve Ticaret Bakanlığı Tüketicinin ve Rekabetin Korunması Genel Müdürlüğü'ne başvurabilir.
* Sepet yataklama tekerlekleri, küresel vana, filtreler, piller, ampuller, kesme ve bitirme elemanları vb. gibi sarf malzemeleri ve/veya belirli bir aşınmaya maruz kalan bileşenler garanti kapsamı dışındadır.
* Ürünü satın alma belgesi ile birlikte satıcınıza veya yetkili bir yardım merkezine götürün.
* Makinenin tamamı, tüm parçaları dahil olmak üzere şirketimizin garantisi altındadır.
* Makine ayrıca **{{yedekParcaYil}} yıllık yedek parça temin garantisine** sahiptir.
* Ürünün kullanım ömrü **{{kullanimOmruYil}} yıldır**.
`;

  const TR = {
    kod: 'TR',
    ad: 'Türkçe',
    belgeAdi: 'GARANTİ BELGESİ',
    markaAlt: 'Endüstriyel Parça Yıkama Makineleri',
    kicker: 'ENDÜSTRİYEL PARÇA YIKAMA MAKİNELERİ',
    sayfa: (n, t) => `Sayfa ${n} / ${t}`,
    yer: (a) => ({
      garantiYilMetin: `${sayi(a.garantiYil)} yıl`,
      garantiSaat: sayi(a.garantiSaat),
      yedekParcaYil: sayi(a.yedekParcaYil),
      kullanimOmruYil: sayi(a.kullanimOmruYil)
    }),
    sartlar: TR_SARTLAR,
    kapak: {
      seri: 'Seri Numarası',
      model: 'Makine Modeli',
      teslim: 'Teslim Tarihi',
      alici: 'Alıcı Firma',
      sure: 'Garanti Süresi',
      saklayin: 'Garantiden yararlanmak için bu belgeyi saklayınız.'
    },
    isaret: 'GARANTİ',
    istatistik: {
      garanti: () => ['YIL', 'GARANTİ'],
      saat: () => ['ÇALIŞMA', 'SAATİ'],
      yedek: () => ['YIL YEDEK', 'PARÇA TEMİNİ'],
      omur: () => ['YIL', 'KULLANIM ÖMRÜ']
    },
    rozet: {
      muhurBirim: () => 'YIL',
      muhurAlt: 'GARANTİ'
    },
    sureDeger: (y, s) => `${sayi(y)} YIL / ${sayi(s)} SAAT`,
    belge: {
      baslik: 'GARANTİ BELGESİ',
      onay: 'Belge onay tarihi ve sayısı',
      yasal: 'Bu belgenin kullanılmasına; 4077 sayılı Tüketicinin Korunması Hakkında Kanun ve bu Kanuna dayanılarak yürürlüğe konulan Garanti Belgesi Uygulama Esaslarına Dair Yönetmelik uyarınca, T.C. Sanayi ve Ticaret Bakanlığı Tüketicinin ve Rekabetin Korunması Genel Müdürlüğü tarafından izin verilmiştir.',
      dikkat: 'DİKKAT!',
      dikkatMetin: 'GARANTİDEN YARARLANARAK TALEPTE BULUNMAK İÇİN SAKLAYINIZ.',
      urun: 'ÜRÜN BİLGİLERİ',
      imalatci: 'İMALATÇI FİRMA',
      satici: 'SATICI FİRMA',
      unvan: 'Unvanı',
      adres: 'Merkez Adresi',
      telefon: 'Telefon',
      faks: 'Faks',
      eposta: 'E-posta',
      web: 'Web',
      cinsi: 'Cinsi',
      markasi: 'Markası',
      modeli: 'Modeli',
      seriNo: 'Seri No',
      sure: 'Garanti Süresi',
      teslimTarihi: 'Teslim Tarihi',
      teslimYeri: 'Teslim Yeri',
      fatura: 'Fatura Tarihi',
      alici: 'Alıcı',
      kase: 'Kaşe / İmza',
      tarih: 'Tarih'
    },
    servis: {
      baslik: 'SERVİS VE BAKIM KAYITLARI',
      aciklama: 'Garanti süresince yapılan her servis ve bakım işlemi bu tabloya işlenir ve yetkili servis tarafından imzalanır. Garanti talebinde bu sayfa da gösterilir.',
      tarih: 'Tarih',
      form: 'Servis Formu No',
      islem: 'Yapılan İşlem / Arıza',
      saat: 'Çalışma Saati',
      imza: 'Teknisyen / İmza'
    }
  };

  /* ─── English ─────────────────────────────────────────── */

  const EN_SARTLAR = `
# WARRANTY TERMS AND CONDITIONS

> **The warranty period starts on the invoice date and is {{garantiYilMetin}} or {{garantiSaat}} (operating) hours, whichever comes first.**

The product is covered by our company's warranty and protected by law against all nonconformities with its declared specifications, provided that it has been used only as described in this user manual, has not been tampered with in any way, has not been repaired by unauthorized personnel and, where necessary, only original spare parts have been used.

If the product fails within the warranty period, the time spent on repair is added to the warranty period. The maximum repair time of the product is 30 working days. This period starts on the date on which the failure is reported to the service station or, if there is no service station, to the seller, dealer, agent, representative, importer or manufacturer of the product, in this order. If the failure cannot be remedied within 15 working days, the manufacturer or importer must provide the consumer with another product of similar specifications until the repair is completed.

If the product fails within the warranty period due to material, workmanship or assembly defects, it will be repaired free of charge, without any fee for labour, replaced parts or under any other name.

## Customer Rights to Replacement or Refund

The customer is entitled to a full replacement of the product, a refund or a price reduction in proportion to the defect in the following cases:

* Within one year from the date of delivery to the consumer, provided that it remains within the specified warranty period: the same failure recurring more than twice, different failures occurring more than four times, or the total number of different failures exceeding six within the specified warranty period, where these failures permanently prevent the use of the product.
* The maximum time required for repair is exceeded.
* If the company's service station or any other service station is not available and a report issued by the seller, dealer, agent, importer or manufacturer, in this order, determines that the failure cannot be repaired, the consumer may request free replacement of the product, a refund or a price reduction in proportion to the defect.

## Warranty Exclusions and General Conditions

* Failures caused by incorrect use of the product by the user (not following the user manual) are not covered by the warranty.
* For problems that may arise regarding the Warranty Certificate, the user may apply to the Ministry of Industry and Trade, General Directorate of Consumer and Competition Protection.
* Consumables and/or components subject to particular wear, such as basket bearing wheels, ball valves, filters, batteries, bulbs, cutting and finishing elements, etc., are not covered by the warranty.
* Take the product to your dealer or an authorized service centre together with the proof of purchase.
* The entire machine, including all its parts, is covered by our company's warranty.
* The machine also has a **{{yedekParcaYil}}-year spare parts availability guarantee**.
* The service life of the product is **{{kullanimOmruYilMetin}}**.
`;

  const years = (n) => `${sayi(n)} ${Number(n) === 1 ? 'year' : 'years'}`;

  const EN = {
    kod: 'EN',
    ad: 'English',
    belgeAdi: 'WARRANTY CARD',
    markaAlt: 'Industrial Parts Washing Machines',
    kicker: 'INDUSTRIAL PARTS WASHING MACHINES',
    sayfa: (n, t) => `Page ${n} / ${t}`,
    yer: (a) => ({
      garantiYilMetin: years(a.garantiYil),
      garantiSaat: sayi(a.garantiSaat),
      yedekParcaYil: sayi(a.yedekParcaYil),
      kullanimOmruYilMetin: years(a.kullanimOmruYil)
    }),
    sartlar: EN_SARTLAR,
    kapak: {
      seri: 'Serial Number',
      model: 'Machine Model',
      teslim: 'Delivery Date',
      alici: 'Buyer Company',
      sure: 'Warranty Period',
      saklayin: 'Keep this certificate to claim under the warranty.'
    },
    isaret: 'WARRANTY',
    istatistik: {
      garanti: (n) => [Number(n) === 1 ? 'YEAR' : 'YEARS', 'WARRANTY'],
      saat: () => ['OPERATING', 'HOURS'],
      yedek: (n) => [Number(n) === 1 ? 'YEAR OF' : 'YEARS OF', 'SPARE PARTS'],
      omur: (n) => [Number(n) === 1 ? 'YEAR' : 'YEARS', 'SERVICE LIFE']
    },
    rozet: {
      muhurBirim: (y) => (Number(y) === 1 ? 'YEAR' : 'YEARS'),
      muhurAlt: 'WARRANTY'
    },
    sureDeger: (y, s) => `${sayi(y)} ${Number(y) === 1 ? 'YEAR' : 'YEARS'} / ${sayi(s)} HOURS`,
    belge: {
      baslik: 'WARRANTY CERTIFICATE',
      onay: 'Certificate approval date and number',
      yasal: 'The use of this certificate has been authorized by the Ministry of Industry and Trade of the Republic of Turkey, General Directorate of Consumer and Competition Protection, in accordance with Consumer Protection Law No. 4077 and the Regulation on the Implementation Principles of Warranty Certificates issued under this Law.',
      dikkat: 'ATTENTION!',
      dikkatMetin: 'KEEP THIS CERTIFICATE TO CLAIM UNDER THE WARRANTY.',
      urun: 'PRODUCT INFORMATION',
      imalatci: 'MANUFACTURER',
      satici: 'SELLER',
      unvan: 'Name / Company',
      adres: 'Head Office Address',
      telefon: 'Phone',
      faks: 'Fax',
      eposta: 'E-mail',
      web: 'Web',
      cinsi: 'Type',
      markasi: 'Brand',
      modeli: 'Model',
      seriNo: 'Serial No',
      sure: 'Warranty Period',
      teslimTarihi: 'Delivery Date',
      teslimYeri: 'Place of Delivery',
      fatura: 'Invoice Date',
      alici: 'Buyer',
      kase: 'Stamp / Signature',
      tarih: 'Date'
    },
    servis: {
      baslik: 'SERVICE AND MAINTENANCE RECORD',
      aciklama: 'Every service and maintenance operation carried out during the warranty period is entered in this table and signed by the authorized service. Present this page together with any warranty claim.',
      tarih: 'Date',
      form: 'Service Form No',
      islem: 'Work Performed / Failure',
      saat: 'Operating Hours',
      imza: 'Technician / Signature'
    }
  };

  /* ─── Deutsch ─────────────────────────────────────────── */

  const DE_SARTLAR = `
# GARANTIEBEDINGUNGEN UND -BESTIMMUNGEN

> **Die Garantiezeit beginnt mit dem Rechnungsdatum und beträgt {{garantiYilMetin}} oder {{garantiSaat}} (Betriebs-)Stunden. (Je nachdem, was zuerst eintritt)**

Das Produkt fällt unter die Garantie unseres Unternehmens und ist gesetzlich gegen alle Mängel in Bezug auf die erklärten Eigenschaften geschützt, solange es ausschließlich in der in dieser Bedienungsanleitung beschriebenen Weise verwendet wurde, in keiner Weise manipuliert wurde, nicht von unbefugtem Personal repariert wurde und, falls erforderlich, nur Original-Ersatzteile verwendet wurden.

Falls das Produkt während der Garantiezeit einen Fehler aufweist, wird die Zeit während des Reparaturvorgangs zur Garantiezeit hinzugerechnet. Die Reparaturzeit des Produkts beträgt maximal 30 Arbeitstage. Diese Frist beginnt mit dem Datum der Benachrichtigung der Servicestation über die Fehlfunktion des Produkts, bei Fehlen der Servicestation an den Verkäufer, Händler, Agenten, Vertreter, Importeur oder Hersteller - Produzenten des Produkts. Wenn die Fehlfunktion des Produkts nicht innerhalb von 15 Arbeitstagen behoben werden kann, ist der Hersteller/Produzent oder Importeur verpflichtet, dem Verbraucher die Nutzung eines anderen Produkts mit ähnlichen Eigenschaften zu ermöglichen, bis die Reparatur des Produkts abgeschlossen ist.

Im Falle einer Fehlfunktion des Produkts innerhalb der Garantiezeit aufgrund von Material-, Verarbeitungs- oder Montagefehlern wird die Reparatur kostenlos unter dem Namen Arbeitskosten, Ersatzteilgebühr oder unter einem anderen Namen durchgeführt.

## Kundenrechte auf Umtausch oder Rückerstattung

Der Kunde hat Anspruch auf einen vollständigen Austausch des Produkts, eine Rückerstattung oder einen dem Mangel angemessenen Preisnachlass, wenn:

* Innerhalb eines Jahres ab dem Datum der Lieferung an den Verbraucher, sofern sie innerhalb der angegebenen Garantiezeit verbleiben; das Auftreten derselben Fehlfunktion mehr als zweimal oder das Auftreten verschiedener Fehlfunktionen mehr als viermal, oder die Summe verschiedener Fehlfunktionen innerhalb der angegebenen Garantiezeit sechsmal überschreitet, sowie diese Fehlfunktionen dazu führen, dass die Ware dauerhaft nicht genutzt werden kann.
* Die für die Reparatur erforderliche Höchstfrist überschritten wird.
* Falls die Servicestation des Unternehmens oder eine andere Servicestation nicht verfügbar ist, kann der Verbraucher einen kostenlosen Umtausch der Ware, eine Rückerstattung oder eine Minderung des fehlerhaften Preises verlangen, wenn durch den von einem der Verkäufer, Händler, Vertreter, Importeure oder Hersteller oder Produzenten auszustellenden Bericht festgestellt wird, dass eine Behebung des Fehlers nicht möglich ist.

## Garantieausschlüsse und allgemeine Bedingungen

* Wenn der Benutzer das Produkt fehlerhaft verwendet (die Bedienungsanleitung nicht befolgt), fallen diese Fehler nicht unter die Garantie.
* Bei Problemen im Zusammenhang mit dem Garantiezertifikat kann sich der Benutzer an das Ministerium für Industrie und Handel, Hauptabteilung für Verbraucherschutz und Wettbewerb, wenden.
* Verbrauchsmaterialien und/oder Komponenten, die einem besonderen Verschleiß unterliegen, wie Korbbettenräder, Kugelhähne, Filter, Batterien, Glühbirnen, Schneid- und Veredelungselemente usw., sind von der Garantie ausgeschlossen.
* Bringen Sie das Produkt zu Ihrem Händler oder einer autorisierten Servicestelle und legen Sie den Kaufbeleg vor.
* Die gesamte Maschine einschließlich aller ihrer Komponenten ist in der Unternehmensgarantie enthalten.
* Die Maschine verfügt außerdem über eine **{{yedekParcaYil}}-jährige Ersatzteilbereitstellungsgarantie**.
* Die Lebensdauer des Produkts beträgt **{{kullanimOmruYilMetin}}**.
`;

  const jahre = (n) => `${sayi(n)} ${Number(n) === 1 ? 'Jahr' : 'Jahre'}`;
  const JAHRE = (n) => (Number(n) === 1 ? 'JAHR' : 'JAHRE');

  const DE = {
    kod: 'DE',
    ad: 'Deutsch',
    belgeAdi: 'GARANTIEKARTE',
    markaAlt: 'Industrielle Teilereinigungsmaschinen',
    kicker: 'INDUSTRIELLE TEILEREINIGUNGSMASCHINEN',
    sayfa: (n, t) => `Seite ${n} / ${t}`,
    yer: (a) => ({
      garantiYilMetin: jahre(a.garantiYil),
      garantiSaat: sayi(a.garantiSaat),
      yedekParcaYil: sayi(a.yedekParcaYil),
      kullanimOmruYilMetin: jahre(a.kullanimOmruYil)
    }),
    sartlar: DE_SARTLAR,
    kapak: {
      seri: 'Seriennummer',
      model: 'Maschinenmodell',
      teslim: 'Lieferdatum',
      alici: 'Käuferfirma',
      sure: 'Garantiezeit',
      saklayin: 'Bewahren Sie dieses Zertifikat auf, um die Garantie in Anspruch zu nehmen.'
    },
    isaret: 'GARANTIE',
    istatistik: {
      garanti: (n) => [JAHRE(n), 'GARANTIE'],
      saat: () => ['BETRIEBS-', 'STUNDEN'],
      yedek: (n) => [JAHRE(n), 'ERSATZTEILE'],
      omur: (n) => [JAHRE(n), 'LEBENSDAUER']
    },
    rozet: {
      muhurBirim: (y) => JAHRE(y),
      muhurAlt: 'GARANTIE'
    },
    sureDeger: (y, s) => `${sayi(y)} ${JAHRE(y)} / ${sayi(s)} STUNDEN`,
    belge: {
      baslik: 'GARANTIEZERTIFIKAT',
      onay: 'Datum und Nummer der Zertifikatsgenehmigung',
      yasal: 'Die Genehmigung für dieses Zertifikat wird vom türkischen Ministerium für Industrie und Handel, Generaldirektion für Verbraucherschutz und Marktüberwachung, in Übereinstimmung mit der Verordnung über die Richtlinien für Garantiepraktiken ausgestellt, die durch das Gesetz über den Verbraucherschutz, Artikel Nr. 4077, umgesetzt wurde.',
      dikkat: 'ACHTUNG!',
      dikkatMetin: 'AUFBEWAHREN, UM DIE GARANTIE IN ANSPRUCH ZU NEHMEN.',
      urun: 'PRODUKTINFORMATIONEN',
      imalatci: 'HERSTELLER',
      satici: 'HÄNDLER',
      unvan: 'Name / Firma',
      adres: 'Adresse des Hauptsitzes',
      telefon: 'Telefon',
      faks: 'Fax',
      eposta: 'E-Mail',
      web: 'Web',
      cinsi: 'Typ',
      markasi: 'Marke',
      modeli: 'Modell',
      seriNo: 'Serien-Nr.',
      sure: 'Garantiezeit',
      teslimTarihi: 'Lieferdatum',
      teslimYeri: 'Lieferort',
      fatura: 'Rechnungsdatum',
      alici: 'Käufer',
      kase: 'Stempel / Unterschrift',
      tarih: 'Datum'
    },
    servis: {
      baslik: 'SERVICE- UND WARTUNGSNACHWEIS',
      aciklama: 'Jeder während der Garantiezeit durchgeführte Service- und Wartungseinsatz wird in diese Tabelle eingetragen und vom autorisierten Service unterschrieben. Legen Sie diese Seite bei jedem Garantieanspruch vor.',
      tarih: 'Datum',
      form: 'Serviceformular-Nr.',
      islem: 'Durchgeführte Arbeit / Fehler',
      saat: 'Betriebsstunden',
      imza: 'Techniker / Unterschrift'
    }
  };

  const DILLER = { tr: TR, en: EN, de: DE };
  const DIL_SIRASI = [['tr', 'TR', 'Türkçe'], ['en', 'EN', 'English'], ['de', 'DE', 'Deutsch']];

  const dil = (id) => DILLER[id] || TR;

  /* ─── CE uygunluk beyanı: EN, DE ──────────────────────────
     Metin taranmış CE belgelerinden harfi harfine alındı; yazım da olduğu gibi kaldı.
     Üst bilgi, standart açıklamaları ve beyan belgedeki satırlarıyla yazılır: dizinin her öğesi bir satır.
     Satırlar kendiliğinden bölünmez, belgenin yapısı yazı tipinden bağımsız aynı kalır. Bir cümle
     değişirse satır sonları da elle düzenlenir (sağ kenar: en uzun satır kadar). */

  const CE_EN = {
    kod: 'EN',
    ad: 'English',
    // PDF dosya adındaki dil etiketi: eski dosyalardaki gibi (EN), (DEU)
    dosyaEtiketi: 'EN',
    ust: [
      ['Regulation (EC) No:765/2008 of the European parliament and of', 'the council setting out the requirements for accreditation and', 'market surveillance relating to the marketing of products'],
      ['EN ISO/IEC 17050-1:2010 | Conformity assessment-Supplier’s', 'declaration of conformity']
    ],
    baslik: 'EC Declaration of Conformity',
    imalatciEtiket: 'NAME OF MANUFACTURER',
    firma: 'C.N.K ELEKTRONİK MAKİNE SANAYİ A.Ş.',
    adres: '1. ORGANİZE SANAYİ BÖLGESİ ORHAN IŞIK BULVARI NO:1 ANKARA / TÜRKİYE',
    web: 'https://www.dolfin.info.tr/en  - dolfin@dolfintr.com',
    urunAdi: 'Product name',
    tipModel: 'Type / Model',
    seriNo: 'Serial Number',
    imalYili: 'Year of manufacture',
    marka: 'Brand',
    raporlar: 'Test Reports',
    lvd: 'LVD-',
    risk: 'RISK ASSESMENT REPORT',
    kriterBaslik: 'Criteria',
    kriterler: [
      ['2006/42/EC', 'Machinery Directive'],
      ['2014/35/EU', 'Low Voltage Equipment Directive'],
      ['2014/30/EU', 'Electromagnetic Compatibility Directive']
    ],
    standartlar: [
      {
        kod: 'EN 60204-1:2018',
        ad: 'Safety of machinery - Electrical equipment of machines',
        metin: [
          'EN 60204-1:2018 specifies the safety requirements for the electrical equipment of machines. The standard covers the fundamental principles related to',
          'the design, installation, and verification of electrical, electronic, and programmable electronic equipment used in machinery. Its objective is to reduce',
          'electrical hazards, ensure the protection of personnel, and provide safe and reliable operation of machines. EN 60204-1:2018 addresses requirements',
          'related to electric shock protection, short-circuit protection, overcurrent protection, earthing, control circuits, emergency stop functions, and marking,',
          'and is widely referenced for machinery used in industrial environments.'
        ]
      },
      {
        kod: 'EN ISO 12100:2010',
        ad: 'Safety of machinery - General principles for design - Risk assessment and risk reduction',
        metin: [
          'EN ISO 12100:2010 specifies the general principles for machine safety, including risk assessment and risk reduction methods to be applied during',
          'machine design. The standard aims to ensure that hazards associated with machinery throughout its entire life cycle—including transport, installation,',
          'operation, maintenance, and decommissioning—are systematically identified and that the resulting risks are reduced to acceptable levels. EN ISO',
          '12100:2010 is based on a three-step risk reduction hierarchy, consisting of inherently safe design measures, technical protective measures, and',
          'information for use, and is recognized as a key reference standard within machinery safety legislation.'
        ]
      },
      {
        kod: 'EN ISO 13849-1:2023',
        ad: 'Safety of machinery - Safety-related parts of control systems',
        metin: [
          'EN ISO 13849-1:2023 specifies the general principles and requirements for the design of safety-related parts of control systems (SRP/CS) for machinery.',
          'The standard applies to safety functions implemented by electrical, electronic, programmable electronic, hydraulic, and pneumatic control systems. Its',
          'objective is to ensure that the safety-related parts of control systems achieve a sufficient level of reliability in relation to the identified risks.'
        ]
      },
      {
        kod: 'EN IEC 61000-6-2:2019',
        ad: 'Electromagnetic compatibility (EMC) - Part 6-2 - Immunity standard for industrial environments',
        metin: [
          'This standard specifies the Electromagnetic Compatibility (EMC) immunity requirements applicable to electrical and electronic equipment intended for',
          'use in industrial environments. The immunity requirements defined within the frequency range from 0 Hz to 400 GHz fall within the scope of this',
          'standard. No testing is required for frequencies for which no requirements are specified in the standard.'
        ]
      },
      {
        kod: 'EN IEC 61000-6-4:2019',
        ad: 'Electromagnetic Compatibility (EMC) - Part 6-4 - Emission Standard for Industrial Environments',
        metin: [
          'These requirements cover the electromagnetic emission requirements applicable to electrical and electronic equipment designed for use in industrial',
          'environments.'
        ]
      }
    ],
    beyan: [
      'By means of this declaration, I hereby declare that the identified products fully',
      'comply with the criteria, essential requirements, and applicable provisions',
      'specified in the relevant legislation, standards, and directives currently in force.'
    ],
    // İmza satırı parçaları: [metin, kalın mı, büyük mü]
    imzalayan: [['Fatih GÜRAL', true, true], [' – Quality Kontrol Supervisor of C.N.K ELEKTRONİK MAKİNE SANAYİ AŞ | Signature:', false, false]],
    tarihEtiket: 'Issue Date:',
    alt: 'Document Revision Number / Date: 01 / 15.12.2025 | Document Code: CNK52022161002'
  };

  const CE_DE = {
    kod: 'DE',
    ad: 'Deutsch',
    dosyaEtiketi: 'DEU',
    ust: [
      ['Verordnung (EG) Nr. 765/2008 des Europäischen Parlaments und des', 'Rates: Diese Verordnung legt die Anforderungen an die Akkreditierung', 'sowie an die Marktüberwachung im Zusammenhang mit der', 'Vermarktung von Produkten fest.'],
      ['EN ISO/IEC 17050-1:2010 – Konformitätsbewertung –', 'Konformitätserklärung von Lieferanten: Diese Norm beschreibt die', 'allgemeinen Anforderungen und Grundsätze für die Ausstellung einer', 'Konformitätserklärung durch den Hersteller bzw. Lieferanten.']
    ],
    baslik: 'EG-Konformitätserklärung',
    imalatciEtiket: 'NAME DES HERSTELLERS',
    firma: 'C.N.K ELEKTRONİK MAKİNE SANAYİ A.Ş.',
    adres: '1. ORGANİZE SANAYİ BÖLGESİ ORHAN IŞIK BULVARI NO:1 ANKARA / TÜRKİYE',
    web: 'https://www.dolfin.info.tr/en  - dolfin@dolfintr.com',
    urunAdi: 'Produktname',
    tipModel: 'Typ / Modell',
    seriNo: 'Seriennummer',
    imalYili: 'Baujahr',
    marka: 'Marke',
    raporlar: 'Prüfberichte',
    lvd: 'LVD-',
    risk: 'RISIKOBEURTEILUNGSBERICHT',
    kriterBaslik: 'Kriterien',
    kriterler: [
      ['2006/42/EC', 'Maschinenrichtlinie'],
      ['2014/35/EU', 'Niederspannungsrichtlinie'],
      ['2014/30/EU', 'Richtlinie über die elektromagnetische Verträglichkeit (EMV)']
    ],
    standartlar: [
      {
        kod: 'EN 60204-1:2018',
        ad: 'Sicherheit von Maschinen – Elektrische Ausrüstung von Maschinen',
        metin: [
          'Die Norm EN 60204-1:2018 legt die Sicherheitsanforderungen für die elektrische Ausrüstung von Maschinen fest. Sie umfasst grundlegende Prinzipien',
          'für die Konstruktion, Installation und Verifizierung elektrischer, elektronischer sowie programmierbarer elektronischer Ausrüstungen von Maschinen.',
          'Ziel der Norm ist es, elektrische Gefährdungen zu reduzieren, den Schutz von Personen sicherzustellen und einen sicheren sowie zuverlässigen Betrieb',
          'von Maschinen zu gewährleisten. Die Norm behandelt unter anderem Anforderungen hinsichtlich Schutzes gegen elektrischen Schlag, Kurzschluss-',
          'und Überstromschutz, Erdung, Steuerstromkreise, Not-Halt-Funktionen sowie Kennzeichnung und wird häufig für Maschinen in industriellen',
          'Umgebungen angewendet.'
        ]
      },
      {
        kod: 'EN ISO 12100:2010',
        ad: 'Sicherheit von Maschinen – Allgemeine Gestaltungsleitsätze – Risikobeurteilung und Risikominderung',
        metin: [
          'Die Norm EN ISO 12100:2010 legt allgemeine Grundsätze für die Maschinensicherheit fest, einschließlich Verfahren zur Risikobeurteilung und',
          'Risikominderung während der Konstruktion. Ziel ist es, Gefährdungen über den gesamten Lebenszyklus der Maschine hinweg – einschließlich',
          'Transport, Installation, Betrieb, Wartung und Außerbetriebnahme – systematisch zu identifizieren und die daraus resultierenden Risiken auf ein',
          'akzeptables Maß zu reduzieren.'
        ]
      },
      {
        kod: 'EN ISO 13849-1:2023',
        ad: 'Sicherheit von Maschinen – Sicherheitsbezogene Teile von Steuerungen',
        metin: [
          'Die Norm EN ISO 13849-1:2023 legt allgemeine Grundsätze und Anforderungen für die Gestaltung sicherheitsbezogener Teile von Steuerungssystemen',
          '(SRP/CS) fest. Sie gilt für Sicherheitsfunktionen, die durch elektrische, elektronische, programmierbare elektronische sowie hydraulische und',
          'pneumatische Steuerungen realisiert werden. Ziel der Norm ist es, sicherzustellen, dass die sicherheitsbezogenen Teile von Steuerungssystemen ein',
          'dem Risiko angemessenes Zuverlässigkeitsniveau erreichen.'
        ]
      },
      {
        kod: 'EN IEC 61000-6-2:2019',
        ad: 'Elektromagnetische Verträglichkeit (EMV) – Teil 6-2: Störfestigkeit für industrielle Umgebungen',
        metin: [
          'Diese Norm legt die Anforderungen an die elektromagnetische Störfestigkeit für elektrische und elektronische Geräte fest, die für den Einsatz in',
          'industriellen Umgebungen bestimmt sind. Die festgelegten Anforderungen gelten für einen Frequenzbereich von 0 Hz bis 400 GHz. Für',
          'Frequenzbereiche, für die keine spezifischen Anforderungen definiert sind, sind keine Prüfungen erforderlich.'
        ]
      },
      {
        kod: 'EN IEC 61000-6-4:2019',
        ad: 'Elektromagnetische Verträglichkeit (EMV) – Teil 6-4: Störaussendung für industrielle Umgebungen',
        metin: [
          'Diese Norm legt die Anforderungen an die elektromagnetische Störaussendung für elektrische und elektronische Geräte fest, die für den Einsatz in',
          'industriellen Umgebungen ausgelegt sind. Ziel ist es, sicherzustellen, dass die von Geräten verursachten elektromagnetischen Emissionen andere',
          'Systeme nicht beeinträchtigen.'
        ]
      }
    ],
    beyan: [
      'Mit dieser Erklärung erkläre ich hiermit, dass die identifizierten Produkte den',
      'Kriterien, den grundlegenden Anforderungen sowie den anwendbaren',
      'Bestimmungen der geltenden Rechtsvorschriften, Normen und Richtlinien',
      'vollständig entsprechen.'
    ],
    imzalayan: [['Fatih GÜRAL', true, true], [' - ', false, false], ['Qualitätskontrollleiter', true, false], [' bei C.N.K ELEKTRONİK MAKİNE SANAYİ AŞ | Unterschrift:', false, false]],
    tarihEtiket: 'Ausstellungsdatum:',
    alt: 'Dokument-Überarbeitungsnummer / Datum: 01 / 15.12.2025 | Dokumentencode: CNK52022161002'
  };

  const CE = { en: CE_EN, de: CE_DE };
  const CE_DIL_SIRASI = [['en', 'EN', 'English'], ['de', 'DE', 'Deutsch']];
  /** PDF dosya adındaki belge adı (eski dosyalardaki "CE COMFORMITY", yazımı düzeltildi) */
  const CE_DOSYA_ADI = 'CE CONFORMITY';
  const ceDil = (id) => CE[id] || CE_EN;

  /* ─── Metin → bloklar ─────────────────────────────────── */

  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /** Satır içi: önce kaçış, sonra **kalın** */
  const satir = (text) => esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  function doldur(text, values) {
    return String(text).replace(/\{\{(\w+)\}\}/g, (all, key) => (values && values[key] !== undefined ? values[key] : all));
  }

  /**
   * @returns [{ t: 'h1'|'h2'|'p'|'lead', html }, { t: 'ul', items: [html] }]
   * Boş satır paragrafı bitirir; art arda gelen satırlar tek paragraf olur.
   */
  function bloklar(md) {
    const out = [];
    let para = null;
    let list = null;
    const endPara = () => {
      if (para) out.push({ t: para.t, html: satir(para.lines.join(' ')) });
      para = null;
    };
    const endList = () => {
      if (list) out.push({ t: 'ul', items: list.map(satir) });
      list = null;
    };
    for (const raw of String(md).split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) {
        endPara();
        endList();
        continue;
      }
      let m = /^(#{1,3})\s+(.+)$/.exec(line);
      if (m) {
        endPara();
        endList();
        out.push({ t: m[1].length === 1 ? 'h1' : 'h2', html: satir(m[2]) });
        continue;
      }
      m = /^[*-]\s+(.+)$/.exec(line);
      if (m) {
        endPara();
        if (!list) list = [];
        list.push(m[1]);
        continue;
      }
      m = /^>\s?(.*)$/.exec(line);
      const kind = m ? 'lead' : 'p';
      const content = m ? m[1] : line;
      if (list) {
        // Maddeden sonra boşluksuz gelen satır maddenin devamıdır
        list[list.length - 1] += ` ${content}`;
        continue;
      }
      if (para && para.t !== kind) endPara();
      if (!para) para = { t: kind, lines: [] };
      para.lines.push(content);
    }
    endPara();
    endList();
    return out;
  }

  /** Dilin garanti şartları, değerler doldurulmuş */
  function sartBloklari(id, etkin) {
    const t = dil(id);
    return bloklar(doldur(t.sartlar, t.yer(etkin)));
  }

  return { DILLER, DIL_SIRASI, dil, esc, satir, doldur, bloklar, sartBloklari, CE, CE_DIL_SIRASI, CE_DOSYA_ADI, ceDil };
});
