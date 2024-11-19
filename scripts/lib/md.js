export function getMdImageData(imageLink, type) {
  const regeximage = /!\[(.*)\]\((.*)\)/;
  const regexembed = /\[(image)\]\((.*)\)/;
  let regex = regeximage;
  if (type === "embed") regex = regexembed;
  const regexFileName = /[\w\d-]+(.jpg|.jpeg|.png|.webp|.gif)/;
  const myMatch = imageLink.match(regex);
  let full, text, url, filename, ext;
  if (myMatch) {
    [full, text, url] = myMatch;
  }
  let myMatchUrl;
  if (url) {
    myMatchUrl = url.match(regexFileName);
    if (myMatchUrl) {
      [filename, ext] = myMatchUrl;
    }
  }
  return {
    full,
    text,
    url,
    filename,
    ext,
  };
}

export function getMdLinkData(mdLink) {
  // TEXT ::  ^(?:\!)*\[([\d\s\wA-zÀ-ú.,()]+)\]
  // LINKK :: \(((?:\/|https?:\/\/)[\w\d./=-]+)\)$
  /* Match full links and relative paths */
  // VALIDO PARA VIDEOS YOUTUBE e IMAGENES
  //const regex = /^(?:\!)*\[([\d\s\wA-zÀ-ú.,()]+)\]\(((?:\/|https?:\/\/)[\w\d./=-]+)\)$/
  const regex = /\[(.*)\]\((.*)\)/;
  const myMatch = mdLink.match(regex);
  //console.log("image/video::", myMatch)
  // de-structure the array
  let full, text, url;
  if (myMatch) {
    [full, text, url] = myMatch;
  }
  return {
    full,
    text,
    url,
  };
}
