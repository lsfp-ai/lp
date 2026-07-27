"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { TextEncoder } = require("node:util");
const encoder = require("../ideco-mirai-navi/mn1_member_encoder.js");

const envelope = {
  contract: "MN4",
  engine: "v27",
  inputs: {
    scheme: "unknown",
    limit62: false,
    age: 45,
    balanceWan: 500,
    monthlyWan: 2,
    drawAge: 65,
    maxAge: 95,
    caseId: "B",
    inflationPct: 2,
    desiredMonthlyWan: 15,
    spendMode: "keep",
    targetPct: 80,
    muPct: 7,
    sigmaPct: 15,
  },
  expected: {
    totalNominalWan: 980,
    totalRealWan: 896,
    startBalanceNominalWan: 2236,
    startBalanceRealWan: 1505,
    depletionAgeP40: 81,
    desiredMonthlyRealWan: 10.1,
    affordableNominalWanRange: [6, 6.5],
    affordableRealWanRange: [4, 4.5],
    desiredSurvivalPctRange: [32, 38],
    feasibleAllSeeds: true,
  },
};

const golden =
  "MN4.eyJjb250cmFjdCI6Ik1ONCIsImVuZ2luZSI6InYyNyIsImlucHV0cyI6eyJzY2hlbWUiOiJ1bmtub3duIiwibGltaXQ2MiI6ZmFsc2UsImFnZSI6NDUsImJhbGFuY2VXYW4iOjUwMCwibW9udGhseVdhbiI6MiwiZHJhd0FnZSI6NjUsIm1heEFnZSI6OTUsImNhc2VJZCI6IkIiLCJpbmZsYXRpb25QY3QiOjIsImRlc2lyZWRNb250aGx5V2FuIjoxNSwic3BlbmRNb2RlIjoia2VlcCIsInRhcmdldFBjdCI6ODAsIm11UGN0Ijo3LCJzaWdtYVBjdCI6MTV9LCJleHBlY3RlZCI6eyJ0b3RhbE5vbWluYWxXYW4iOjk4MCwidG90YWxSZWFsV2FuIjo4OTYsInN0YXJ0QmFsYW5jZU5vbWluYWxXYW4iOjIyMzYsInN0YXJ0QmFsYW5jZVJlYWxXYW4iOjE1MDUsImRlcGxldGlvbkFnZVA0MCI6ODEsImRlc2lyZWRNb250aGx5UmVhbFdhbiI6MTAuMSwiYWZmb3JkYWJsZU5vbWluYWxXYW5SYW5nZSI6WzYsNi41XSwiYWZmb3JkYWJsZVJlYWxXYW5SYW5nZSI6WzQsNC41XSwiZGVzaXJlZFN1cnZpdmFsUGN0UmFuZ2UiOlszMiwzOF0sImZlYXNpYmxlQWxsU2VlZHMiOnRydWV9fQ.d89ee3d5";

assert.match(golden, /^MN4\./u, "Node encode uses the MN4 transfer contract");
assert.equal(encoder.encodeEnvelope(envelope), golden, "Node golden encode");
const flatEnvelope = {
  ...envelope,
  inputs: { ...envelope.inputs, spendMode: "flat" },
};
const flatGolden =
  "MN4.eyJjb250cmFjdCI6Ik1ONCIsImVuZ2luZSI6InYyNyIsImlucHV0cyI6eyJzY2hlbWUiOiJ1bmtub3duIiwibGltaXQ2MiI6ZmFsc2UsImFnZSI6NDUsImJhbGFuY2VXYW4iOjUwMCwibW9udGhseVdhbiI6MiwiZHJhd0FnZSI6NjUsIm1heEFnZSI6OTUsImNhc2VJZCI6IkIiLCJpbmZsYXRpb25QY3QiOjIsImRlc2lyZWRNb250aGx5V2FuIjoxNSwic3BlbmRNb2RlIjoiZmxhdCIsInRhcmdldFBjdCI6ODAsIm11UGN0Ijo3LCJzaWdtYVBjdCI6MTV9LCJleHBlY3RlZCI6eyJ0b3RhbE5vbWluYWxXYW4iOjk4MCwidG90YWxSZWFsV2FuIjo4OTYsInN0YXJ0QmFsYW5jZU5vbWluYWxXYW4iOjIyMzYsInN0YXJ0QmFsYW5jZVJlYWxXYW4iOjE1MDUsImRlcGxldGlvbkFnZVA0MCI6ODEsImRlc2lyZWRNb250aGx5UmVhbFdhbiI6MTAuMSwiYWZmb3JkYWJsZU5vbWluYWxXYW5SYW5nZSI6WzYsNi41XSwiYWZmb3JkYWJsZVJlYWxXYW5SYW5nZSI6WzQsNC41XSwiZGVzaXJlZFN1cnZpdmFsUGN0UmFuZ2UiOlszMiwzOF0sImZlYXNpYmxlQWxsU2VlZHMiOnRydWV9fQ.8606dbff";
assert.equal(encoder.encodeEnvelope(flatEnvelope), flatGolden, "Node flat-mode golden encode");
assert.throws(
  () =>
    encoder.encodeEnvelope({
      ...envelope,
      inputs: { ...envelope.inputs, balanceWan: 10000.1 },
    }),
  /inputs\.balanceWan/u
);
assert.throws(
  () =>
    encoder.encodeEnvelope({
      ...envelope,
      expected: {
        ...envelope.expected,
        totalNominalWan: Number.MAX_SAFE_INTEGER + 1,
      },
    }),
  /expected\.totalNominalWan/u
);

const source = fs.readFileSync(
  path.join(__dirname, "../ideco-mirai-navi/mn1_member_encoder.js"),
  "utf8"
);
const sandbox = {
  TextEncoder,
  Uint8Array,
  btoa(value) {
    return Buffer.from(value, "binary").toString("base64");
  },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
assert.equal(
  sandbox.MN1MemberEncoder.encodeEnvelope(
    vm.runInContext(`(${JSON.stringify(envelope)})`, sandbox)
  ),
  golden,
  "browser-like golden encode"
);

console.log("MN4 member encoder tests: PASS");
console.log("goldenCodes=2");
console.log("runtime=node + browser-like no module/no Buffer");
