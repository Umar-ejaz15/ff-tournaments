Place your high-resolution logo file in `public/` (for example `public/brand-logo.png` or `public/brand-logo.svg`). Then generate the required app icons and `favicon.ico` using ImageMagick (Windows PowerShell examples below).

Recommended filenames (these are referenced by `manifest.json` and `app/layout.tsx`):
- `public/favicon.ico` (multi-size ICO)
- `public/icons/icon-192.png` (192x192 PNG, maskable)
- `public/icons/icon-512.png` (512x512 PNG, maskable)
- `public/apple-touch-icon.png` (180x180 PNG)

PowerShell / ImageMagick commands (run from the project root):

# If your source is a PNG (high-res):
magick convert public/brand-logo.png -resize 192x192^ -gravity center -extent 192x192 public\icons\icon-192.png
magick convert public/brand-logo.png -resize 512x512^ -gravity center -extent 512x512 public\icons\icon-512.png
magick convert public/brand-logo.png -resize 180x180^ -gravity center -extent 180x180 public\apple-touch-icon.png
magick convert public/brand-logo.png -define icon:auto-resize=64,48,32,16 public\favicon.ico

# If your source is an SVG (recommended for best quality), rasterize at desired sizes:
magick convert -background none public/brand-logo.svg -resize 192x192 public\icons\icon-192.png
magick convert -background none public/brand-logo.svg -resize 512x512 public\icons\icon-512.png
magick convert -background none public/brand-logo.svg -resize 180x180 public\apple-touch-icon.png
magick convert -background none public/brand-logo.svg -define icon:auto-resize=64,48,32,16 public\favicon.ico

Notes:
- The `-gravity center -extent` ensures square output without stretching by cropping/padding if necessary.
- For a maskable PWA icon, prefer a square PNG with transparent background and safe margins.
- If you prefer an online tool, sites like https://realfavicongenerator.net/ produce all sizes and provide markup.

After adding the files, `manifest.json` and `app/layout.tsx` are already configured to reference these filenames. If you want, I can also add a small script to `package.json` to generate icons automatically (requires ImageMagick installed).