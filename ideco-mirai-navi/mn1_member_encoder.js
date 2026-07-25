(function exposeMN1MemberEncoder(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.MN1MemberEncoder = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildMN1MemberEncoder() {
  "use strict";

  /*
   * 加入者版は、画面で確定した入力と表示結果をMN1形式へ符号化するだけに限定する。
   * DOM、保存、通信、アドバイザー向け再計算はこのモジュールへ入れない。
   */

  const CONTRACT = "MN1";
  // v25: 固定MCドライバープロファイルを変更。計算式・CF規則はv24と同じだが、標本結果はv24と一致しない。
  const ENGINE_VERSION = "v25";
  const MAX_BALANCE_WAN = 10000;

  const CASES = Object.freeze({
    A: Object.freeze({ muPct: 4, sigmaPct: 8 }),
    B: Object.freeze({ muPct: 7, sigmaPct: 15 }),
    C: Object.freeze({ muPct: 9, sigmaPct: 20 }),
  });

  const ENVELOPE_KEYS = Object.freeze(["contract", "engine", "expected", "inputs"]);
  const INPUT_KEYS = Object.freeze([
    "age",
    "balanceWan",
    "caseId",
    "desiredMonthlyWan",
    "drawAge",
    "inflationPct",
    "limit62",
    "maxAge",
    "monthlyWan",
    "muPct",
    "scheme",
    "sigmaPct",
    "targetPct",
  ]);
  const EXPECTED_KEYS = Object.freeze([
    "affordableNominalWanRange",
    "affordableRealWanRange",
    "desiredMonthlyRealWan",
    "desiredSurvivalPctRange",
    "feasibleAllSeeds",
    "startBalanceNominalWan",
    "startBalanceRealWan",
    "totalNominalWan",
    "totalRealWan",
  ]);

  function isPlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function requireExactKeys(value, expectedKeys, name) {
    if (!isPlainObject(value)) throw new Error(name);
    const actual = Object.keys(value).sort();
    const expected = [...expectedKeys].sort();
    if (
      actual.length !== expected.length ||
      actual.some((key, index) => key !== expected[index])
    ) {
      throw new Error(`${name}.keys`);
    }
  }

  function isStep(value, multiplier) {
    return Math.abs(value * multiplier - Math.round(value * multiplier)) <= 1e-9;
  }

  function validateInputs(input) {
    requireExactKeys(input, INPUT_KEYS, "inputs");
    if (!["idecoplus", "corporate", "unknown"].includes(input.scheme)) {
      throw new Error("inputs.scheme");
    }
    if (typeof input.limit62 !== "boolean") throw new Error("inputs.limit62");
    if (!Number.isInteger(input.age) || input.age < 20 || input.age > 64) {
      throw new Error("inputs.age");
    }
    if (
      !Number.isInteger(input.drawAge) ||
      input.drawAge < 60 ||
      input.drawAge > 74 ||
      input.drawAge <= input.age
    ) {
      throw new Error("inputs.drawAge");
    }
    if (![90, 95, 100].includes(input.maxAge) || input.maxAge <= input.drawAge) {
      throw new Error("inputs.maxAge");
    }
    if (![1, 2, 3].includes(input.inflationPct)) throw new Error("inputs.inflationPct");
    if (![80, 90].includes(input.targetPct)) throw new Error("inputs.targetPct");

    if (!Object.prototype.hasOwnProperty.call(CASES, input.caseId)) {
      throw new Error("inputs.caseId");
    }
    const selectedCase = CASES[input.caseId];
    if (
      input.muPct !== selectedCase.muPct ||
      input.sigmaPct !== selectedCase.sigmaPct
    ) {
      throw new Error("inputs.caseValues");
    }

    const cap = input.limit62 ? 6.2 : input.scheme === "idecoplus" ? 2.3 : 5.5;
    if (
      !Number.isFinite(input.monthlyWan) ||
      input.monthlyWan < 0 ||
      input.monthlyWan > cap ||
      !isStep(input.monthlyWan, 10)
    ) {
      throw new Error("inputs.monthlyWan");
    }
    if (
      !Number.isFinite(input.balanceWan) ||
      input.balanceWan < 0 ||
      input.balanceWan > MAX_BALANCE_WAN
    ) {
      throw new Error("inputs.balanceWan");
    }
    if (
      !Number.isFinite(input.desiredMonthlyWan) ||
      input.desiredMonthlyWan < 0.5 ||
      input.desiredMonthlyWan > 40 ||
      !isStep(input.desiredMonthlyWan, 2)
    ) {
      throw new Error("inputs.desiredMonthlyWan");
    }
  }

  function validateMoneyInteger(value, name) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(name);
  }

  function validateOneDecimal(value, name) {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      !isStep(value, 10) ||
      !Number.isSafeInteger(Math.round(value * 10))
    ) {
      throw new Error(name);
    }
  }

  function validateHalfWanRange(value, name) {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      !value.every(
        (item) =>
          Number.isFinite(item) &&
          item >= 0 &&
          isStep(item, 2) &&
          Number.isSafeInteger(Math.round(item * 2))
      ) ||
      value[0] > value[1]
    ) {
      throw new Error(name);
    }
  }

  function validatePercentageRange(value, name) {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      !value.every(
        (item) =>
          Number.isFinite(item) &&
          item >= 0 &&
          item <= 100 &&
          isStep(item, 10)
      ) ||
      value[0] > value[1]
    ) {
      throw new Error(name);
    }
  }

  function validateExpected(expected) {
    requireExactKeys(expected, EXPECTED_KEYS, "expected");
    validateMoneyInteger(expected.totalNominalWan, "expected.totalNominalWan");
    validateMoneyInteger(expected.totalRealWan, "expected.totalRealWan");
    validateMoneyInteger(expected.startBalanceNominalWan, "expected.startBalanceNominalWan");
    validateMoneyInteger(expected.startBalanceRealWan, "expected.startBalanceRealWan");
    validateOneDecimal(expected.desiredMonthlyRealWan, "expected.desiredMonthlyRealWan");
    validateHalfWanRange(
      expected.affordableNominalWanRange,
      "expected.affordableNominalWanRange"
    );
    validateHalfWanRange(
      expected.affordableRealWanRange,
      "expected.affordableRealWanRange"
    );
    validatePercentageRange(
      expected.desiredSurvivalPctRange,
      "expected.desiredSurvivalPctRange"
    );
    if (typeof expected.feasibleAllSeeds !== "boolean") {
      throw new Error("expected.feasibleAllSeeds");
    }
    return expected;
  }

  function validateEnvelope(envelope) {
    requireExactKeys(envelope, ENVELOPE_KEYS, "envelope");
    if (envelope.contract !== CONTRACT) throw new Error("envelope.contract");
    if (envelope.engine !== ENGINE_VERSION) throw new Error("envelope.engine");
    validateInputs(envelope.inputs);
    validateExpected(envelope.expected);
    if (envelope.expected.totalRealWan > envelope.expected.totalNominalWan) {
      throw new Error("expected.totalRealWan");
    }
    if (
      envelope.expected.startBalanceRealWan >
      envelope.expected.startBalanceNominalWan
    ) {
      throw new Error("expected.startBalanceRealWan");
    }
    if (
      envelope.expected.desiredMonthlyRealWan >
      envelope.inputs.desiredMonthlyWan
    ) {
      throw new Error("expected.desiredMonthlyRealWan");
    }
    for (let index = 0; index < 2; index += 1) {
      if (
        envelope.expected.affordableRealWanRange[index] >
        envelope.expected.affordableNominalWanRange[index]
      ) {
        throw new Error("expected.affordableRealWanRange");
      }
    }
    return envelope;
  }

  function utf8Bytes(value) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value);
    if (typeof Buffer !== "undefined") {
      return Uint8Array.from(Buffer.from(value, "utf8"));
    }
    throw new Error("utf8.encoder");
  }

  function bytesToBase64url(bytes) {
    if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64url");
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/u, "");
  }

  function crc32(value) {
    const bytes = utf8Bytes(value);
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
  }

  function encodeEnvelope(envelope) {
    validateEnvelope(envelope);
    const payload = bytesToBase64url(utf8Bytes(JSON.stringify(envelope)));
    return `${CONTRACT}.${payload}.${crc32(payload)}`;
  }

  return Object.freeze({
    CONTRACT,
    ENGINE_VERSION,
    crc32,
    encodeEnvelope,
    validateEnvelope,
  });
});
