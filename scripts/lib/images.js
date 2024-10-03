import * as fs from "fs";
import sharp from "sharp";

export async function convertirImagenWebp(
  imagenBinaria,
  rutaImagenWebpConvertida,
  width = 1000,
  format = "webp"
) {
  try {
    const imagenConvertida = await sharp(imagenBinaria)
      .resize({ width, withoutEnlargement: true })
      .toFormat(format)
      .toBuffer();
    fs.writeFileSync(rutaImagenWebpConvertida, imagenConvertida);
    return rutaImagenWebpConvertida;
  } catch (error) {
    console.error("Error al convertir la imagen:", error);
    return false;
  }
}
