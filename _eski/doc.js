<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Belge Üretim Sistemi</title>
    <link rel="stylesheet" href="doc.css?v=2">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>

    <nav class="navbar" role="navigation" aria-label="Ana navigasyon">
        <div class="nav-left">
            <button class="btn btn-login" onclick="handleLogin()" aria-label="Kullanıcı girişi">🔐 Kullanıcı Girişi</button>
        </div>

        <div class="nav-middle" role="tablist" aria-label="Belge türü seçimi">
            <button id="btn-garanti" class="btn btn-tab active" onclick="switchDoc('garanti')" role="tab" aria-selected="true" aria-controls="preview-area">Garanti Kartı</button>
            <button id="btn-ce" class="btn btn-tab" onclick="switchDoc('ce')" role="tab" aria-selected="false" aria-controls="preview-area">CE Belgesi</button>
        </div>

        <div class="nav-right">
            <button class="btn btn-pdf" onclick="exportPDF()" aria-label="PDF olarak indir">PDF Çıktı</button>
            
            <select class="lang-select" id="langSelect" onchange="handleLanguageChange()" aria-label="Dil seçimi">
                <option value="tr">🇹🇷 Türkiye (TR)</option>
                <option value="en">🇬🇧 İngiltere (EN)</option>
                <option value="de">🇩🇪 Almanya (DE)</option>
            </select>
        </div>
    </nav>

    <div class="app-container">
        
        <aside class="sidebar" role="complementary" aria-label="Form girişleri">
            <h3>Değişebilir Alanlar</h3>
            
            <form id="document-form" onsubmit="return false;">
            <div class="input-group">
                <label for="input-seri">Seri Numarası</label>
                <input type="text" id="input-seri" placeholder="Örn: LYM-2026-001" oninput="updatePreview()">
            </div>

            <div class="input-group">
                <label for="input-tarih">Üretim / Sevkiyat Tarihi</label>
                <input type="text" id="input-tarih" placeholder="Örn: 17.06.2026" oninput="updatePreview()">
            </div>

            <div class="input-group">
                <label for="input-model">Model / Tip</label>
                <input type="text" id="input-model" placeholder="Örn: VDL Series S" oninput="updatePreview()">
            </div>

            <div class="input-group">
                <label for="input-musteri">Мүşteri Adı</label>
                <input type="text" id="input-musteri" placeholder="Örn: VICO">
            </div>
            </form>
        </aside>  <!-- sidebar sonu -->

        <main class="preview-area" id="preview-area" role="main" aria-live="polite" aria-label="Belge önizleme">
            <!-- Garanti sayfaları veya CE içeriği dinamik olarak buraya gelecek -->
        </main>

    </div>

    <script src="kapak.js?v=2"></script>
    <script src="garantim.js?v=2"></script>
    <script src="doc.js?v=2"></script>
</body>
</html>
