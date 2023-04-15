// https://adequatica.medium.com/google-authentication-with-playwright-8233b207b71a
import * as fs from 'fs'

const authPath = 'http://localhost:3000/auth';
const envFile = '.env'; // path respecto a raiz
fs.stat(envFile, function(err, stats) {
  if (err) {
      throw "Error, cant find ENV file in sepcified path"
  }
  console.log("ok: ENV file is found on specified path")
});

import { chromium } from 'playwright'

chromium.launch({ headless: false }).then(async browser => {
  const page = await browser.newPage()
  // espera que se levante el server de Astro
  await page.waitForTimeout(6000);
  await page.goto(authPath);
  await page.waitForTimeout(3000);
  await browser.close()
})