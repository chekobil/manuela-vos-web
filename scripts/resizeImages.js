import * as fs from "fs";
import * as path from "path";
import { settings } from "./settings.js";
import { convertirImagenWebp } from "./lib/images.js";
import { changeFileExtension, deleteFile } from "./lib/files.js";

const extensions = ["jpg", "jpeg", "png", "gif"];

const dirCovers = settings.coversFolder;
const dirImages = settings.imagesDestFolder;
const filesCovers = fs.readdirSync(path.resolve(dirCovers));
const filesImages = fs.readdirSync(path.resolve(dirImages));
const coversObj = filesCovers.map((file) => ({ file: file, dir: dirCovers }));
const imagesObj = filesImages.map((file) => ({ file: file, dir: dirImages }));
const allFiles = [...coversObj, ...imagesObj];

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
