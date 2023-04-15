// https://adequatica.medium.com/google-authentication-with-playwright-8233b207b71a
import * as fs from 'fs'
import * as dotenv from 'dotenv'
dotenv.config()
const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD

if (!GMAIL_USER || !GMAIL_PASSWORD) {
  throw "Error reading ENV data"
}

const authPath = 'http://localhost:3000/auth';
const envFile = '.env'; // path respecto a raiz
fs.stat(envFile, function(err, stats) {
  if (err) {
      throw "Error, cant find ENV file in sepcified path"
  }
});

// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
import { chromium } from 'playwright-extra'
import { updateDropboxToken } from './lib/dropbox.js'
// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
import stealth from 'puppeteer-extra-plugin-stealth'
const resolvedStealth = stealth()


// Add the plugin to playwright (any number of plugins can be added)
chromium.use(resolvedStealth)

// That's it, the rest is playwright usage as normal 😊
chromium.launch({ headless: false }).then(async browser => {
  const page = await browser.newPage()

  // espera que se levante el server de Astro
  await page.waitForTimeout(5000);
  await page.goto(authPath);
  await page.getByRole('link', { name: 'Authenticate' }).click();
  await page.getByRole('button', { name: 'Continuar con Google' }).click();
  
  // New Google sign in form
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', GMAIL_USER);
  await page.waitForTimeout(2000);
  await page.locator('#identifierNext >> button').click();
  await page.waitForTimeout(2000);
  await page.fill('#password >> input[type="password"]', GMAIL_PASSWORD);
  await page.waitForTimeout(2000);
  await page.locator('button >> nth=1').click();
  await page.waitForTimeout(2700);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForTimeout(2800);
  await page.getByRole('button', { name: 'Permitir' }).click();

  const authTokenElement = await page.$('[data-auth-token]');
  if (authTokenElement) {
      const authToken = await authTokenElement.innerText();
      updateDropboxToken(envFile, authToken)
  }
  await page.waitForTimeout(3000);
  await browser.close()
})