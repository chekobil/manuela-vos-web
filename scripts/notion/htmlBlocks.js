export const filterHtmlBlocks = (allBlocks) => {
  return allBlocks.filter(
    (b) => b.type === "code" && b.parent.includes("<embed-html>")
  );
};

const getHtmlFromEmbedHtmlBlock = (string) => {
  const list = string.replaceAll("\n", "").split("<embed-html>");
  if (!list.length === 4) throw new Error("Wrong embed-html code");
  return "<div class='embed-content'>" + list[1] + "<p></p></div>";
};

export const parseHtmlBlocks = (allBlocks) => {
  const blocks = filterHtmlBlocks(allBlocks);
  if (!blocks?.length) return { blocks: allBlocks };
  blocks.forEach((block) => {
    const parsedBlock = {
      type: "html",
      children: [],
      parent: getHtmlFromEmbedHtmlBlock(block.parent),
    };
    // console.log("OLD BLOCK::", block);
    // console.log("NEW BLOCK::", parsedBlock);
    allBlocks[block.index] = parsedBlock;
  });
  return { blocks: allBlocks };
};

// Iframe directo de RTVE no funciona, el iframe va envuelto en un div, si le quitas el DIV que lo envuelve el src del iframe se convierte en formato markdown y no funciona, pero tampoco funciona en formato bueno, solo se pinta el div que tiene un enlace al audio
// embed de Twitter funciona bien, es un bloque html con un archivo js
