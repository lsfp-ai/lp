# lp リポジトリ 運用ルール（作成物2）

このリポジトリは **一般公開LP専用**。GitHub Pages で誰でも閲覧できる場所に公開される。

## 目的

- 株式会社LSFP の一般公開ランディングページ（LP）を **1リポジトリに集約**してホスティングする。
- 各LPはサブフォルダに分ける（例：`dc-taishoku/`、`idecoplus/`）。
- 公開URL（第1段階）：`https://lsfp-ai.github.io/lp/<LP名>/`
- 公開URL（第2段階・後日）：`https://lp.lsfp.co.jp/<LP名>/`

## 🚫 禁止事項（最重要・例外なし）

このリポジトリは**世界中の誰でも閲覧できる**。以下を**絶対に置かない**。

- 顧客名・顧客固有データ・顧客資料
- 個人情報（氏名・住所・生年月日・連絡先・口座情報・保有商品・残高等）
- 個別シミュレーション結果（特定個人・特定世帯の試算）
- 社内運用情報（照会先社名・担当者名・照会日・内部運用予定・secrets・token・env値）

**新規HTMLを追加する前に、必ず内容を目視＋grepで点検し、上記が含まれる場合は追加を中止する。**
迷ったら追加しない。公開して良いか不明なものは公開しない。

## 命名規則

- LP名は **英小文字・ハイフン区切り**（例：`dc-taishoku`、`idecoplus`）。
- 各LPは `<LP名>/index.html` として**サブフォルダのルート**に配置する。
- 画像等の付属ファイルは同じ `<LP名>/` フォルダ内に置く（相対パス参照）。

## 公開ワークフロー

[PUBLISH.md](PUBLISH.md) の定型手順に従う。要点：

1. Claude Design で `Export → Standalone HTML` を選び、単一HTMLを取得。
2. `lp/<LP名>/index.html` として配置（画像等が別ファイルなら同フォルダに）。
3. **個人情報が含まれないことを確認**（上の禁止ルールと照合）。
4. commit & push。
5. `scripts/check-deploy.sh <URL>` で反映を**実測確認**（想定値でなく実際のステータスコード）。
6. 初回のみ GitHub の Settings → Pages で Pages が有効か確認。

## 機械ガード（禁止ルールを人の注意でなく機械で守る）

このリポジトリの禁止ルール（顧客情報を公開しない）は、文書だけでなく機械で強制する。

- **pre-commit フック**：commit時に個人情報パターン（メール／電話／氏名+敬称／口座・残高等キーワード／長い数字列）を検出したら commit を止める。有効化は最初に一度だけ `bash scripts/install-hooks.sh` を実行（`core.hooksPath=.githooks`）。
- **GitHub Actions（`.github/workflows/guard.yml`）＝本丸**：push / PR のたびにサーバ側で `scan-personal-info.sh`（個人情報スキャン）と `check-links-static.sh`（内部リンク切れ検査）を回す。**サーバ側なので `--no-verify` では飛ばせない。** 失敗すれば main 反映＝公開をブロックする。
- スクリプト：`scripts/scan-personal-info.sh`（個人情報）／`scripts/check-links-static.sh`（デプロイ前の内部リンク実在検査）／`scripts/check-deploy.sh`（デプロイ後のライブ200実測）。
- ルール文書（CLAUDE.md / README.md / PUBLISH.md）とスクリプト・CIは「口座情報」等を規則文として含むためスキャン対象外。

## 公開フロー（直pushでなくPRゲート推奨）

1. 作業ブランチを切る（main直pushはしない）。
2. PRを出す → GitHub Actions（guard）が自動で個人情報・リンクを検査。**緑になるまで公開しない。**
3. 内容と検査結果を加藤さんが確認 → GO。
4. merge で main に入り、GitHub Pages が公開。
5. `scripts/check-deploy.sh <URL>` でライブ200を実測。

## 検証の原則

- 「完了しました」報告は**実測ログ添付**が必須。想定・推測での完了報告は事故として扱う（LSFP開発規範）。
- エラーは隠さず報告する。
