$lib = "$PSScriptRoot"
$null = New-Item -ItemType Directory -Force -Path "$lib\bootstrap\css","$lib\bootstrap\js","$lib\fontawesome\css","$lib\fontawesome\webfonts","$lib\jquery"

$files = @(
  @{url="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";         out="$lib\bootstrap\css\bootstrap.min.css"},
  @{url="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";    out="$lib\bootstrap\js\bootstrap.bundle.min.js"},
  @{url="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";       out="$lib\fontawesome\css\all.min.css"},
  @{url="https://code.jquery.com/jquery-3.7.1.min.js";                                     out="$lib\jquery\jquery.min.js"}
)

# Font Awesome webfonts
$faFonts = @("fa-solid-900.woff2","fa-regular-400.woff2","fa-brands-400.woff2","fa-solid-900.ttf","fa-regular-400.ttf","fa-brands-400.ttf")
foreach ($font in $faFonts) {
  $files += @{url="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/$font"; out="$lib\fontawesome\webfonts\$font"}
}

$wc = New-Object System.Net.WebClient
foreach ($f in $files) {
  Write-Host "Downloading $($f.url)"
  try { $wc.DownloadFile($f.url, $f.out); Write-Host "  OK: $($f.out)" }
  catch { Write-Host "  FAILED: $_" }
}
$wc.Dispose()

# Fix webfont paths inside fontawesome CSS
$css = Get-Content "$lib\fontawesome\css\all.min.css" -Raw
$css = $css -replace '\.\./webfonts/', '/lib/fontawesome/webfonts/'
Set-Content "$lib\fontawesome\css\all.min.css" $css

Write-Host "All done."
