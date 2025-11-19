# Generates PWA and favicon images from a source image (brand-logo.png or brand-logo.svg)
# Usage: Open PowerShell in project root and run: .\scripts\generate-icons.ps1

$srcPng = "public\brand-logo.png"
$srcSvg = "public\brand-logo.svg"
$iconsDir = "public\icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

if (Test-Path $srcSvg) {
    Write-Host "Found SVG source: $srcSvg"
    magick convert -background none $srcSvg -resize 192x192 $iconsDir\icon-192.png
    magick convert -background none $srcSvg -resize 512x512 $iconsDir\icon-512.png
    magick convert -background none $srcSvg -resize 180x180 public\apple-touch-icon.png
    magick convert -background none $srcSvg -define icon:auto-resize=64,48,32,16 public\favicon.ico
} elseif (Test-Path $srcPng) {
    Write-Host "Found PNG source: $srcPng"
    magick convert $srcPng -resize 192x192^ -gravity center -extent 192x192 $iconsDir\icon-192.png
    magick convert $srcPng -resize 512x512^ -gravity center -extent 512x512 $iconsDir\icon-512.png
    magick convert $srcPng -resize 180x180^ -gravity center -extent 180x180 public\apple-touch-icon.png
    magick convert $srcPng -define icon:auto-resize=64,48,32,16 public\favicon.ico
} else {
    Write-Error "No source image found. Please add either `public/brand-logo.png` or `public/brand-logo.svg` and re-run this script."
}

Write-Host "Icon generation finished. Check public/ and public/icons/ for generated files."