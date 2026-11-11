# Uygulama simgelerini üretir (PWA: masaüstüne / ana ekrana eklenince görünen simge).
# Simge WarrantyX'in W harfidir: koyu zemin, ağır beyaz W, altında kapaktaki gibi kalın kırmızı çizgi.
# Çalıştırmak için (Windows):  powershell -ExecutionPolicy Bypass -File tools/simge-uret.ps1

Add-Type -AssemblyName System.Drawing

$kok = Split-Path -Parent $PSScriptRoot
$hedef = Join-Path $kok 'assets/simge'
New-Item -ItemType Directory -Force $hedef | Out-Null

$zemin = [System.Drawing.ColorTranslator]::FromHtml('#14161b')
$kirmizi = [System.Drawing.ColorTranslator]::FromHtml('#ff0000')
$beyaz = [System.Drawing.ColorTranslator]::FromHtml('#ffffff')

# Windows'ta en ağır yazı tipi; yoksa Segoe UI Bold, o da yoksa Arial Black
$aile = 'Arial Black'
foreach ($ad in 'Segoe UI Black', 'Segoe UI') {
  $f = New-Object System.Drawing.FontFamily($ad) -ErrorAction SilentlyContinue
  if ($f) { $aile = $ad; break }
}

function Yuvarlak([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = 2 * $r
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

# tamZemin: maskable ve iOS simgesi. Zemin tüm kareyi kaplar, W güvenli alanın (ortadaki daire) içinde kalır.
function Ciz([int]$boy, [bool]$tamZemin, [string]$ad) {
  $bmp = New-Object System.Drawing.Bitmap($boy, $boy, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $s = [single]$boy

  if ($tamZemin) {
    $g.Clear($zemin)
    $genislik = 0.50 * $s
  } else {
    $g.FillPath((New-Object System.Drawing.SolidBrush($zemin)), (Yuvarlak 0 0 $s $s (0.22 * $s)))
    $genislik = if ($boy -lt 64) { 0.80 * $s } else { 0.64 * $s }
  }

  # W'yi yol olarak çizer, gerçek sınırlarına göre ölçekleyip ortalar
  $yol = New-Object System.Drawing.Drawing2D.GraphicsPath
  $yol.AddString('W', (New-Object System.Drawing.FontFamily($aile)), [int][System.Drawing.FontStyle]::Bold, 100, (New-Object System.Drawing.PointF(0, 0)), [System.Drawing.StringFormat]::GenericTypographic)
  $b = $yol.GetBounds()
  $k = $genislik / $b.Width
  $wH = $b.Height * $k
  $cizgiH = [Math]::Max(2, 0.075 * $genislik)
  $ara = 0.09 * $genislik
  $toplam = $wH + $ara + $cizgiH
  $x0 = ($s - $genislik) / 2
  $y0 = ($s - $toplam) / 2

  $m = New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate($x0, $y0)
  $m.Scale($k, $k)
  $m.Translate(-$b.X, -$b.Y)
  $yol.Transform($m)
  $g.FillPath((New-Object System.Drawing.SolidBrush($beyaz)), $yol)

  # Kırmızı çizgi: W'nin altında, W genişliğinin yarısı, ortada
  $cw = 0.5 * $genislik
  $g.FillRectangle((New-Object System.Drawing.SolidBrush($kirmizi)), ($s - $cw) / 2, $y0 + $wH + $ara, $cw, $cizgiH)

  $g.Dispose()
  $dosya = Join-Path $hedef $ad
  $bmp.Save($dosya, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("{0}: {1} px, {2:N1} KB ({3})" -f $ad, $boy, ((Get-Item $dosya).Length / 1KB), $aile)
}

Ciz 512 $false 'simge-512.png'
Ciz 192 $false 'simge-192.png'
Ciz 512 $true 'simge-maskable-512.png'
Ciz 180 $true 'simge-apple-180.png'
Ciz 32 $false 'simge-32.png'
