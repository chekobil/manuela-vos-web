// LINKS a imagenes en DROPBOX, del tipo https://www.dropbox.com/s/1rr3o5ebisb685i/manu_bio.png?dl=0
// es el link que se inserta en Notion y viene como bloque de tipo link_preview
// {
//   type: 'link_preview',
//   parent: '[link_preview](https://www.dropbox.com/s/25lguhvl56sdf2q/manu_bio_brazos.jpg?dl=0)',
//   children: []
// }
// const dropboxLinks = mdblocks.filter(
//   (b) => b.type === "link_preview" && b.parent.includes("dropbox.com")
// );
// if (dropboxLinks?.length) {
//   dropboxLinks.forEach((block) => {
//     const index = mdblocks.findIndex((b) => b.parent === block.parent);
//     if (index >= 0) {
//       block.index = index;
//     }
//   });
// }
// if (dropboxLinks?.length) {
//   const list = dropboxLinks.map((link) => link.parent);
//   const newLinks = await dropboxLinksDownloadAndConvert(list);
//   dropboxLinks.forEach((link, linkIndex) => {
//     // buscalo en los nuevos links, por el parent
//     const newL = newLinks.find((nl) => nl.link === link.parent);
//     if (newL) {
//       // SI EL INDEX es 0, la foto va en el header, no la pintes, debes eliminar el bloque
//       // y debes añadir la lista de imagenes al frontmatter
//       const blockIndex = mdblocks.findIndex((b) => b.parent === link.parent);
//       if (blockIndex >= 0) {
//         // el indice ha cambiado, no sirve el que tienes
//         mdblocks[blockIndex].type = "image";
//         mdblocks[blockIndex].parent = `![](${newL.dest})`;
//         delete mdblocks[blockIndex].index;
//         // guarda imagenes en el frontmatter
//         if (newL.dest) {
//           frontmatter = addImageToFrontmatter(frontmatter, newL.dest);
//         }
//         // dependiendo del flag, elimina el primer bloque de imagen o no
//         // solo si es el primer bloque
//         if (firstImageAsCover && blockIndex == 0) {
//           mdblocks.splice(0, 1);
//         }
//       }
//     }
//   });
// }
