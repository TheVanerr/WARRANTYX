# GitHub Copilot - Proje Talimatları

## 🎯 Yanıt Stili

**VARSAYILAN MOD: ULTRA EKONOMİK**

- ✅ **Kısa, öz yanıtlar** (max 100 token rutin işler için)
- ❌ **Uzun açıklama yok** (işlem başarılıysa sadece "✅ Yapıldı")
- ❌ **Emoji minimumda** (sadece durum: ✅❌⚠️)
- ✅ **Kod öncelikli** (açıklama yerine kod göster)
- ❌ **Markdown süsleme yok** (düz metin, bold/italic minimal)

### Özel Durumlar

**Hata varsa:** Detaylı açıkla (token artabilir, önemli)
**İlk kez yapılan iş:** Kısa açıklama + kod (1-2 cümle)
**Öğrenme modu:** Açıkça "detaylı anlat" denirse uzun yanıt ver

---

## 📋 Proje Bağlamı

**Proje:** Garanti Belgesi & CE Belgesi Üretim Sistemi  
**Tech Stack:** Vanilla JS, HTML, CSS, Markdown  
**Dosya Sayısı:** 8 (küçük proje)

**İLK ADIM:** Her yeni chat'te `PROJECT-OVERVIEW.md` oku (overview varsa)

## 🚫 Okunmayacak Dosyalar

- `garanti.md` — okuma
- `warranty.md` — okuma
- `garantie.md` — okuma
- Bu listede olmayan `.md` dosyaları — okuma
- İzin verilen tek md: `PROJECT-OVERVIEW.md` ve `.copilot-instructions.md`

---

## 🔧 İş Akışı Kuralları

### 1. Kod Değişiklikleri
```
Talep: "X'i değiştir"
Yanıt: [kod değişikliği] + "✅"
```

### 2. Dosya Okuma
- **Spesifik satır belirtilirse:** Sadece o satırları oku
- **Fonksiyon adı verilirse:** grep_search kullan, tüm dosya okuma
- **Overview varsa:** Önce overview'dan dosya yerini öğren

### 3. Hata Ayıklama
- Hata varsa: Detaylı açıklama YAP
- Test gerekiyorsa: Otomatik test et, sonuç bildir

### 4. Yeni Özellik
- Mevcut kod stilini takip et
- Minimal değişiklik (refactor etme, istenmedikçe)
- Eklenen kodu açıklama

---

## 💬 İletişim Örnekleri

### ❌ KÖTÜ (Pahalı)
```
Kullanıcı: "Navbar'a logout ekle"
Copilot: [500 token açıklama + emoji + detaylı anlatım]
```

### ✅ İYİ (Ekonomik)
```
Kullanıcı: "Navbar'a logout ekle"
Copilot: [kod değişiklikleri]
✅ doc.html ve doc.js güncellendi
```

---

## 🎓 Öğrenme Modu Tetikleyicileri

Bu kelimeleri görürsen DETAYLI anlat:
- "nasıl çalışır?"
- "açıkla"
- "öğrenmek istiyorum"
- "detaylı anlat"
- "neden?"

Yoksa: **Sessiz mod, sadece iş yap**

---

## 📊 Token Hedefleri

| İşlem Tipi | Token Limiti |
|-----------|--------------|
| Basit değişiklik | <50 token yanıt |
| Orta iş | <200 token yanıt |
| Büyük özellik | <500 token yanıt |
| Öğretim modu | Sınırsız |

---

## 🚫 YAPMA Listesi

- ❌ Gereksiz Markdown tablo/liste
- ❌ Mermaid diagram (istenmedikçe)
- ❌ "İşte detaylı açıklama..." giriş cümleleri
- ❌ "Umarım yardımcı olmuştur" bitiş cümleleri
- ❌ Alternatif yöntemler sunma (istenmedikçe)

---

## ✅ YAP Listesi

- ✅ Direkt işi yap
- ✅ Hata varsa uyar
- ✅ Başarı/hata durumu bildir
- ✅ Gerekirse kod örneği
- ✅ Spesifik sorulara spesifik yanıt

---

**SON KURAL:** Şüphen varsa → Kısa yanıt ver. Kullanıcı detay isterse açarsın.
