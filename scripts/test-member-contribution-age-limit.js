"use strict";
// 掛金は加入可能年齢（70歳未満）までで止める（2026-11-04 計算監査 H-1／再現契約MN5）。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const encoder = require("../ideco-mirai-navi/mn1_member_encoder.js");
const html = fs.readFileSync(path.join(__dirname, "../ideco-mirai-navi/index.html"), "utf8");

assert.equal(encoder.CONTRACT, "MN5");
assert.equal(encoder.ENGINE_VERSION, "v28");
assert.equal(encoder.CONTRIBUTION_AGE_LIMIT, 70);
for (const [drawAge, endAge] of [[60, 60], [65, 65], [70, 70], [71, 70], [74, 70], [75, 70]]) {
  assert.equal(encoder.contributionEndAge(drawAge), endAge, `drawAge ${drawAge}`);
}
// 画面の計算設定と「これからの掛金」が同じ規則を使う（取崩開始年齢をそのまま積立終了にしない）
assert.match(html, /endAge:MN1MemberEncoder\.contributionEndAge\(drawAge\)/u);
assert.match(html, /const contribMonths=Math\.max\(0,\(MN1MemberEncoder\.contributionEndAge\(drawAge\)-age\)\*12\);/u);
assert.match(html, /futureNomYen=mon\*1e4\*contribMonths/u);
assert.doesNotMatch(html, /endAge:drawAge,mu:styleMu/u);
assert.doesNotMatch(html, /futureNomYen=mon\*1e4\*dY\*12/u);
assert.match(html, /D\.drawAge>MN1MemberEncoder\.CONTRIBUTION_AGE_LIMIT/u);
console.log("member contribution age limit: PASS limit=70 contract=MN5/v28");
