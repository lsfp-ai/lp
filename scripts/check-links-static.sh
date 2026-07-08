#!/usr/bin/env bash
#
# check-links-static.sh — 公開前に内部リンク・画像パスの切れを「ファイルの実在」で検査する
#
# 使い方:
#   scripts/check-links-static.sh            # リポジトリ内の全 index.html を検査
#   scripts/check-links-static.sh <file.html> ...
#
# check-deploy.sh はライブURLの200を実測する（デプロイ後）。
# 本スクリプトはデプロイ前（CI/PR）に、相対リンク先のファイルが存在するかを静的に検査する。
# 外部URL(http/https)・mailto・tel・#アンカー・data: はスキップ。

set -u

targets=("$@")
if [ "${#targets[@]}" -eq 0 ]; then
  # ※ macOS の bash 3.2 に mapfile が無いので while-read で収集（CIと両対応）
  targets=()
  while IFS= read -r f; do
    [ -n "$f" ] && targets+=("$f")
  done < <(find . -type f -name '*.html' -not -path './.git/*' | sort)
fi

if [ "${#targets[@]}" -eq 0 ]; then
  echo "HTMLファイルなし。"
  exit 0
fi

rc=0
for html in "${targets[@]}"; do
  [ -f "$html" ] || continue
  dir=$(dirname "$html")
  echo "検査: $html"

  # href/src を抽出（外部・特殊スキームを除外）
  links=$(grep -oE '(href|src)=("[^"]*"|'"'"'[^'"'"']*'"'"')' "$html" \
    | sed -E 's/^(href|src)=//; s/^["'"'"']//; s/["'"'"']$//' \
    | grep -vE '^(https?:|//|#|mailto:|tel:|javascript:|data:)' \
    | sort -u)

  [ -z "$links" ] && { echo "  (内部リンクなし)"; continue; }

  while IFS= read -r link; do
    [ -z "$link" ] && continue
    clean=${link%%#*}          # アンカー除去
    clean=${clean%%\?*}        # クエリ除去
    [ -z "$clean" ] && continue
    # ディレクトリ相対で解決
    target="$dir/$clean"
    # 末尾 / のディレクトリ参照は index.html を見る
    case "$clean" in
      */) target="${target}index.html" ;;
    esac
    # ルート相対(/...)はリポジトリルート基準
    case "$clean" in
      /*) target=".${clean}"; [ "${clean: -1}" = "/" ] && target="${target}index.html" ;;
    esac
    if [ -e "$target" ]; then
      echo "  ✓ $link"
    else
      echo "  ✗ リンク切れ: $link  (期待ファイル: $target が存在しない)"
      rc=1
    fi
  done <<< "$links"
done

echo "=================================================="
if [ "$rc" -eq 0 ]; then
  echo "RESULT: 内部リンク切れなし"
else
  echo "RESULT: 内部リンク切れを検出（上記 ✗）"
fi
exit "$rc"
