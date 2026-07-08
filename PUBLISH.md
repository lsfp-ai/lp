# 公開ワークフロー手順書（作成物4）

Claude Design で作った HTML を一般公開する定型手順。

## 手順

1. **HTML取得**：Claude Design で `Export → Standalone HTML` を選び、単一HTMLファイルを取得する。
2. **配置**：`lp/<LP名>/index.html` として配置する。
   - `<LP名>` は英小文字・ハイフン区切り（例：`dc-taishoku`）。
   - 画像等が別ファイルなら、同じ `<LP名>/` フォルダ内に置き、HTMLからは相対パスで参照する。
3. **個人情報チェック（必須）**：追加するHTML・付属ファイルに、顧客名・個人情報・個別シミュレーション・社内運用情報が含まれないことを目視＋grepで確認する。含まれる場合は追加を中止する（[CLAUDE.md](CLAUDE.md) の禁止ルール）。
   ```sh
   # 例：疑わしい語のざっくり検出（ヒットしたら中身を確認）
   grep -rniE '様|さん|生年月日|口座|残高|@.+\.(co\.jp|com)' lp/<LP名>/
   ```
4. **commit & push**：
   ```sh
   git add lp/<LP名>/
   git commit -m "add LP: <LP名>"
   git push
   ```
5. **反映を実測確認**：
   ```sh
   scripts/check-deploy.sh https://lsfp-ai.github.io/lp/<LP名>/
   ```
   実際のステータスコード（200）とリンク切れ有無を確認する。反映には push 後 数十秒〜数分かかることがある。
6. **初回のみ**：GitHub の Settings → Pages で、このリポジトリの Pages が有効（Source: Deploy from a branch / `main` / `/root`）になっているか確認する。

## 注意

- 想定値での「完了」報告は禁止。手順5の**実測出力**を残すこと。
- カスタムドメイン（第2段階）は運用が固まってから。README/CLAUDE.md 記載の手順に従う。
