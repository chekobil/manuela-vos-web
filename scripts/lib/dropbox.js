import * as fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv'
import { Dropbox } from "dropbox";
import { changeFileExtension } from './files.js'
import { convertirImagenWebp } from './images.js'
import { settings } from '../settings.js'
dotenv.config()

// El Token da acceso a la cuenta de Dropbox de manuevosteam@gmail.com
// desde una App creada por la misma cuenta, es decir no hay acceso disponible a otras cuentas
const DropboxToken = process.env.DROPBOX_TOKEN
// Create an instance of Dropbox with the access token and use it to
// fetch and render the files in the users root directory.
const dbx = new Dropbox({ accessToken: DropboxToken });

const listDropboxContent = async (folder) => {
    const res = await dbx.filesListFolder({path: folder})
    if (res.status === 200) {
        return res.result.entries
    } else {
        console.log("Ocurrio algun error")
        return []
    }
}

const parseDropboxLinks = (list) => {
    const regex = /([^/]+\.\w+)\?[^/]*$/
    return list.map( item => {
        const myMatch = item.match(regex)
        return {
            link: item,
            name: myMatch[1]
        }
    })
}


// Define la función que descargará el archivo y lo guardará en disco
async function descargarArchivo(filePath, rutaDestino) {
  try {
    // Descarga el archivo de Dropbox
    const respuesta = await dbx.filesDownload({ path: filePath });
    const fileBinary = respuesta.result.fileBinary
    // // Crea un stream de escritura de archivo en disco
    // const stream = fs.createWriteStream(rutaDestino);
    // // Escribe los datos del archivo en el stream
    // stream.write(fileBinary);
    // // Cierra el stream y finaliza la descarga
    // stream.end();
    // convierte la imagen a WEBP y guarda el archivo
    const newDestPath = changeFileExtension(rutaDestino, "webp")
    await convertirImagenWebp(fileBinary, newDestPath);
    return newDestPath;
  } catch (error) {
    console.error('Error al descargar el archivo:', error);
    return
  }
}

export const dropboxLinksDownloadAndConvert = async (links) => {
    const folder = settings.dropboxFolder
    const destFolder = settings.imagesDestFolder
    const imagesData = parseDropboxLinks(links)
    const allImages = await listDropboxContent(folder)
    const usedImages = imagesData.map( img => {
        const usedImage = allImages.find( image => image.name === img.name )
        if (usedImage){
            usedImage.link = img.link
            return usedImage 
        }
    })
    usedImages.filter( i => Boolean(i))
    const res = usedImages.map( async (image) => {
        const newLink = await descargarArchivo(image.path_display, path.join(destFolder, image.name));
        return {
            ...image,
            dest: newLink.replace("public/", "/"), // nuevo link a la carpeta public, elimina public de la ruta
        }
    })
    return await Promise.all(res)
}

export function updateDropboxToken(file, newToken) {
    // Nombre del archivo a leer y modificar
    const archivo = file;   
    // Nuevo valor para DROPBOX_TOKEN
    const nuevo_dropbox_token = newToken;   
    // Lee el archivo y reemplaza el valor de DROPBOX_TOKEN
    let contenido = fs.readFileSync(archivo, 'utf-8');
    contenido = contenido.replace(/DROPBOX_TOKEN=.*/, `DROPBOX_TOKEN=${nuevo_dropbox_token}`);  
    // Guarda el archivo con el nuevo contenido
    fs.writeFileSync(archivo, contenido);  
    console.log(`Archivo ${archivo} modificado con éxito.`);
  }