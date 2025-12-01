import { describe, it, expect } from "vitest";

describe("Schoolyard asset tests", () => {
  const asset = { id: "tree", width: 2, height: 3 };

  it("has an id", () => {
    expect(asset.id).toBe("tree");
  });

  it("has correct size", () => {
    expect(asset.width * asset.height).toBe(6);
  });

  it("is valid", () => {
    expect(asset.width > 0 && asset.height > 0).toBe(true);
  });
});
