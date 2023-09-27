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

// SET ARGUMENTS:
if(process.argv.length === 2){
    console.error("Not set NUMBER ID lego set");
    process.exit(1);
} else {
    rebrickable_get_list(process.argv[2]);
}

// PDF:
function rebrickable_get_PDF_save(NAME_FILE, ID){
    (async () => {
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
            headerTemplate: '<span style="font-size: 15px; width: 100%; height: 50px; color:black; margin-left: 50px;"> LEGO ID SET: <strong>' + ID + '</strong></span>',
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
        rebrickable_get_PDF_save("download_manuals/" + NAME_FILE, ID);
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
function rebrickable_get_list(ID){
    (async () => {
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.goto(baseURL + "sets/?q=" + ID);
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
            } else if(href.includes(ID) && href.includes("?inventory=1") && href.includes("/sets/")){
                lego_profile = baseURL + href;
                lego_table = "";
            }

        })

        if(lego_profile.length > 0){
            rebrickable_get_table(lego_profile, ID);
        } else if(lego_table.length > 0){
            rebrickable_get_PDF(lego_table,ID+".pdf", ID);
        } else {
            console.log("Kego set: " + ID + " not found!");
        }
    })();
}