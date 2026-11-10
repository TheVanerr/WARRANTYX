// ============================================================
// garantim.js - Markdown Sayfa Ayırıcı & Render Motoru
// ============================================================

/**
 * Markdown metnini sayfalara böler.
 * Sayfa ayracı olarak "---PAGE BREAK---" kullanılır.
 * @param {string} markdownText - Garanti.md içeriği
 * @returns {string[]} her biri bir sayfanın markdown içeriği olan dizi
 */
function splitMarkdownPages(markdownText) {
    const pages = markdownText.split(/^---PAGE\s*BREAK---$/gm);
    return pages.map(page => page.trim()).filter(page => page.length > 0);
}

/**
 * Basit Markdown -> HTML dönüştürücü.
 * Satır satır işler: başlık, liste, paragraf ayrımını doğru yapar.
 * @param {string} md - Bir sayfaya ait markdown metni
 * @returns {string} HTML çıktısı
 */
function markdownToHtml(md) {
    // Satır satır işle
    const lines = md.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Boş satır -> liste varsa kapat
        if (line.trim() === '') {
            if (inList) {
                html += '</ul>\n';
                inList = false;
            }
            html += '\n';
            continue;
        }

        // Başlıklar
        const h1Match = line.match(/^# (.+)/);
        const h2Match = line.match(/^## (.+)/);
        const h3Match = line.match(/^### (.+)/);

        if (h3Match) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += '<h3>' + applyInline(h3Match[1]) + '</h3>\n';
            continue;
        }
        if (h2Match) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += '<h2>' + applyInline(h2Match[1]) + '</h2>\n';
            continue;
        }
        if (h1Match) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += '<h1>' + applyInline(h1Match[1]) + '</h1>\n';
            continue;
        }

        // Liste maddesi (* veya - ile başlayan)
        const liMatch = line.match(/^[\*\-]\s+(.+)/);
        if (liMatch) {
            if (!inList) {
                html += '<ul>\n';
                inList = true;
            }
            html += '<li>' + applyInline(liMatch[1]) + '</li>\n';
            continue;
        }

        // Düz metin paragrafı
        if (inList) {
            html += '</ul>\n';
            inList = false;
        }
        html += '<p>' + applyInline(line) + '</p>\n';
    }

    // En sonda liste açık kaldıysa kapat
    if (inList) html += '</ul>\n';

    return html;
}

/**
 * Satır içi stilleri uygular: **kalın**, *italik*
 */
function applyInline(text) {
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return text;
}

/**
 * Ana render fonksiyonu.
 * Placeholder'ları input değerleriyle değiştirir, sonra HTML'e çevirir.
 * @param {string} markdownText - Garanti.md içeriği
 * @returns {string} Tüm sayfaların HTML'i
 */
function renderWarrantyDocument(markdownText) {
    // Placeholder'ları input değerleriyle değiştir
    let processedText = markdownText;

    const seriVal = document.getElementById('input-seri')?.value || '';
    const tarihVal = document.getElementById('input-tarih')?.value || '';
    const modelVal = document.getElementById('input-model')?.value || '';

    processedText = processedText.replace(/\{\{seri\}\}/g, seriVal);
    processedText = processedText.replace(/\{\{tarih\}\}/g, tarihVal);
    processedText = processedText.replace(/\{\{model\}\}/g, modelVal);

    const pages = splitMarkdownPages(processedText);
    
    let fullHtml = '';
    
    pages.forEach((pageContent, index) => {
        const pageHtml = markdownToHtml(pageContent);
                fullHtml += `
            <div class="a4-page warranty-page">
                <div class="warranty-content">
                    ${pageHtml}
                </div>
                <div class="page-footer">
                    <span class="page-number">CNK MAKİNE SANAYİ A.Ş.</span>
                    <span class="page-number">Sayfa ${index + 1} / ${pages.length}</span>
                </div>
            </div>
        `;
    });

    return fullHtml;
}
