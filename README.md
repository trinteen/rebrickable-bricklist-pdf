# rebrickable-bricklist-pdf

NodeJS script generate PDF file with bricklist from website rebrickable.com



title in pdf set: "node rebrickable-bricklist-pdf.js [title]"
get lego manual: "node rebrickable-bricklist-pdf.js <--LEGO SET ID-->"

For more number use for loop script BATCH (windows) or Shell script (Linux).

Windows (BATCH):
> @echo off
> for /f "tokens=*" %%a in (numbers.txt) do (
>   echo %%a
>   node rebrickable-bricklist-pdf %%a
> )

in "numbers.txt":
> [title]
> lego-number-id
> lego-number-id
> lego-number-id


Required modules:
- puppeteer
- node-html-parser