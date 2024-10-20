import * as fs from "fs";
import * as path from "path";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import matter from "gray-matter";
import yaml from "js-yaml";
import { getCleanTitle, cleanString } from "./string.js";
import * as dotenv from "dotenv";
dotenv.config();
// import { dropboxLinksDownloadAndConvert } from "./dropbox.js";
import { parseHtmlBlocks } from "../notion/htmlBlocks.js";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});
const n2m = new NotionToMarkdown({ notionClient: notion });

const addImageToFrontmatter = (frontmatter, url) => {
  const fmJson = FrontmatterToJson(frontmatter);
  if (!fmJson.cover) fmJson.cover = url;
  if (!fmJson.images) fmJson.images = [];
  fmJson.images.push(url);
  frontmatter = JsonToFrontmatter(fmJson);
  return frontmatter;
};

const convertToMD = async (
  pageId,
  frontmatter = "",
  firstImageAsCover = false
) => {
  let removedBlocks = 0;
  const mdblocksRaw = await n2m.pageToMarkdown(pageId);
  let mdblocks = mdblocksRaw.map((block, index) => ({ ...block, index }));
  // console.log("BLOCKS::", mdblocks);
  // EMBED-HTML BLOCKS
  mdblocks = parseHtmlBlocks(mdblocks);
  // IMAGENES
  // sea cual sea el link, se extrae el nombre de archivo y se cambia la extension a webp
  // la url es relativa a /, es decir, se espera que las imagenes esten en public, en formato webp
  const images = mdblocks.filter((b) => b.type === "image");
  if (images?.length) {
    images.forEach((block) => {
      const blockIndex = mdblocks.findIndex((b) => b.parent === block.parent);
      if (blockIndex >= 0) {
        const { text, filename, ext } = getMdImageData(block.parent);
        let newUrl;
        // console.log("BLOCKS IMAGES ::", filename, ext);
        if (filename && ext) {
          const name = filename.replace(ext, "");
          newUrl = `/images/${name}.webp`;
          const figure = `<figure><img src="${newUrl}" alt="${
            text ?? name
          }"><figcaption align="left">${text}</figcaption></figure>`;
          mdblocks[blockIndex] = {
            type: "html",
            parent: figure,
            children: [],
          };
        }
        if (newUrl) {
          frontmatter = addImageToFrontmatter(frontmatter, newUrl);
        }
        if (firstImageAsCover && blockIndex == 0) {
          mdblocks.splice(0, 1);
          removedBlocks++;
        }
      }
    });
  }

  // VIDEOS emebidos en un iframe
  const iframeServices = ["players.brightcove.net"];
  const embedVideos = mdblocks.filter(
    (b) =>
      b.type === "video" && iframeServices.some((srv) => b.parent.includes(srv))
  );
  // console.log("EMBED::", embedVideos);

  if (embedVideos?.length) {
    embedVideos.forEach((block) => {
      const blockIndex = mdblocks.findIndex((b) => b.parent === block.parent);
      const { url } = getMdImageData(block.parent, "embed");
      const iframe = `<iframe src='${url}' allowfullscreen frameborder=0></iframe>`;
      mdblocks[blockIndex] = {
        type: "html",
        parent: iframe,
        children: [],
      };
    });
  }
  // DESACTIVADO
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

  // VIDEOS youtube
  const videos = mdblocks.filter(
    (b) => b.type === "video" && b.parent.includes("youtu")
  );
  if (videos?.length) {
    // console.log("VIDEOS::", videos);
    videos.forEach((videoBlock) => {
      const index = mdblocks.findIndex((b) => b.parent === videoBlock.parent);
      let thumbnail;
      if (index >= 0) {
        const { url } = getMdLinkData(videoBlock.parent);
        if (url) {
          let videoId = url.split("/").pop();
          videoId = videoId.split("watch?v=").pop();
          //console.log("VIDEOID::", videoId)
          const iFrame = getVideoIframe(videoId);
          mdblocks[index] = {
            type: "html",
            parent: iFrame,
            children: [],
          };
          thumbnail = getVideoThumbnailUrl(videoId);
        }
        if (thumbnail) {
          frontmatter = addImageToFrontmatter(frontmatter, thumbnail);
        }
      }
    });
  }
  if (mdblocks.length !== mdblocksRaw.length - removedBlocks)
    throw new Error(
      `Error. Parsed blocks must have the same length.
      ${mdblocks.length - removedBlocks}
      ? ${mdblocksRaw.length}
      `
    );
  const mdString = n2m.toMarkdownString(mdblocks);
  return frontmatter + mdString;
};

function getVideoIframe(videoId) {
  return `<div><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
}

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

function getMdLinkData(mdLink) {
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

const checkDir = (dir) => {
  if (fs.existsSync(dir)) return;
  fs.mkdirSync(dir, { recursive: true });
};

function writeMdFile(name, dest, content, dryrun = true) {
  checkDir(dest);
  //writing to file
  const cleanName = cleanString(name);
  const filename = cleanName + ".md";
  const filepath = path.join(dest, filename);
  if (dryrun) {
    console.log("--dryrun + ", filename);
  } else {
    try {
      fs.writeFileSync(filepath, content);
      console.log("+ ", filename);
    } catch (err) {
      console.error(err);
    }
  }
}

function removeMdFile(filename, dest, dryrun = true) {
  //writing to file
  const filepath = path.join(dest, filename);
  if (dryrun) {
    console.log("--dryrun + DELETE ", filename);
  } else {
    try {
      fs.unlinkSync(filepath);
      console.log("+ DELETE ", filename);
    } catch (err) {
      console.error(err);
    }
  }
}

function JsonToFrontmatter(page) {
  const dataString = JsonToYaml(page);
  return `---\n${dataString}---\n`;
}

function JsonToYaml(data) {
  let res = yaml.dump(data);
  return res;
}

function FrontmatterToJson(string) {
  let { data } = matter(string); // devuelve un objeto eliminando ---
  return data;
}

function readMdFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  let mdFiles = files.filter((f) => {
    return path.extname(f).toLowerCase() === ".md";
  });

  mdFiles = mdFiles.map((md) => {
    const filePath = path.join(dir, md);
    const content = fs.readFileSync(filePath, "utf8", (err, data) => {
      if (err) throw err;
      return data;
    });
    // parse MD file with gray-matter
    const parsedMd = matter(content);
    parsedMd.dir = dir;
    parsedMd.name = md;
    return parsedMd;
  });
  return mdFiles;
}

// todo el contenido
export const getAllNotionContent = async () => {
  const response = await notion.search({
    sort: {
      direction: "descending",
      timestamp: "last_edited_time",
    },
  });
  console.log(response);
};

export const notionPageToMd = async (page, dryrun = true, writeall = false) => {
  // ARTICULOS_DB
  const { notionPageId, author, dest, layout, ref } = page;
  // articulos en DEST
  const destFile = readMdFiles(dest);
  console.log("+ reading Astro PAGE: ", ref, "find ", destFile.length, "files");
  const response = await notion.pages.retrieve({
    page_id: notionPageId,
  });

  // console.log("page::", response)
  // KEYS, es el titulo de la propertie de la base de datos
  const keyDate = Object.keys(response.properties).find((k) =>
    k.includes("Date")
  );
  const keyTitle = Object.keys(response.properties).find((k) =>
    k.includes("Name")
  );
  const keyDescription = Object.keys(response.properties).find((k) =>
    k.includes("Description")
  );
  // ALGUNA comprobacion para saber que esta listo para publicar !!
  const ready = [response];
  const parsed = ready.map(async (p) => {
    //console.log("PAGE::", p)
    const props = p.properties;
    const published = props[keyDate]?.date?.start || "";
    const title = props[keyTitle].title?.[0]?.plain_text;
    const description = props[keyDescription]?.rich_text?.[0]?.plain_text;
    // console.log(published)
    // console.log(title)
    // console.log(description)
    const slug = "index";
    const page = {
      id: p.id,
      edit: p.last_edited_time,
      author,
      published,
      title,
      description,
      slug,
      layout,
      header: "large",
    };
    // mismo archivo ya compilado
    const publishedFile = destFile.find((f) => f.data.id == page.id);
    if (publishedFile) {
      // compara las fechas edit
      if (publishedFile.data.edit != page.edit) {
        console.log("+ file", slug, " in ", ref, "ha sido modificado");
        page.modified = true;
      }
    } else {
      // es nuevo
      page.modified = true;
    }
    const frontMatter = JsonToFrontmatter(page);
    page.md = await convertToMD(p.id, frontMatter, true);
    return page;
  });
  const notionFiles = await Promise.all(parsed);
  let pagesToProcess;
  if (writeall) {
    pagesToProcess = notionFiles;
  } else {
    // Escribes solo las que han sido modificadas
    pagesToProcess = notionFiles.filter((page) => page.modified);
  }
  // BUSCA los mismos archivos que vas a escribir
  // lee su frontmatter y comprueba si han sido modificados
  // y si deben ser publicados o aun no
  if (pagesToProcess.length) {
    if (dryrun)
      console.log(
        "++ DRY RUN page: ",
        ref,
        "has",
        pagesToProcess.length,
        "files"
      );
    else
      console.log(
        "------\n",
        "++ page: ",
        ref,
        "has",
        pagesToProcess.length,
        "files"
      );
    // GUARDA una copia de los que sobreescribas, para poder hacer rollback
    pagesToProcess.forEach((md) => {
      writeMdFile(md.slug, dest, md.md, dryrun);
    });
    console.log("\n");
  } else {
    console.log("------\n", "++ page: ", ref, ", nada");
  }
};

export const notionDbToMdFiles = async (
  db,
  dryrun = true,
  writeall = false
) => {
  // ARTICULOS_DB
  const { notionDbId, author, dest, layout, ref } = db;
  // articulos en DEST
  let destFiles = readMdFiles(dest);
  console.log(
    "+ reading Astro content: ",
    ref,
    "find ",
    destFiles.length,
    "files"
  );
  // articulos en NOTION
  const response = await notion.databases.query({
    database_id: notionDbId,
    sorts: [
      {
        timestamp: "last_edited_time",
        direction: "descending",
      },
    ],
  });
  // console.log("DBid:", notionDbId);
  // console.log("RESPONSE::", response)
  let pagesToProcess;
  let pagesToRemove;
  if (response?.results?.length) {
    // KEYS, es el titulo de la propertie de la base de datos
    const keyDate = Object.keys(response.results[0].properties).find((k) =>
      k.includes("Fecha")
    );
    // La propiedad que incluye el titulo, debe llamarse Titulo, por defecto cuando se crea un calendario por ejemplo, sus opaginas hijas tiene el titulo en la propiedad Nombre
    const keyTitle = Object.keys(response.results[0].properties).find((k) =>
      k.includes("Titulo")
    );
    // Paginas de un calendario tienen estado
    const keyStatus = Object.keys(response.results[0].properties).find((k) =>
      k.includes("Estado")
    );
    // Paginas de calendario, tienen Ciudad y Lugar
    const keyCity = Object.keys(response.results[0].properties).find((k) =>
      k.includes("Ciudad")
    );
    const keyVenue = Object.keys(response.results[0].properties).find((k) =>
      k.includes("Lugar")
    );
    const keyUrl = Object.keys(response.results[0].properties).find((k) =>
      k.includes("URL")
    );
    // Los que tengan fecha de publicación
    const ready = response.results.filter((p) => {
      return p.properties[keyDate].date != null;
    });
    // const ready = response.results
    // parseado con las props que me interesan
    // PAginas dentro de un calendario
    /*
  Fecha: {
    id: '%3FNXM',
    type: 'date',
    date: { start: '2024-10-15', end: '2024-10-19', time_zone: null }
  },
  Estado: {
    id: 'BtTW',
    type: 'status',
    status: {
      id: 'e16ada3e-09e5-47f6-a9be-bb0166d845b6',
      name: 'Sin empezar',
      color: 'default'
    }
  },
  Asignar: { id: 'ETeE', type: 'people', people: [] },
  Ciudad: { id: 'fbZM', type: 'rich_text', rich_text: [] },
  Titulo: { id: 'title', type: 'title', title: [ [Object] ] }
    */
    const parsed = ready.map(async (p) => {
      // console.log("PAGE::", p)
      const props = p.properties;
      const published = props[keyDate]?.date?.start || "";
      //
      const start = props[keyDate]?.date?.start || "";
      const end = props[keyDate]?.date?.end || "";
      const status = props[keyStatus]?.status?.name || "";
      const city = props[keyCity]?.rich_text?.[0]?.plain_text ?? "";
      const venue = props[keyVenue]?.rich_text?.[0]?.plain_text ?? "";
      const url = encodeURI(props[keyUrl]?.url);
      //
      const title = props[keyTitle]?.title?.[0].plain_text ?? "-";
      const slug = getCleanTitle(title);
      const page = {
        id: p.id,
        edit: p.last_edited_time,
        author,
        published,
        title,
        slug,
        layout,
        header: "small",
      };
      // Paginas hijas de un calendario
      if (start && end) {
        page.start = start;
        page.end = end;
      }
      if (status) page.status = status;
      if (city) page.city = city;
      if (venue) page.venue = venue;
      if (url) page.url = url;
      // mismo archivo ya compilado
      const publishedFileIndex = destFiles.findIndex(
        (f) => f.data.id == page.id
      );
      let publishedFile;
      if (publishedFileIndex >= 0) {
        publishedFile = destFiles[publishedFileIndex];
        // lo eliminas del array de archivos ya compilados
        destFiles = destFiles.filter((f, i) => i != publishedFileIndex);
      }
      if (publishedFile) {
        // compara las fechas edit
        if (publishedFile.data.edit != page.edit) {
          console.log("+ file", slug, " in ", ref, "ha sido modificado");
          page.modified = true;
        }
      } else {
        // es nuevo
        page.modified = true;
      }
      const frontMatter = JsonToFrontmatter(page);
      page.md = await convertToMD(p.id, frontMatter);
      return page;
    });
    const notionFiles = await Promise.all(parsed);
    if (writeall) {
      pagesToProcess = notionFiles;
    } else {
      // Escribes solo las que han sido modificadas
      pagesToProcess = notionFiles.filter((page) => page.modified);
    }
  }
  // BUSCA los mismos archivos que vas a escribir
  // lee su frontmatter y comprueba si han sido modificados
  // y si deben ser publicados o aun no
  if (pagesToProcess?.length) {
    if (dryrun)
      console.log(
        "++ DRY RUN db: ",
        ref,
        "has",
        pagesToProcess.length,
        "files"
      );
    else
      console.log(
        "------\n",
        "++ db: ",
        ref,
        "has",
        pagesToProcess.length,
        "files"
      );
    // GUARDA una copia de los que sobreescribas, para poder hacer rollback
    pagesToProcess.forEach((md) => {
      writeMdFile(md.slug, dest, md.md, dryrun);
    });
    console.log("\n");
  } else {
    console.log("------\n", "++ db: ", ref, ", nada");
  }

  // Los que restan despues de filtrar los que vienen de Notion, son los que han sido eliminados
  pagesToRemove = destFiles; //{name:"", dir: ""}
  if (pagesToRemove?.length) {
    if (dryrun)
      console.log(
        "++ DRY RUN remove: ",
        ref,
        "has",
        pagesToRemove.length,
        "files to be removed"
      );
    else {
      pagesToRemove.forEach((md) => {
        removeMdFile(md.name, dest, dryrun);
        console.log("\n");
      });
    }
  }
};
