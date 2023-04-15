import * as fs from 'fs';
import * as path from 'path';
import {settings} from "./settings.js";
import { convertirImagenWebp } from './lib/images.js'
import { changeFileExtension, deleteFile } from './lib/files.js'

const extensions = ["jpg", "jpeg", "png", "gif"];

const dir = settings.coversFolder;
const files = fs.readdirSync(path.resolve(dir));

const coverFiles = files.filter(f => {
  return extensions.map(ext => `.${ext}`).includes(path.extname(f).toLowerCase());
});

if(coverFiles?.length) {
    coverFiles.forEach( file => {
        try {
            const filePath = path.join(dir, file)
            const bufferImage = fs.readFileSync(filePath);
            const destFile = changeFileExtension(filePath, "webp")
            const newImage = convertirImagenWebp(bufferImage, destFile, 1500)
            if (newImage) deleteFile(filePath)
        } catch (error) {
            console.error(error);
        }
    })
} else {
    console.log("nada que convertir en covers")
}