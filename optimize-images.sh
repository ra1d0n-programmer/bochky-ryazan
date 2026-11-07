#!/bin/bash
# =====================================================
# Скрипт сжатия изображений для BOCHKY
# Требуется: jpegoptim, cwebp
#   Ubuntu/Debian: sudo apt install jpegoptim webp
#   macOS:         brew install jpegoptim webp
# =====================================================

set -e

IMG_DIR="images"

if [ ! -d "$IMG_DIR" ]; then
  echo "❌ Папка $IMG_DIR не найдена. Запустите скрипт из корня проекта."
  exit 1
fi

echo "📦 Вес ДО:"
du -sh "$IMG_DIR"

echo ""
echo "🖼  Сжимаем JPG (качество 82, без метаданных)..."
if command -v jpegoptim >/dev/null 2>&1; then
  jpegoptim --max=82 --strip-all --all-progressive "$IMG_DIR"/*.jpg "$IMG_DIR"/*.jpeg 2>/dev/null || true
  echo "   ✅ JPG сжаты"
else
  echo "   ⚠️  jpegoptim не установлен — пропускаем"
fi

echo ""
echo "🖼  Конвертируем PNG в WebP (качество 80)..."
if command -v cwebp >/dev/null 2>&1; then
  for f in "$IMG_DIR"/*.png; do
    [ -e "$f" ] || continue
    out="${f%.png}.webp"
    cwebp -q 80 "$f" -o "$out" >/dev/null 2>&1 || true
  done
  echo "   ✅ PNG → WebP готовы (рядом с оригиналами)"
else
  echo "   ⚠️  cwebp не установлен — пропускаем"
fi

echo ""
echo "🖼  Уменьшаем фоны галерей до 1200px по ширине..."
if command -v convert >/dev/null 2>&1; then
  for f in "$IMG_DIR"/gallery*.jpg "$IMG_DIR"/client*.jpg; do
    [ -e "$f" ] || continue
    convert "$f" -resize "1200x1200>" -quality 82 "$f" 2>/dev/null || true
  done
  echo "   ✅ Галереи уменьшены"
else
  echo "   ⚠️  imagemagick (convert) не установлен — пропускаем"
fi

echo ""
echo "📦 Вес ПОСЛЕ:"
du -sh "$IMG_DIR"

echo ""
echo "✅ Готово."
echo ""
echo "ℹ️  Не забудьте в index.html заменить .png на .webp для картинок,"
echo "    которые конвертировались (category1..5, payment и т.д.)."