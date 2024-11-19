import { getMdImageData } from "../lib/md.js";

const iframeServices = ["players.brightcove.net"];
export const filterBlocks = (allBlocks) => {
  return allBlocks.filter(
    (b) =>
      b.type === "video" && iframeServices.some((srv) => b.parent.includes(srv))
  );
};
export const parseIframeVideoBlocks = (allBlocks) => {
  const blocks = filterBlocks(allBlocks);
  if (!blocks?.length) return { blocks: allBlocks };
  blocks.forEach((block) => {
    const blockIndex = allBlocks.findIndex((b) => b.parent === block.parent);
    const { url } = getMdImageData(block.parent, "embed");
    const iframe = `<iframe src='${url}' allowfullscreen frameborder=0></iframe>`;
    allBlocks[blockIndex] = {
      type: "html",
      parent: iframe,
      children: [],
    };
  });
  return { blocks: allBlocks };
};
