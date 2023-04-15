import { getAllNotionContent, notionDbToMdFiles, notionPageToMd } from './lib/notion.js'
import { dinamycContent, staticPages } from './settings.js'

//getAllNotionContent()
const dryrun = false
const writeall = true // false, solo escribe los que han sido modificados
dinamycContent.forEach( c => notionDbToMdFiles(c, dryrun, writeall))
staticPages.forEach( page => notionPageToMd(page, dryrun, writeall))