#!/usr/bin/env bash
#
# scan-personal-info.sh — 公開LPに個人情報・顧客情報が混入していないか機械チェックする
#
# 使い方:
#   scripts/scan-personal-info.sh [<対象パス> ...]   # 省略時はリポジトリ全体
#
# 検出したら該当箇所(ファイル:行:内容)を表示し exit 1 で止める。
# pre-commit フックと GitHub Actions の両方から呼ぶ共通スキャナ。
#
# ⚠️ このリポジトリは一般公開専用。顧客名・個人情報・個別シミュレーションは
#    絶対に置かない（CLAUDE.md 禁止ルール）。本スクリプトはその機械ガード。

set -u

# スキャン対象の拡張子（公開されるコンテンツ）
INCLUDE_EXT='html|htm|css|js|json|txt|csv|svg'

# 除外パス（ルール文書・スクリプト・CIは「口座情報」等の語を規則文として含むため対象外）
EXCLUDE_REGEX='(^|/)(\.git|\.github|scripts|node_modules)/|(^|/)(CLAUDE|README|PUBLISH)\.md$'

targets=("$@")
if [ "${#targets[@]}" -eq 0 ]; then
  targets=(".")
fi

# 検出パターン（高シグナルのものに絞る）
#  - メールアドレス / 電話番号 / 名前+敬称 / 個人情報キーワード / 口座番号らしき数字列
YOUSAMA_PAT='[一-龥ぁ-んァ-ヶ]{1,5}(様|さま)'          # 氏名＋敬称（○○様）
# 汎用敬称（特定個人でない）は誤検出なので除外する
GENERIC_HONORIFIC='^(お客様|お客さま|皆様|皆さま|みなさま|みな様|各位|関係者様|ご担当者様|担当者様|会員様|参加者様|受講者様|読者様|利用者様)$'
# ハード検出パターン（検出したら公開をブロックする、確実性の高いもの）
PATTERNS=(
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'   # メールアドレス
  '(^|[^0-9])0[0-9]{1,3}-[0-9]{1,4}-[0-9]{4}([^0-9]|$)' # 電話番号
  '(生年月日|口座番号|マイナンバー|保険証番号|世帯年収|続柄)'  # 個人情報キーワード
  '[0-9]{7,}'                                          # 7桁以上の連続数字（口座/証券番号等）
)
# 氏名＋敬称（○○様/さま）は正規表現の精度が出ないため「要目視の警告」扱い（ブロックしない）。YOUSAMA_PAT は soft 検出で使用。

# 対象ファイル一覧を作る（拡張子で絞り、除外パスを外す）
# ※ macOS の bash 3.2 には mapfile が無いので while-read で収集する（CIと両対応）
files=()
while IFS= read -r f; do
  [ -n "$f" ] && files+=("$f")
done < <(
  for t in "${targets[@]}"; do
    if [ -f "$t" ]; then echo "$t";
    else find "$t" -type f 2>/dev/null; fi
  done \
    | grep -E "\.(${INCLUDE_EXT})$" \
    | grep -vE "$EXCLUDE_REGEX" \
    | sort -u
)

if [ "${#files[@]}" -eq 0 ]; then
  echo "スキャン対象ファイルなし（公開コンテンツ）。"
  exit 0
fi

echo "個人情報スキャン: ${#files[@]} ファイルを検査"
hit=0     # ハード検出（確実な個人情報）＝公開ブロック
warn=0    # 氏名らしき語＝要目視（ブロックしない）
for f in "${files[@]}"; do
  # 検査は「実際に表示されるテキスト」に対して行う（誤検出防止）。
  # <script>/<style>（画像アセットJSON等）・data URI・HTMLタグ・長いbase64を除去してから検査する。
  sanitized=$(perl -0777 -pe 's{<script\b.*?</script>}{}gis; s{<style\b.*?</style>}{}gis; s{data:[a-zA-Z0-9.+/;=-]*base64,[A-Za-z0-9+/=]+}{}g; s{<[^>]+>}{ }g; s{[A-Za-z0-9+/]{200,}={0,2}}{}g' "$f" 2>/dev/null)
  [ -z "$sanitized" ] && sanitized=$(cat "$f")

  # --- ハード検出：確実な個人情報（検出したら公開ブロック・exit 1） ---
  for pat in "${PATTERNS[@]}"; do
    matches=$(printf '%s' "$sanitized" | grep -oE "$pat" 2>/dev/null | sort -u)
    matches=$(printf '%s\n' "$matches" | grep -vE '^[[:space:]]*$' || true)
    if [ -n "$matches" ]; then
      echo "  ✗ [$f] 個人情報パターン /$pat/:"
      printf '%s\n' "$matches" | head -20 | sed 's/^/     /'
      hit=1
    fi
  done

  # --- 軟検出：氏名らしき語（○○様/さま）。精度が出ないためブロックせず「要目視」警告 ---
  names=$(printf '%s' "$sanitized" \
    | perl -CSD -Mutf8 -ne 'while(/([\p{Han}\p{Hiragana}\p{Katakana}]{1,4}(?:様|さま))/g){print "$1\n"}' 2>/dev/null \
    | sort -u | grep -vE "$GENERIC_HONORIFIC" || true)
  names=$(printf '%s\n' "$names" | grep -vE '^[[:space:]]*$' || true)
  if [ -n "$names" ]; then
    echo "  ⚠ [$f] 氏名らしき語（要目視・自動ブロックはしない）:"
    printf '%s\n' "$names" | head -20 | sed 's/^/     /'
    warn=1
  fi
done

echo "=================================================="
if [ "$hit" -ne 0 ]; then
  echo "RESULT: 個人情報の疑いを検出。公開を中止し、内容を確認してください。"
  echo "        誤検出（規則文・サンプル）なら該当箇所を修正するか、"
  echo "        本当に公開して良い内容か CLAUDE.md 禁止ルールと照合すること。"
  exit 1
elif [ "$warn" -ne 0 ]; then
  echo "RESULT: 確実な個人情報の検出なし。ただし氏名らしき語あり＝公開前に目視で確認すること（⚠上記）。"
  exit 0
else
  echo "RESULT: 個人情報パターンの検出なし（公開して安全）"
  exit 0
fi
