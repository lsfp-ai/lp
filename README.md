# lp — 株式会社LSFP 一般公開LP集約リポジトリ

一般公開のランディングページ（LP）を 1 リポジトリに集約し、GitHub Pages でホスティングする。

## 公開URL

- 第1段階（現行）：`https://lsfp-ai.github.io/lp/<LP名>/`
- 第2段階（後日・カスタムドメイン）：`https://lp.lsfp.co.jp/<LP名>/`

## LP一覧

| LP名 | パス | 公開URL（第1段階） | 状態 |
|---|---|---|---|
| DC退職金の受け取り方 | `dc-taishoku/` | https://lsfp-ai.github.io/lp/dc-taishoku/ | 雛形（疎通確認用プレースホルダ） |
| iDeCo+導入支援 | `idecoplus/` | https://lsfp-ai.github.io/lp/idecoplus/ | 公開中（LINE CTA接続済） |
| DC退職コンサルサポート実務講座 | `dc-exit-course/` | https://lsfp-ai.github.io/lp/dc-exit-course/ | 公開中（LINE CTA接続済・軽量静的版） |

## ⚠️ このリポジトリは一般公開専用

顧客名・個人情報・個別シミュレーションは**絶対に置かない**。詳細は [CLAUDE.md](CLAUDE.md) の禁止事項を参照。

## 運用

- LPの追加手順：[PUBLISH.md](PUBLISH.md)
- デプロイ確認：`scripts/check-deploy.sh <URL>`
