# Uygulama simgelerini üretir (PWA: masaüstüne / ana ekrana eklenince görünen simge).
# Simge garanti belgesinin kapağıdır: koyu zemin, beyaz sayfa, solda tam boy kırmızı bant (Kırmızı Bant kapağı),
# ağır başlık çubuğu, kırmızı çizgi, metin satırları ve garanti mührü.
# Çalıştırmak için (Windows):  powershell -ExecutionPolicy Bypass -File tools/simge-uret.ps1

Add-Type -AssemblyName System.Drawing

$kok = Split-Path -Parent $PSScriptRoot
$hedef = Join-Path $kok 'assets/simge'
New-Item -ItemType Directory -Force $hedef | Out-Null

$zemin = [System.Drawing.ColorTranslator]::FromHtml('#14161b')
$kirmizi = [System.Drawing.ColorTranslator]::FromHtml('#ff0000')
$beyaz = [System.Drawing.ColorTranslator]::FromHtml('#ffffff')
$koyu = [System.Drawing.ColorTranslator]::FromHtml('#14161b')
$gri = [System.Drawing.ColorTranslator]::FromHtml('#c3c8d2')

function Yuvarlak([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  if ($r -le 0) { $p.AddRectangle((New-Object System.Drawing.RectangleF($x, $y, $w, $h))); return $p }
  $d = 2 * $r
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

# tamZemin: maskable ve iOS simgesi. Zemin tüm kareyi kaplar, sayfa güvenli alanın (ortadaki daire) içinde kalır.
function Ciz([int]$boy, [bool]$tamZemin, [string]$ad) {
  $bmp = New-Object System.Drawing.Bitmap($boy, $boy, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $s = [single]$boy
  if ($tamZemin) {
    $g.Clear($zemin)
    $sayfaH = 0.56 * $s
  } else {
    $tile = Yuvarlak 0 0 $s $s (0.22 * $s)
    $g.FillPath((New-Object System.Drawing.SolidBrush($zemin)), $tile)
    $sayfaH = 0.66 * $s
  }
  $sayfaW = $sayfaH / 1.414
  $px = ($s - $sayfaW) / 2
  $py = ($s - $sayfaH) / 2
  $sayfa = Yuvarlak $px $py $sayfaW $sayfaH ([Math]::Max(1, 0.025 * $sayfaH))
  $g.FillPath((New-Object System.Drawing.SolidBrush($beyaz)), $sayfa)

  # Kırmızı bant sayfanın köşelerine uysun diye sayfa şekliyle kırpılır
  $g.SetClip($sayfa)
  $bantW = 0.32 * $sayfaW
  $g.FillRectangle((New-Object System.Drawing.SolidBrush($kirmizi)), $px, $py, $bantW, $sayfaH)
  $g.ResetClip()

  $ic = 0.13 * $sayfaW
  $x0 = $px + $bantW + $ic
  $w = $sayfaW - $bantW - 2 * $ic
  $kucuk = $boy -lt 64

  # Ağır başlık çubuğu (model adı) ve altında kırmızı çizgi
  $baslikH = if ($kucuk) { 0.13 * $sayfaH } else { 0.085 * $sayfaH }
  $by = $py + 0.22 * $sayfaH
  $g.FillRectangle((New-Object System.Drawing.SolidBrush($koyu)), $x0, $by, $w, $baslikH)
  $cy = $by + $baslikH + 0.045 * $sayfaH
  $g.FillRectangle((New-Object System.Drawing.SolidBrush($kirmizi)), $x0, $cy, 0.55 * $w, [Math]::Max(1, 0.028 * $sayfaH))

  if (-not $kucuk) {
    # Bilgi satırları
    $sat = 0.03 * $sayfaH
    $ly = $cy + 0.095 * $sayfaH
    foreach ($oran in 1.0, 0.82, 0.92) {
      $g.FillRectangle((New-Object System.Drawing.SolidBrush($gri)), $x0, $ly, $oran * $w, $sat)
      $ly += 0.072 * $sayfaH
    }
    # Garanti mührü: sağ altta kırmızı halka ve içinde dolu daire
    $r = 0.095 * $sayfaH
    $mx = $x0 + $w - $r
    $my = $py + 0.80 * $sayfaH
    $kalem = New-Object System.Drawing.Pen($kirmizi, [single](0.022 * $sayfaH))
    $g.DrawEllipse($kalem, $mx - $r, $my - $r, 2 * $r, 2 * $r)
    $r2 = 0.045 * $sayfaH
    $g.FillEllipse((New-Object System.Drawing.SolidBrush($kirmizi)), $mx - $r2, $my - $r2, 2 * $r2, 2 * $r2)
  }

  $g.Dispose()
  $yol = Join-Path $hedef $ad
  $bmp.Save($yol, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("{0}: {1} px, {2:N1} KB" -f $ad, $boy, ((Get-Item $yol).Length / 1KB))
}

Ciz 512 $false 'simge-512.png'
Ciz 192 $false 'simge-192.png'
Ciz 512 $true 'simge-maskable-512.png'
Ciz 180 $true 'simge-apple-180.png'
Ciz 32 $false 'simge-32.png'
