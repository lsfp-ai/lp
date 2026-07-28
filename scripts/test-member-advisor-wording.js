"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "ideco-mirai-navi", "index.html"),
  "utf8"
);
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, "ideco-mirai-navi", "version.json"),
    "utf8"
  )
);

assert.equal(manifest.uiVersion, "v1.3.2");
assert.match(
  html,
  /運用に関するご判断は、担当の金融アドバイザーなどの専門家にご相談ください。/u
);
assert.match(
  html,
  /税・社会保険料・手数料は別途ご確認ください。/u
);
assert.match(
  html,
  /試算は<b>税・社会保険料・手数料を含まない簡易計算<\/b>です。/u
);
assert.match(
  html,
  /特定の商品・制度の<b>推奨や勧誘ではありません<\/b>。/u
);
assert.doesNotMatch(html, /担当FP・税理士等/u);
assert.doesNotMatch(html, /税理士等の専門家/u);

console.log("Member financial-advisor wording: PASS");
console.log("operationalAdvice=financial-advisor");
console.log("taxAccountantAsInvestmentAdvisor=0");
console.log("preservedDisclaimers=tax-social-fee,non-recommendation");
