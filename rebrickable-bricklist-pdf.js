// CHANGE - LOGIN INFORMATION
var rebrickable_usr = "--username--";
var rebrickable_pwd = "--password--";


// MODULES:
const puppeteer = require("puppeteer");
const HTMLparser = require("node-html-parser");
const fs = require('fs');
var rebrickable_url = "https://rebrickable.com/";

// DOWNLOAD DIR:
if(fs.existsSync("dowload_manuals") == false){
    fs.mkdirSync("download_manuals", { recursive: true });
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
    } else {
        rebrickable_search(process.argv[2], 0);
    }
}

// CREATE SUBDIR:
function rebrickable_subdir(name_dir){
    if(name_dir.length > 0){
        if(fs.existsSync("dowload_manuals/" + name_dir) == false){
            fs.mkdirSync("download_manuals/" + name_dir, { recursive: true });
        }
        return name_dir + "/";
    } else {
        return "";
    }
}

// SEARCH:
function rebrickable_search(lego_set_id, pages){
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
            await page.goto(rebrickable_url + "sets/?q=" + lego_set_id);
        } else {
            await page.goto(rebrickable_url + "sets/?q=" + lego_set_id + "&page=" + pages_x);
        }
        let source = await page.content();
        await browser.close();
        var lego_table = "";
        const root = HTMLparser.parse(source);
        const not_found = root.querySelectorAll("div#inventory_sets p.mt-10");
        if(not_found.length == 0){
            const a_links = root.querySelectorAll("a[href]");
            a_links.forEach((links) => {
                var href = links.attrs.href;
                if( (href.includes("/sets/" + lego_set_id + "/") || href.includes("/sets/" + lego_set_id + "-1/") || href.includes("/sets/" + lego_set_id + "-2/")) &&
                    (href.includes("?inventory=1") || href.includes("?inventory=2"))){
                        lego_table = rebrickable_url + href + "#parts";
                } else if( (href.includes("/inventory/") && href.includes("/parts/") && href.includes("?format=table"))) {
                        lego_table = "";
                }
            })
            if(lego_table.length > 0){
                rebrickable_get_table(lego_table, lego_set_id);
            } else {
                rebrickable_search(lego_set_id, (pages_x+1));
            }
        } else {
            console.log("Lego set: " + lego_set_id + " not found!");
        }
    })();
}

// GET TABLE URL:
function rebrickable_get_table(rebrickable_url_table, lego_set_id){
    (async () => {
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.goto(rebrickable_url_table);
        let source = await page.content();
        await browser.close()
        var lego_table = "";
        const root = HTMLparser.parse(source);
        const a_links = root.querySelectorAll("a[href]");
        a_links.forEach((links) => {
            var href = links.attrs.href;
            if(href.includes("/inventory/") && href.includes("/parts/") && href.includes("?format=table")){
                lego_table = rebrickable_url + href
            }
        })
        if(lego_table.length > 0){
            rebrickable_get_PDF(lego_table, lego_set_id, lego_set_id + ".pdf");
        }
    })();
}

// Make PDF:
function rebrickable_get_PDF(rebrickable_get_table, lego_set_id, rebrickable_name_file_pdf){
    (async () => {
        const title = fs.readFileSync("namecache", "utf-8");
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.goto(rebrickable_get_table, { waitUntil: "networkidle0" });
        await page.type('input[name="username"]', rebrickable_usr);
        await page.type('input[name="password"]', rebrickable_pwd);
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
            console.log("cachefile.html created.");
        });
        rebrickable_save_PDF("download_manuals/" + rebrickable_subdir(title) + rebrickable_name_file_pdf, lego_set_id, title);
    })();
}

// Save PDF:
function rebrickable_save_PDF(rebrickable_name_file_pdf, lego_set_id, title){
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
            path: rebrickable_name_file_pdf,
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
                    console.log(err)
                    throw err;
                }
            });
        }
    })();
}