# rebrickable-bricklist-pdf

NodeJS script generate PDF file with bricklist from website rebrickable.com with log-in user



title in pdf set: "node rebrickable-bricklist-pdf.js [title]"

get lego manual: "node rebrickable-bricklist-pdf.js <--LEGO SET ID-->"

For more number use for loop script BATCH (windows) or Shell script (Linux).

Windows (BATCH):
> @echo off
>
> chcp 65001
>
> for /f "tokens=*" %%a in (numbers.txt) do (
>
>   echo %%a
>
>   node rebrickable-bricklist-pdf "%%a"
>
> )

in "numbers.txt":
> [title]
>
> lego-number-id
>
> lego-number-id
>
> lego-number-id


Required modules:
- puppeteer
- node-html-parser
