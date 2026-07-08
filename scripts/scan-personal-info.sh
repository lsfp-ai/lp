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
PATTERNS=(
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'   # メールアドレス
  '0[0-9]{1,3}-[0-9]{1,4}-[0-9]{4}'                    # 電話番号
  '[一-龥ぁ-んァ-ヶ]{1,5}(様|さま)'                     # 氏名＋敬称（○○様）
  '(生年月日|口座番号|残高|マイナンバー|保険証番号|印鑑|続柄|世帯年収)'  # 個人情報キーワード
  '[0-9]{7,}'                                          # 7桁以上の連続数字（口座/証券番号等）
)

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
hit=0
for pat in "${PATTERNS[@]}"; do
  # grep -n -E: 行番号付き。ヒットしたら表示。
  if out=$(grep -nEH "$pat" "${files[@]}" 2>/dev/null); then
    echo "  ✗ パターン検出: /$pat/"
    printf '%s\n' "$out" | sed 's/^/     /'
    hit=1
  fi
done

echo "=================================================="
if [ "$hit" -eq 0 ]; then
  echo "RESULT: 個人情報パターンの検出なし（公開して安全）"
  exit 0
else
  echo "RESULT: 個人情報の疑いを検出。公開を中止し、内容を確認してください。"
  echo "        誤検出（規則文・サンプル）なら該当箇所を修正するか、"
  echo "        本当に公開して良い内容か CLAUDE.md 禁止ルールと照合すること。"
  exit 1
fi
