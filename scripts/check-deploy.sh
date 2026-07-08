#!/usr/bin/env bash
#
# check-deploy.sh — 公開LPの反映を「実測」確認する（作成物3）
#
# 使い方:
#   scripts/check-deploy.sh <URL> [<URL> ...]
# 例:
#   scripts/check-deploy.sh https://lsfp-ai.github.io/lp/dc-taishoku/
#   scripts/check-deploy.sh https://lp.lsfp.co.jp/dc-taishoku/
#
# 検証内容（すべて実測。想定値は出力しない）:
#   1) 指定URLが HTTP 200 を返すか（実際のステータスコードを表示）
#   2) ページ内の相対リンク(href) / 画像(src) のリンク切れチェック（各先の実測ステータス）
#
# github.io / lp.lsfp.co.jp のどちらのURLでも動作する。
# 1つでも 200 以外があれば exit 1。

set -u

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <URL> [<URL> ...]" >&2
  exit 2
fi

# HTTPステータスを実測取得（本文は捨てる）
http_status() {
  curl -s -o /dev/null -w '%{http_code}' -L --max-time 20 "$1"
}

# URLに対する絶対URLへ相対パスを解決する
# 引数: base_url relative
resolve_url() {
  local base="$1" rel="$2"
  case "$rel" in
    http://*|https://*)
      printf '%s' "$rel" ;;                       # 既に絶対
    //*)
      printf 'https:%s' "$rel" ;;                 # scheme相対
    /*)
      # ルート相対: base の scheme://host を取り出して連結
      local origin
      origin=$(printf '%s' "$base" | sed -E 's#^(https?://[^/]+).*#\1#')
      printf '%s%s' "$origin" "$rel" ;;
    *)
      # ディレクトリ相対: base の末尾ファイル名を落としたディレクトリに連結
      local dir
      dir=$(printf '%s' "$base" | sed -E 's#[^/]*$##')
      printf '%s%s' "$dir" "$rel" ;;
  esac
}

overall_rc=0

for url in "$@"; do
  echo "=================================================="
  echo "TARGET: $url"
  echo "=================================================="

  status=$(http_status "$url")
  echo "  [page] HTTP $status  $url"
  if [ "$status" != "200" ]; then
    echo "  ✗ ページが 200 を返しません（実測: $status）"
    overall_rc=1
    continue
  fi
  echo "  ✓ ページ 200 OK"

  # 本文取得（相対リンク抽出用）
  body=$(curl -s -L --max-time 20 "$url")

  # href="..." / src="..." を抽出（シングル/ダブルクォート両対応）
  links=$(printf '%s' "$body" \
    | grep -oE '(href|src)=("[^"]*"|'"'"'[^'"'"']*'"'"')' \
    | sed -E 's/^(href|src)=//; s/^["'"'"']//; s/["'"'"']$//' \
    | grep -vE '^(#|mailto:|tel:|javascript:|data:)' \
    | sort -u)

  if [ -z "$links" ]; then
    echo "  (相対リンク・画像なし)"
    continue
  fi

  echo "  --- リンク/画像チェック ---"
  while IFS= read -r link; do
    [ -z "$link" ] && continue
    # フラグメントだけ除去
    clean=${link%%#*}
    [ -z "$clean" ] && continue
    target=$(resolve_url "$url" "$clean")
    lstatus=$(http_status "$target")
    if [ "$lstatus" = "200" ]; then
      echo "  ✓ HTTP $lstatus  $link"
    else
      echo "  ✗ HTTP $lstatus  $link  -> $target"
      overall_rc=1
    fi
  done <<< "$links"
done

echo "=================================================="
if [ "$overall_rc" -eq 0 ]; then
  echo "RESULT: 全チェック 200 OK（実測）"
else
  echo "RESULT: 200 以外を検出（上記 ✗ を参照）"
fi
exit "$overall_rc"
