"""İmza sayfasını tek tek imzalara ayırır: arka planı siler, saydam PNG yazar.

Kâğıt yan çevrilerek imzalandı: her imza 90° saat yönünde döndürülür, böylece CE belgesindeki gibi
soldan sağa yazılır. Eğimleri olduğu gibi kalır (10°-27° yukarı); CE belgesindeki imzalar da bu aralıkta.

Arka plan: tükenmez kalem mavisi kâğıttan maviliği ve koyuluğuyla ayrılır. Mavi olmayan lekeler (siyah nokta,
pembe nokta) alınmaz. Saydamlık mürekkep yoğunluğundan gelir, renk mürekkebin kendi rengidir; kenarlar yumuşak kalır.
İmzaya ait olmayan tek çizgi ya da küçük leke boyutundan elenir.

Gerekenler: Python 3, PyMuPDF (fitz), numpy, Pillow, opencv-python
Çalıştırma (proje klasöründe):  python tools/imza-ayir.py "<imza sayfası>.pdf"
Çıktı: imzalar/imza-01.png … (300 dpi). Programda CE Belgesi → İmzalar → "İmza dosyası ekle" ile yüklenir.

İmzalar programın deposuna konmaz: depo ve yayındaki site herkese açıktır. imzalar/ klasörü .gitignore'dadır;
program imzaları özel veri deposunda (warrantyx-veri, imzalar/) tutar.
"""

import os
import sys

import cv2
import fitz
import numpy as np
from PIL import Image

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
# Açık depoya girmez (.gitignore); program imzaları özel veri deposundan okur
HEDEF = os.path.join(KOK, 'imzalar')

MAVI_ESIK = 35        # mavi - kırmızı farkı: mürekkep sayılır
KOYU_ESIK = 225       # bundan açık piksel mürekkep sayılmaz (algılama için)
BIRLESTIR_PX = 61     # aynı imzanın ayrı çizgilerini birleştiren genişleme (300 dpi)
EN_AZ_MUREKKEP = 3000  # bundan az mürekkep pikseli olan parça imza değildir (tek çizgi, leke)
KENAR_PX = 8          # kırpılan imzanın çevresinde bırakılan saydam pay


def sayfa_goruntusu(pdf_yolu):
    """Taranmış sayfanın kendisi (yeniden örneklenmeden)"""
    doc = fitz.open(pdf_yolu)
    xref = doc[0].get_images(full=True)[0][0]
    data = doc.extract_image(xref)['image']
    tmp = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    return cv2.cvtColor(tmp, cv2.COLOR_BGR2RGB)


def saydam(rgb):
    """RGB → RGBA: mavi mürekkep kalır, kâğıt ve mavi olmayan lekeler saydam olur"""
    a = rgb.astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = a.mean(axis=2)
    mavilik = b - r
    koyuluk = 255.0 - lum
    # Saydamlık: koyuluk yumuşak eşikle; maviliği az olan piksel (siyah leke) saydam.
    # Pembe/mor lekede kırmızı yeşilden belirgin fazladır, mavi mürekkepte değildir.
    # Belgede imza küçülerek basılır, çizgi de incelir: orta tonlar biraz dolgun tutulur
    alfa = np.clip((koyuluk - 14.0) / 95.0, 0.0, 1.0)
    alfa *= np.clip((mavilik - 8.0) / 32.0, 0.0, 1.0)
    leke = (r - g) > 18
    alfa *= np.clip((g - r + 18.0) / 14.0, 0.0, 1.0)
    # Leke mürekkep çizgisinin üstüne düştüyse çizgi çevresinden tamamlanır
    alan = None
    if leke.any():
        alan = cv2.dilate(leke.astype(np.uint8), np.ones((3, 3), np.uint8))
        alfa8 = np.clip(alfa * 255.0 + 0.5, 0, 255).astype(np.uint8)
        alfa = cv2.inpaint(alfa8, alan, 3, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    # Mürekkep rengi: koyu piksellerin ortancası; kenarda kâğıtla karışmış renk bundan ayrılır
    guclu = alfa > 0.85
    murekkep = np.median(a[guclu], axis=0) if guclu.sum() > 50 else np.array([40.0, 55.0, 170.0])
    beyaz = 255.0
    with np.errstate(divide='ignore', invalid='ignore'):
        ayri = (a - (1.0 - alfa[..., None]) * beyaz) / np.maximum(alfa[..., None], 1e-3)
    ayri = np.clip(ayri, 0, 255)
    # Az örtülü pikselde ayrıştırma gürültülüdür: mürekkep rengine yaklaşır
    k = np.clip((alfa - 0.25) / 0.6, 0.0, 1.0)[..., None]
    renk = k * ayri + (1.0 - k) * murekkep
    # Tamamlanan yerin rengi lekeden değil mürekkepten gelir
    if alan is not None:
        renk[alan > 0] = murekkep
    out = np.dstack([renk, alfa * 255.0])
    return np.clip(out + 0.5, 0, 255).astype(np.uint8), murekkep


def imzalar(rgb):
    a = rgb.astype(np.int16)
    murekkep = (((a[..., 2] - a[..., 0]) > MAVI_ESIK) & (a.mean(axis=2) < KOYU_ESIK)).astype(np.uint8)
    genis = cv2.dilate(murekkep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (BIRLESTIR_PX, BIRLESTIR_PX)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(genis, connectivity=8)
    parcalar = []
    for i in range(1, n):
        x, y, w, h, _ = stats[i]
        kendi = lab[y:y + h, x:x + w] == i
        if int((kendi & (murekkep[y:y + h, x:x + w] > 0)).sum()) < EN_AZ_MUREKKEP:
            continue
        parcalar.append((x, y, w, h, kendi))
    # Sayfadaki sırayla: satır satır (satırlar ~650 px arayla), soldan sağa
    parcalar.sort(key=lambda p: (round((p[1] + p[3] / 2) / 650), p[0]))
    return parcalar


def main():
    if len(sys.argv) < 2:
        sys.exit('Kullanım: python tools/imza-ayir.py "<imza sayfası>.pdf"')
    pdf = sys.argv[1]
    rgb = sayfa_goruntusu(pdf)
    os.makedirs(HEDEF, exist_ok=True)
    for f in os.listdir(HEDEF):
        if f.startswith('imza-') and f.endswith('.png'):
            os.remove(os.path.join(HEDEF, f))
    for no, (x, y, w, h, kendi) in enumerate(imzalar(rgb), start=1):
        rgba, murekkep = saydam(rgb[y:y + h, x:x + w])
        rgba[..., 3] = np.where(kendi, rgba[..., 3], 0)
        # Kâğıt yan çevrilerek imzalandı: saat yönünde 90°
        rgba = np.rot90(rgba, k=-1).copy()
        ys, xs = np.nonzero(rgba[..., 3] > 6)
        y0, y1 = max(0, ys.min() - KENAR_PX), min(rgba.shape[0], ys.max() + 1 + KENAR_PX)
        x0, x1 = max(0, xs.min() - KENAR_PX), min(rgba.shape[1], xs.max() + 1 + KENAR_PX)
        rgba = rgba[y0:y1, x0:x1]
        # Tamamen saydam piksellerin rengi mürekkep rengi: küçültürken kenara gri/beyaz bulaşmaz
        bos = rgba[..., 3] == 0
        rgba[bos, :3] = np.clip(murekkep + 0.5, 0, 255).astype(np.uint8)
        yol = os.path.join(HEDEF, f'imza-{no:02d}.png')
        # 256 renkli palet (saydamlıklı): tek renk mürekkepte fark görünmez, dosya ~4 kat küçülür.
        # Çözünürlük dosyaya yazılır: program imzayı gerçek boyundan küçülterek basar.
        paletli = Image.fromarray(rgba).quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        paletli.save(yol, optimize=True, dpi=(300, 300))
        mm = lambda px: px * 25.4 / 300
        print(f'imza-{no:02d}.png  {rgba.shape[1]}x{rgba.shape[0]} px  {mm(rgba.shape[1]):.1f} x {mm(rgba.shape[0]):.1f} mm  '
              f'{os.path.getsize(yol) // 1024} KB  sayfada x{x} y{y}')


if __name__ == '__main__':
    main()
