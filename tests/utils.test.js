import { cleanString } from "../scripts/lib/notion";

describe("cleanString method", () => {
  test("Reemplaza espacios por guion bajo", () => {
    const initial = "Alas para Manuela";
    const expected = "alas_para_manuela";
    expect(cleanString(initial).toLowerCase()).toBe(expected);
  });

  test("Reemplaza espacios por guion bajo y elimina caracteres que no sean letra, numero, ñ, _", () => {
    const initial = "Campaña de crowdfunding “Alas para Manuela”";
    const expected = "campaña_de_crowdfunding_alas_para_manuela";
    expect(cleanString(initial).toLowerCase()).toBe(expected);
  });
});
