"use strict";
// 60歳以降の掛金には加入の条件がある（2026年12月施行・厚労省資料）。試算は条件を満たす前提なので、画面に注記する。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "../ideco-mirai-navi/index.html"), "utf8");
assert.match(html, /if\(MN1MemberEncoder\.contributionEndAge\(D\.drawAge\)>60&&D\.futureNomYen>0\)\{/u, "shown only when deposits continue past 60");
assert.ok(html.includes("60歳以降もiDeCoの掛金を積み立てるには、老齢基礎年金やiDeCoの老齢給付金を受け取っていないことなどの条件があります（2026年12月施行の改正で70歳未満まで。条件は働き方によって異なります）。この試算は、条件を満たして積み立てを続ける前提で計算しています。"), "60+ condition wording");
assert.doesNotMatch(html, /マッチング拠出もしていない/u, "do not state the matching condition as universal");
console.log("member 60+ note: PASS");
