"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs
  .readFileSync(path.join(root, "ideco-mirai-navi/mn1_member_encoder.js"), "utf8")
  .trimEnd();
const html = fs.readFileSync(path.join(root, "ideco-mirai-navi/index.html"), "utf8");
const begin = "<!-- MN1_MEMBER_ENCODER_BEGIN -->";
const end = "<!-- MN1_MEMBER_ENCODER_END -->";
const uiBegin = "// MN1_MEMBER_TRANSFER_UI_BEGIN";
const uiEnd = "// MN1_MEMBER_TRANSFER_UI_END";

assert.equal(html.split(begin).length - 1, 1, "one encoder begin marker");
assert.equal(html.split(end).length - 1, 1, "one encoder end marker");
const generated = html.slice(html.indexOf(begin) + begin.length, html.indexOf(end)).trim();
assert.ok(generated.startsWith("<script>"), "generated script start");
assert.ok(generated.endsWith("</script>"), "generated script end");
assert.equal(
  generated.slice("<script>".length, -"</script>".length).trim(),
  source,
  "embedded member encoder must match canonical source"
);

assert.equal(html.split(uiBegin).length - 1, 1, "one transfer UI begin marker");
assert.equal(html.split(uiEnd).length - 1, 1, "one transfer UI end marker");
const transferUi = html.slice(html.indexOf(uiBegin), html.indexOf(uiEnd) + uiEnd.length);
assert.match(transferUi, /MN1MemberEncoder\.encodeEnvelope/u);

for (const forbidden of [
  "localStorage",
  "sessionStorage",
  "fetch(",
  "XMLHttpRequest",
  "navigator.sendBeacon",
]) {
  assert.equal(source.includes(forbidden), false, `encoder side effect: ${forbidden}`);
  assert.equal(transferUi.includes(forbidden), false, `transfer UI side effect: ${forbidden}`);
}

for (const forbiddenHtmlSink of [".innerHTML", "insertAdjacentHTML", "document.write"]) {
  assert.equal(
    transferUi.includes(forbiddenHtmlSink),
    false,
    `transfer UI HTML injection sink: ${forbiddenHtmlSink}`
  );
}

console.log("MN1 member integration verification: PASS");
console.log("embeddedEncoderMatchesCanonical=true");
console.log("memberTransferStorageOrNetworkSideEffects=0");
console.log("memberTransferDynamicHtmlSinks=0");
