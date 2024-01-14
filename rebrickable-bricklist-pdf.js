// MODULES:
const puppeteer     = require("puppeteer");
const HTMLparser    = require("node-html-parser");
const fs            = require('fs');
const mysettings    = require("./config.json");

// WEBSITE URL:
var baseURL = "https://rebrickable.com/";

// DOWNLOAD DIR:
if(fs.existsSync("dowload_manuals") == false){
    fs.mkdirSync("download_manuals", {
        recursive: true
    });
}

// NAMECACHE FILE:
if(!fs.existsSync("namecache")){
    fs.writeFileSync("namecache", "utf-8", "");
}

// SET ARGUMENTS:
if(process.argv.length === 2){
    console.error("Not set NUMBER ID lego set");
    process.exit(1);
} else {
    const matches = process.argv[2].match(/\[(.*?)\]/);
    if(matches){
        fs.writeFileSync("namecache", matches[1], (err) => {
            if(err){ console.error(err); }
        })
        console.log("\r\n>> " + matches[1]);
    } else {
        rebrickable_search(process.argv[2]).then((data) => {
            if(data.hasOwnProperty("detail")){
                console.log("[" + process.argv[2] + "] not found!");
            } else {
                console.log("   [" + data.set_num + "] " + data.name + " => " + data.set_url);
                rebrickable_get_table(data.set_url, process.argv[2]);
            }
        });
    }
}

// CREATE SUBDIR:
function rebrickable_subdir(name_dir){
    if(name_dir.length > 0){
        if(fs.existsSync("dowload_manuals/" + name_dir) == false){
            fs.mkdirSync("download_manuals/" + name_dir, {
                recursive: true
            });
        }
        return name_dir + "/";
    } else {
        return "";
    }
}

// SEARCH:
async function rebrickable_search(lego_set_id){
    const respo = await fetch("https://rebrickable.com/api/v3/lego/sets/" + lego_set_id + "/", {
        method: "GET",
        mode: "same-origin",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': mysettings.apikey
        },
        redirect: "follow",
        referrerPolicy: "no-referrer"
    });
    return respo.json();
}

// GET TABLE URL:
async function rebrickable_get_table(lego_url, lego_set_id){
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    await page.goto(lego_url + "#parts");
    let source = await page.content();
    await browser.close();
    var lego_table = "";
    const root = HTMLparser.parse(source);
    const a_links = root.querySelectorAll("a[href]");
    a_links.forEach((links) => {
        var href = links.attrs.href;
        if(href.includes("/inventory/") && href.includes("/parts/") && href.includes("?format=table")){
            lego_table = baseURL + href
        }
    })
    rebrickable_get_PDF(lego_table, lego_set_id, lego_set_id + ".pdf");
}

// GET TABLE DATA:
async function rebrickable_get_PDF(lego_url, lego_set_id, lego_filename){   
    const title = fs.readFileSync("namecache", "utf-8");
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    await page.goto(lego_url, { waitUntil: "networkidle0" });
    await page.type('input[name="username"]', mysettings.username);
    await page.type('input[name="password"]', mysettings.password);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    const isLogin = await page.evaluate(() => {
        return window.location.href
    });
    let source = await page.content();
    const root = HTMLparser.parse(source);
    const imgs = root.querySelectorAll("img");
    imgs.forEach((img) => {
        img.setAttribute("src", img.getAttribute("data-src"));
        img.removeAttribute("data-src");
    });       
    await browser.close();
    fs.writeFileSync("cachefile.html", root.toString(), (err) => {
        if(err) {
            console.log(err)
            throw err;
        }
    });
    rebrickable_get_PDF_save("download_manuals/" + rebrickable_subdir(title) + lego_filename, lego_set_id, title);
}

async function rebrickable_get_PDF_save(lego_filename, lego_set_id, title){
    if(title.length > 0) { title = title; } else { title = "LEGO SET: "; }
    const PDFbr = await puppeteer.launch({headless: "new"});
    const PDFp = await PDFbr.newPage();
    const cachefile = "file://" + process.cwd() + "/cachefile.html";
    await PDFp.goto(cachefile, {"waitUntil" : "networkidle0"});
    const pdf = await PDFp.pdf({
        path: lego_filename,
        margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' },
        printBackground: false,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: '<span style="font-size: 15px; width: 100%; height: 50px; color:black; margin-left: 50px;">&nbsp;' + title + '&nbsp;<strong>&nbsp;' + lego_set_id + '&nbsp;</strong></span>',
        footerTemplate: '<span style="font-size: 15px; width: 100%; margin-right: 50px; text-align: right;"> <span class="pageNumber"></span> / <span class="totalPages"></span></span>'
    });
    await PDFbr.close();
    if(fs.existsSync("cachefile.html")){
        fs.unlink("cachefile.html", (err) => { 
            if(err) { 
                console.log(err); 
                throw err; 
            } 
        });
    }
}
