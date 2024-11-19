import * as fs from "fs";
import * as path from "path";
import { settings } from "./settings.js";
import { convertirImagenWebp } from "./lib/images.js";
import { changeFileExtension, deleteFile } from "./lib/files.js";

const extensions = ["jpg", "jpeg", "png", "gif", "avif"];
const folders = ["coversFolder", "imagesDestFolder", "sponsorsFolder"];
const allFiles = [];
folders.forEach((folder) => {
  const dir = settings[folder];
  const files = fs.readdirSync(path.resolve(dir));
  const obj = files.map((file) => ({ file, dir }));
  allFiles.push(...obj);
});

const imageFiles = allFiles.filter((f) => {
  return extensions
    .map((ext) => `.${ext}`)
    .includes(path.extname(f.file).toLowerCase());
});

if (!imageFiles?.length) {
  console.log("nada que convertir en covers ni en imagenes");
} else {
  imageFiles.forEach((f) => {
    try {
      const filePath = path.join(f.dir, f.file);
      const bufferImage = fs.readFileSync(filePath);
      const destFile = changeFileExtension(filePath, "webp");
      const newImage = convertirImagenWebp(bufferImage, destFile, 1500);
      if (newImage) deleteFile(filePath);
    } catch (error) {
      console.error(error);
    }
  });
}
