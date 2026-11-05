"use strict";
// 対象は会社員（iDeCo＋・企業型DC）で、自営業など国民年金第1号の掛金上限には対応しないことを画面に明記する（2026-11-04 監査L-2）。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "../ideco-mirai-navi/index.html"), "utf8");
assert.match(html, /id="schemeScopeHint"[^>]*>※ この試算は会社員（iDeCo＋・企業型DC）向けです。自営業など国民年金第1号の方の掛金上限（月6\.8万円など）には対応していません。<\/div>/u);
// 制度区分は3つだけ（第1号の区分を足していない）
assert.equal((html.match(/data-scheme="/gu) || []).length, 3);
console.log("member scope wording: PASS");
