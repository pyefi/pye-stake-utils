import { describe, it, expect } from "vitest";
import { validateSplitAmount } from "./split-validation";

describe("validateSplitAmount", () => {
  it("returns error when amount is 0", () => {
    expect(validateSplitAmount(0, 10)).toBe("Enter an amount");
  });

  it("returns error when amount equals total (nothing left)", () => {
    expect(validateSplitAmount(10, 10)).toMatch(/remaining/i);
  });

  it("returns error when amount would leave less than rent-exempt minimum", () => {
    expect(validateSplitAmount(9.9999, 10)).toMatch(/minimum/i);
  });

  it("returns null for a valid split", () => {
    expect(validateSplitAmount(5, 10)).toBeNull();
  });
});
