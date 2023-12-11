// MODULES:
const puppeteer = require("puppeteer");
const HTMLparser = require("node-html-parser");
const fs = require('fs');

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
            if(err){
                console.error(err);
            }
        })
    } else {
        rebrickable_get_list(process.argv[2], 0);
    }
}

// CREATE DIR:
function rebrickable_get_PDF_save_dir(title){
    if(fs.existsSync("dowload_manuals/" + title) == false){
        fs.mkdirSync("download_manuals/" + title, {
            recursive: true
        });
    }
    return title;
}

// PDF:
function rebrickable_get_PDF_save(NAME_FILE, ID, title){
    (async () => {
        if(title.length > 0){
            title = title;
        } else {
            title = "LEGO SET: ";
        }
        const PDFbr = await puppeteer.launch({headless: "new"});
        const PDFp = await PDFbr.newPage();
        const cachefile = "file://" + process.cwd() + "/cachefile.html";
        await PDFp.goto(cachefile, {"waitUntil" : "networkidle0"});
        const pdf = await PDFp.pdf({
            path: NAME_FILE,
            margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' },
            printBackground: false,
            format: "A4",
            displayHeaderFooter: true,
            headerTemplate: '<span style="font-size: 15px; width: 100%; height: 50px; color:black; margin-left: 50px;">&nbsp;' + title + '&nbsp;<strong>&nbsp;' + ID + '&nbsp;</strong></span>',
            footerTemplate: '<span style="font-size: 15px; width: 100%; margin-right: 50px; text-align: right;"> <span class="pageNumber"></span> / <span class="totalPages"></span></span>'
        });
        await PDFbr.close();
        if(fs.existsSync("cachefile.html")){
            fs.unlink("cachefile.html", (err) => {
                if(err) {
                    console.log(err)
                    throw err;
                }
            });
        }
    })();
}

function rebrickable_get_PDF(URL, NAME_FILE, ID){
    (async () => {
        const tit = fs.readFileSync("namecache", "utf-8");
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: "networkidle0" });
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
            console.log("cachefile.html created.");
        });
        var SUBDIR = rebrickable_get_PDF_save_dir(tit)
        rebrickable_get_PDF_save("download_manuals/" + SUBDIR + "/" + NAME_FILE, ID, tit);
    })();
}

// GET TABLE URL:
function rebrickable_get_table(URL, ID){
    (async () => {
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.goto(URL);
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

        if(lego_table.length > 0){
            rebrickable_get_PDF(lego_table, ID + ".pdf", ID);
        } else {
            console.log("Lego set: " + ID + " not found!");
        }
    })();
}

// GET PROFILE URL:
function rebrickable_get_list(ID, pages){
    var pages_x = 0;
    if(pages == "" || pages == 0){
        pages_x = 0;
    } else {
        pages_x = pages;
    }
    (async () => {
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        
        if(pages == 0){
            await page.goto(baseURL + "sets/?q=" + ID);
        } else {
            await page.goto(baseURL + "sets/?q=" + ID + "&page=" + pages_x);
        }

        let source = await page.content();
        await browser.close();

        var lego_profile = "";
        var lego_table = "";
        const root = HTMLparser.parse(source);
        const a_links = root.querySelectorAll("a[href]");
        a_links.forEach((links) => {
            var href = links.attrs.href;

            if(href.includes("/inventory/") && href.includes("/parts/") && href.includes("?format=table")){
                lego_table = baseURL + href;
                lego_profile = "";

            } else if(  (href.includes("/sets/" + ID + "/") || href.includes("/sets/" + ID + "-1/")) && 
                        (href.includes("?inventory=1") || href.includes("?inventory=2"))
                    ){
                lego_profile = baseURL + href;
                lego_table = "";
            }

        })

        if(lego_profile.length > 0){
            rebrickable_get_table(lego_profile, ID);
        } else if(lego_table.length > 0){
            rebrickable_get_PDF(lego_table,ID+".pdf", ID);
        } else {
            if(pages_x > 10){
                console.log("Lego set: " + ID + " not found!");
            } else {
                rebrickable_get_list(ID, (pages_x+1));
            }
        }
    })();
}