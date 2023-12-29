const config = require("./api.json");
const fs = require("fs");
const puppeteer = require("puppeteer");

// DOWNLOAD DIR:
if(fs.existsSync("dowload_manuals") == false){
    fs.mkdirSync("download_manuals", {recursive: true});
}

// CREATE DIR:
function create_subdir(title){
    if(fs.existsSync("dowload_manuals/" + title) == false){
        fs.mkdirSync("download_manuals/" + title, {recursive: true});
    }
    return title;
}

// NAMECACHE FILE:
if(!fs.existsSync("namecache")){
    fs.writeFileSync("namecache", "utf-8", "");
}

// APP:
async function rebrickable(lego_id){
    const respo = await fetch("https://rebrickable.com/api/v3/lego/sets/" + lego_id + "/parts/", {
        method: "GET",
        mode: "same-origin",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': config["api-key"]
        },
        redirect: "follow",
        referrerPolicy: "no-referrer"
    });
    return respo.json();
}

function legoset(lego_id){
    rebrickable(lego_id).then((data) => {
        if(data.count > 0){
            var html = "";
            html+= "<html><body><style>";
            html+= "* { margin: 0; padding: 0; }";
            html+= "table { width: 100%; height: auto; border-collapse: collapse; }";
            html+= "img { width: 60px; height: auto; object-fit: contain; }";
            html+= "table, td { border: 1px solid black; }";
            html+= "td { padding: 5px 10px; text-align: center; }";
            html+= "</style><table>";
            html+= "<thead>";
            html+= "<tr>";
            html+= "<th>Image</th>";
            html+= "<th>Part num</th>";
            html+= "<th>Quantity</th>";
            html+= "<th>Color</th>";
            html+= "<th>Description</th>";
            html+= "</tr></thead><tbody>";
            var dataset = data.results;
            dataset.forEach((item) => {
                var image       = item.part.part_img_url;
                var part_mum    = item.part.part_num;
                var quantity    = item.quantity;
                var color       = item.color.name;
                var description = item.part.name;
                html+= "<tr>";
                html+= "<td><img src=\"" + image + "\"></td>";
                html+= "<td>" + part_mum + "</td>";
                html+= "<td>" + quantity + "</td>";
                html+= "<td>" + color + "</td>";
                html+= "<td>" + description + "</td>";
                html+= "</tr>";
            });
            html+= "</tbody></table></body></html>";

            //save:
            fs.writeFile(__dirname + "/cachefile.html", html, function(err){
                if(err){ return console.error(err); }
                const subdir = fs.readFileSync("namecache", "utf-8");
                create_subdir(subdir);
                rebrickable_get_PDF_save("download_manuals/" + subdir + "/" + lego_id + ".pdf", lego_id, subdir);
            })
        } else {
            console.log("Lego set ID: " + lego_id + " not found!");
        }
    });
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
        legoset(process.argv[2]);
    }
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