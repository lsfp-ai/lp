#!/usr/bin/env bash
#
# install-hooks.sh — このリポジトリの git フックを有効化する（一度だけ実行）。
# .githooks/ をフックパスに設定し、pre-commit の個人情報スキャンを有効にする。

set -eu
repo_root=$(git rev-parse --show-toplevel)
chmod +x "$repo_root/.githooks/pre-commit" \
         "$repo_root/scripts/scan-personal-info.sh" \
         "$repo_root/scripts/check-links-static.sh" \
         "$repo_root/scripts/check-deploy.sh" 2>/dev/null || true
git config core.hooksPath .githooks
echo "✓ git hooks 有効化（core.hooksPath=.githooks）。pre-commit で個人情報スキャンが走ります。"
