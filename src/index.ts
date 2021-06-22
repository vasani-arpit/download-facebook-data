import puppeteer from 'puppeteer-core';
import fetch from 'node-fetch';
import { createWriteStream } from "fs";
import crypto from "crypto";
let browser: puppeteer.Browser;
declare global {
    interface Window {
        totalPhotoLinks: string[]
    }
}
(async () => {
    console.log("Let's start")
    const response = await fetch('http://localhost:9222/json/version');
    const data = await response.json()
    browser = await puppeteer.connect({
        defaultViewport: null,
        browserWSEndpoint: data.webSocketDebuggerUrl
    })
    // const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log("connected with browser. Open facebook and open the album page of the profile which you want to download.")
    await page.goto("https://facebook.com")
    let pageFound = setInterval(async () => {
        let url = await page.url()
        if (url.includes("photos_albums")) {
            console.log("Got the album section. Let's start downloading")
            await page.waitForSelector('[data-pagelet="ProfileAppSection_0"] img', { timeout: 10000 }).catch(() => {
                console.log("No album found for this user.")
                process.exit(1)
            })
            let albums = await page.$$('[data-pagelet="ProfileAppSection_0"] img')
            if (albums.length == 0) {
                console.log("No album found for this user.")
                process.exit(1)
            }
            clearInterval(pageFound)
            await startScraping(page)
            console.log("Done.")
        }
    }, 1000)
})();

async function startScraping(_page: puppeteer.Page) {
    //open tabs same as albums
    let aLinks = await _page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-pagelet="ProfileAppSection_0"] img'))
            .map(e => e.closest('a').href)
    })
    for (let k = 0; k < aLinks.length; k++) {
        const link = aLinks[k];
        let aPage = await browser.newPage()
        await aPage.goto(link)
        await aPage.waitForSelector('[aria-label="Edit"]')
        //determine how many items are there
        let totalPhotos = await aPage.evaluate(() => {
            //Find another way to do this.
            //document.querySelectorAll('[aria-label="Edit"]').map(e=>e.closest('a'))[0].parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[0].querySelectorAll("span")[3]
            return parseInt((document.querySelector('[aria-label="Edit"]').closest('a').parentNode.parentNode.parentNode.parentNode.parentNode.childNodes[0] as Element).querySelectorAll("span")[3].innerText)
        })
        await aPage.evaluate(`window.totalPhotoLinks = []`)
        await aPage.evaluate(`function getImageUrls(desiredNumber) {
            return new Promise((resolve)=>{
                //get all links available
                window.desiredNumber = desiredNumber
                let photoLinks = Array.from(window.document.querySelectorAll('[aria-label="Edit"]')).map(e => e.closest('a').href)
                //put it into a var
                window.totalPhotoLinks.push(...photoLinks)
                //remove all duplicates from var
                window.totalPhotoLinks = [...new Set(window.totalPhotoLinks)]
                //check if the numbers are matched
                if (window.totalPhotoLinks.length >= desiredNumber) {
                    //we are done
                    console.log(window.totalPhotoLinks)
                    resolve(window.totalPhotoLinks)
                } else {
                    //we are not done. scroll and collect the links again
                    //window.scrollTo(0, window.document.body.scrollHeight);
                    setTimeout(()=>{
                        console.log("had to call it again")
                        getImageUrls(desiredNumber)
                    },5000)
                }
            })
        }`)
        //check if items are the same or more then that
        await aPage.evaluate((desiredNumber) => {
            console.log("calling getImageUrls")
            // @ts-ignore
            getImageUrls(desiredNumber)
        }, totalPhotos)
        await aPage.waitForFunction('window.totalPhotoLinks.length >= (window.desiredNumber-5)', { timeout: 0 })
        let photos = await aPage.evaluate(() => window.totalPhotoLinks)
        //we can do the following asynchronously but let's keep it simple for now.
        await downloadPhotos(photos)
        await aPage.close()
    }
}
async function downloadPhotos(photos: string[]) {
    //open page
    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        let page = await browser.newPage()
        await page.goto(photo)
        await page.waitForSelector('img[data-visualcompletion="media-vc-image"]')
        //get download URL
        const url = await page.evaluate(() => (document.querySelector('img[data-visualcompletion="media-vc-image"]') as HTMLImageElement).src)
        //download image
        fetch(url)
            .then(res => {
                const filename = crypto.randomBytes(16).toString("hex");
                const dest = createWriteStream(`photos/${filename}.png`);
                res.body.pipe(dest);
            });
        await page.close()
    }
}