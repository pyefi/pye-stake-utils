import { describe, it, expect } from "vitest";
import { shortenAddress, lamportsToSol, formatSol } from "./format";

describe("shortenAddress", () => {
  it("shortens a 44-char address to 4...4 format", () => {
    const addr = "ABCDefghIJKLmnopQRSTuvwxYZab12345678ABCD1234";
    expect(shortenAddress(addr)).toBe("ABCD...1234");
  });
});

describe("lamportsToSol", () => {
  it("converts 1_000_000_000 lamports to 1 SOL", () => {
    expect(lamportsToSol(1_000_000_000)).toBe(1);
  });
  it("returns 0 for null", () => {
    expect(lamportsToSol(null)).toBe(0);
  });
});

describe("formatSol", () => {
  it("formats null as em-dash", () => {
    expect(formatSol(null)).toBe("—");
  });
  it("formats 1_500_000_000 as showing 1.5", () => {
    expect(formatSol(1_500_000_000)).toMatch(/1\.5/);
  });
});
