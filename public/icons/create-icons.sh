#!/bin/bash
# 簡易的なPWAアイコン生成スクリプト
# ImageMagickがインストールされている場合に使用

# プレースホルダーとして空のPNGファイルを作成
# 実際のアイコンは後でデザインツールで作成
convert -size 192x192 xc:#3b82f6 -pointsize 72 -fill white -gravity center -annotate +0+0 "MH" icon-192x192.png 2>/dev/null || {
  # ImageMagickがない場合、Node.jsで最小限のPNGを生成
  echo "ImageMagick not found, creating placeholder files"
  # 最小限の1x1 PNG（後で置き換え）
  echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > icon-192x192.png
  echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > icon-512x512.png
}

convert -size 512x512 xc:#3b82f6 -pointsize 192 -fill white -gravity center -annotate +0+0 "MH" icon-512x512.png 2>/dev/null || true

echo "Icon placeholders created"
