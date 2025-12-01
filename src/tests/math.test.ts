import { describe, it, expect } from "vitest";

describe("Math tests", () => {
  it("adds numbers correctly", () => {
    expect(1 + 2).toBe(2);
  });

  it("multiplies numbers correctly", () => {
    expect(2 * 5).toBe(10);
  });

  it("checks number type", () => {
    expect(typeof 99).toBe("number");
  });
});
