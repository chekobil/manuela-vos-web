import { getMdLinkData } from "../lib/md.js";
export const filterBlocks = (allBlocks) => {
  return allBlocks.filter(
    (b) => b.type === "video" && b.parent.includes("youtu")
  );
};
function getVideoThumbnailUrl(videoId) {
  // maxresdefault.jpg :: size: 1280x720
  // hqdefault.jpg :: size: 480x360
  // sddefault.jpg :: size: 640x480
  // mqdefault.jpg :: size: 320x180
  // default.jpg :: size: 120x90
  // 0.jpg :: size: 480x360
  // +++++ :: distintos fotogramas
  // 1.jpg :: size: 120x90
  // 2.jpg :: size: 120x90
  // 3.jpg :: size: 120x90
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}
function getVideoIframe(videoId) {
  return `<div><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
}
export const parseYoutubeBlocks = (allBlocks) => {
  const urlList = [];
  const blocks = filterBlocks(allBlocks);
  if (!blocks?.length) return { blocks: allBlocks };
  blocks.forEach((block) => {
    const blockIndex = allBlocks.findIndex((b) => b.parent === block.parent);
    let thumbnail;
    if (blockIndex >= 0) {
      const { url } = getMdLinkData(block.parent);
      if (url) {
        let videoId = url.split("/").pop();
        videoId = videoId.split("watch?v=").pop();
        //console.log("VIDEOID::", videoId)
        const iFrame = getVideoIframe(videoId);
        allBlocks[blockIndex] = {
          type: "html",
          parent: iFrame,
          children: [],
        };
        thumbnail = getVideoThumbnailUrl(videoId);
      }
      if (thumbnail) {
        urlList.push(thumbnail);
      }
    }
  });
  return { blocks: allBlocks, urls: urlList };
};
