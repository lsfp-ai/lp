#!/usr/bin/env bash

set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
scanner="$repo_root/scripts/scan-personal-info.sh"
fixture_dir=$(mktemp -d)
trap 'rm -rf "$fixture_dir"' EXIT

checksum='8b72d2e3ad0b2c60caa3148e108778800a430358459d263b50f78ad73478159a'
git_sha='108c08f8f73855fb662d0dc7d0068884a7c7a3df'
numeric_id='1234567890123456789012345678901234567890123456789012345678901234'

printf '{"calculationCoreSha256":"%s"}\n' "$checksum" > "$fixture_dir/allowed-checksum.json"
printf '{"previousBaselineCommit":"%s"}\n' "$git_sha" > "$fixture_dir/allowed-git-sha.json"
printf '{"customerIdentifier":"%s"}\n' "$numeric_id" > "$fixture_dir/blocked-numeric-id.json"
printf '{"otherValue":"%s"}\n' "$checksum" > "$fixture_dir/blocked-other-value.json"
printf '{"otherCommit":"%s"}\n' "$git_sha" > "$fixture_dir/blocked-other-git-sha.json"

bash "$scanner" "$fixture_dir/allowed-checksum.json" >/dev/null
bash "$scanner" "$fixture_dir/allowed-git-sha.json" >/dev/null

if bash "$scanner" "$fixture_dir/blocked-numeric-id.json" >/dev/null 2>&1; then
  echo "64桁の数字IDを見逃しました。"
  exit 1
fi

if bash "$scanner" "$fixture_dir/blocked-other-value.json" >/dev/null 2>&1; then
  echo "SHA-256項目以外の長い値を見逃しました。"
  exit 1
fi

if bash "$scanner" "$fixture_dir/blocked-other-git-sha.json" >/dev/null 2>&1; then
  echo "基準commit項目以外のGit SHAを見逃しました。"
  exit 1
fi

echo "Personal information scanner regression: PASS"
echo "allowedNamedSha256=1"
echo "allowedNamedGitSha=1"
echo "blocked64DigitIdentifier=1"
echo "blockedSameValueOutsideSha256Field=1"
echo "blockedSameGitShaOutsideBaselineField=1"
