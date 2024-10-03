import { cleanString } from "../scripts/lib/string";

describe("cleanString method", () => {
  test("Reemplaza espacios por guion bajo", () => {
    const initial = "Alas para Manuela";
    const expected = "alas_para_manuela";
    expect(cleanString(initial).toLowerCase()).toBe(expected);
  });

  test("Reemplaza espacios por guion bajo y elimina caracteres que no sean letra, numero, ñ, _", () => {
    const initial = "Campaña de crowdfunding “Alas para Manuela”";
    const expected = "campana_de_crowdfunding_alas_para_manuela";
    expect(cleanString(initial).toLowerCase()).toBe(expected);
  });

  test("Reemplaza caracteres acentuados por su versión sin acentuar", () => {
    const initial = "Campaña de crowdfunding. Comprendió y luego partió.";
    const expected = "campana_de_crowdfunding_comprendio_y_luego_partio";
    expect(cleanString(initial).toLowerCase()).toBe(expected);
  });
});
