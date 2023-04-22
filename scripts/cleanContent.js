import fs from 'fs';
import { dinamycContent, staticPages } from './settings.js'

dinamycContent.forEach( c => {
    removeDir(c.dest)
})
staticPages.forEach( page => {
    removeDir(page.dest)
})

function removeDir(folderPath){    
    try {
      fs.rmSync(folderPath, { recursive: true });
      console.log(`Directory ${folderPath} removed successfully`);
    } catch (err) {
      console.error(`Error removing directory: ${err}`);
    }
}