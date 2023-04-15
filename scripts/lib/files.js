import * as fs from 'fs';

export function changeFileExtension(rutaArchivo, newExt) {
    const extensionActual = rutaArchivo.split('.').pop();
    return rutaArchivo.replace(new RegExp(`.${extensionActual}$`), `.${newExt}`);
}

export function deleteFile(file) {
    fs.unlink(file, function(err) {
        if (err) throw err;
      });
}