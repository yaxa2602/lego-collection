import { describe, it, expect } from "vitest";
import { instructionsUrl, bricklinkUrl, avitoUrl, bareSetNum } from "./links";

describe("links", () => {
  it("bareSetNum отрезает суффикс варианта", () => {
    expect(bareSetNum("42151-1")).toBe("42151");
    expect(bareSetNum("42151")).toBe("42151");
  });
  it("инструкции lego.com по голому номеру", () => {
    expect(instructionsUrl("42151-1")).toBe(
      "https://www.lego.com/service/building-instructions/42151"
    );
  });
  it("BrickLink использует полный номер с вариантом", () => {
    expect(bricklinkUrl("42151-1")).toBe(
      "https://www.bricklink.com/v2/catalog/catalogitem.page?S=42151-1"
    );
  });
  it("Avito — поисковый запрос с номером и названием", () => {
    expect(avitoUrl("42151-1", "Bugatti Bolide")).toBe(
      "https://www.avito.ru/all?q=lego%2042151%20Bugatti%20Bolide"
    );
  });
});
