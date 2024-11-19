import { getMdImageData } from "../lib/md.js";
export const filterImageBlocks = (allBlocks) => {
  return allBlocks.filter((b) => b.type === "image");
};

const imageDir = "/images/";
const imageExt = ".webp";
const firstImageAsCover = false;
export const parseImageBlocks = (allBlocks) => {
  const blocks = filterImageBlocks(allBlocks);
  if (!blocks?.length) return { blocks: allBlocks };
  let imageUrls = [];
  blocks.forEach((block) => {
    const blockIndex = allBlocks.findIndex((b) => b.parent === block.parent);

    const { text, filename, ext } = getMdImageData(block.parent);
    let newUrl;
    if (filename && ext) {
      const name = filename.replace(ext, "");
      newUrl = `${imageDir}${name}${imageExt}`;
      const figure = `<figure><img src="${newUrl}" alt="${
        text ?? name
      }"><figcaption align="left">${text}</figcaption></figure>`;
      allBlocks[blockIndex] = {
        type: "html",
        parent: figure,
        children: [],
      };
    }
    if (newUrl) imageUrls.push(newUrl);
    if (firstImageAsCover && blockIndex == 0) {
      allBlocks.splice(0, 1);
    }
  });
  return { blocks: allBlocks, urls: imageUrls };
};
