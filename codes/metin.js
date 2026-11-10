/* Belge metinleri: TR, EN, DE.
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
      belgeNo: 'Belge No',
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
      fatura: 'Fatura Tarihi ve No',
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
      belgeNo: 'Certificate No',
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
      fatura: 'Invoice Date and No',
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
      belgeNo: 'Zertifikat-Nr.',
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
      fatura: 'Rechnungsdatum und -nummer',
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

  return { DILLER, DIL_SIRASI, dil, esc, satir, doldur, bloklar, sartBloklari };
});
