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
import { parseImageBlocks } from "../notion/imageBlocks.js";
import { parseIframeVideoBlocks } from "../notion/videoIframeBlocks.js";
import { parseYoutubeBlocks } from "../notion/youtubeBlocks.js";
import { log } from "console";

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
const addImageListToFrontmatter = (frontmatter, urls) => {
  const fmJson = FrontmatterToJson(frontmatter);
  if (!fmJson.cover) fmJson.cover = urls[0];
  if (!fmJson.images) fmJson.images = urls;
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
  // if (FrontmatterToJson(frontmatter).title.includes("infinito")) {
  //   console.log("BLOCKS::", mdblocksRaw);
  // }

  let mdblocks = mdblocksRaw.map((block, index) => ({ ...block, index }));
  // EMBED-HTML BLOCKS
  ({ blocks: mdblocks } = parseHtmlBlocks(mdblocks));
  // IMAGENES
  let imageUrls = [];
  ({ blocks: mdblocks, urls: imageUrls } = parseImageBlocks(mdblocks));
  if (imageUrls?.length) {
    frontmatter = addImageListToFrontmatter(frontmatter, imageUrls);
  }
  // VIDEOS emebidos en un iframe
  ({ blocks: mdblocks } = parseIframeVideoBlocks(mdblocks));
  // VIDEOS youtube
  let youtubeUrls = [];
  ({ blocks: mdblocks, urls: youtubeUrls } = parseYoutubeBlocks(mdblocks));
  if (youtubeUrls?.length) {
    frontmatter = addImageListToFrontmatter(frontmatter, youtubeUrls);
  }

  //
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
