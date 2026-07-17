import { describe, expect, it } from "vitest";
import { parseSnackOptions, serializeSnackOptions } from "./snacks";

describe("snack options", () => {
  it("parses newline-separated snack lines", () => {
    expect(parseSnackOptions("Apples\n Yogurt\n\nCheese sticks")).toEqual([
      "Apples",
      "Yogurt",
      "Cheese sticks",
    ]);
  });

  it("serializes snack lines", () => {
    expect(serializeSnackOptions(["Apples", "Yogurt"])).toBe("Apples\nYogurt");
  });
});
