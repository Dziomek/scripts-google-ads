const LABEL_NAME = ''
const EXCLUDED_LABEL_NAME = ''
const WEEKS = 0
const SPREADSHEET_URL = ''
const SHEET_NAME = ""
const NAME_CELL_BACKGROUND = ""
const HEADER_CELL_BACKGROUND = ""
const DATE_CELL_BACKGROUND = ""
const DESCRIPTION_CELL_BACKGROUND = ""
const DATA_CELL_BACKGROUND = ""

let accountsNumber = 0

function main() {
    //SPREADSHEET
    const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL)
    const sheet = spreadsheet.getSheetByName(SHEET_NAME)
    sheet.setColumnWidth(1, 190)
    sheet.clear()
    appendDateCells(sheet)


    let accountSelector = AdsManagerApp
        .accounts()
    let accountIterator = accountSelector.get()

    while(accountIterator.hasNext()) {
        let account = accountIterator.next()
        AdsManagerApp.select(account)
        //console.log('PRZELACZAM SIE NA KONTO: ' + account.getName())
        accountLabelSelector = account.labels()
        accountLabelIterator = accountLabelSelector.get()

        const accountLabels = []

        while(accountLabelIterator.hasNext()) {
            label = accountLabelIterator.next()
            accountLabels.push(label.getName())
        }
        //console.log('Konto', account.getName(), 'etykiety', accountLabels)
        if (accountLabels.includes(LABEL_NAME) && !accountLabels.includes(EXCLUDED_LABEL_NAME)) {
            accountsNumber += 1
            appendNameAndDescriptionCells(sheet, account.getName())

            for (let i = WEEKS; i >= 1; i -= 1) {
                const DATE1 = getSpecifiedDate(7 + (i-1)*7)
                const DATE2 = getSpecifiedDate(1 + (i-1)*7)
                const date1 = adjustDateFormat(DATE1)
                const date2 = adjustDateFormat(DATE2)
                const conversions = getConversions(account, date1, date2)
                const cost = getCost(account, date1, date2)
                const conversionCost = getConversionCost(conversions, cost)
                /////////////
                appendConversionsCell(sheet, i, conversions)
                appendConversionCostCell(sheet, i, conversionCost)

                console.log(account.getName(), DATE1, DATE2, conversions, conversionCost)
            }
        }
    }
    console.log('Sprawdzono', accountsNumber, 'kont')
}

function setCell(cell, color, value, bold) {
    cell.setBackground(color)
    cell.setValue(value)
    if (bold) cell.setFontWeight("bold")
}

function appendConversionsCell(sheet, i, conversions) {
    let lastColumn = sheet.getLastColumn()
    let cell = sheet.getRange(WEEKS - i + 3, lastColumn - 1)
    setCell(cell, DATA_CELL_BACKGROUND, conversions, false)
}

function appendConversionCostCell(sheet, i, conversionCost) {
    let lastColumn = sheet.getLastColumn()
    let cell = sheet.getRange(WEEKS - i + 3, lastColumn)
    setCell(cell, DATA_CELL_BACKGROUND, conversionCost, false)
}

function appendNameAndDescriptionCells(sheet, accountName) {
    let lastColumn = sheet.getLastColumn()
    let nameCell = sheet.getRange(1, lastColumn + 1)
    setCell(nameCell, NAME_CELL_BACKGROUND, accountName, true)
    lastColumn = sheet.getLastColumn()
    let conversionsCell = sheet.getRange(2, lastColumn)
    let conversionsCostCell = sheet.getRange(2, lastColumn + 1)
    setCell(conversionsCell, DESCRIPTION_CELL_BACKGROUND, "KONWERSJE", true)
    setCell(conversionsCostCell, DESCRIPTION_CELL_BACKGROUND, "KOSZT KONW.", true)
}

function appendDateCells(sheet) {
    const cell1 = sheet.getRange(1, 1)
    setCell(cell1, HEADER_CELL_BACKGROUND, "KONW. / KOSZT KONW.", true)
    const cell2 = sheet.getRange(2, 1)
    setCell(cell2, DESCRIPTION_CELL_BACKGROUND, "DATA", true)

    for (let i = WEEKS; i >= 1; i -= 1) {
        const DATE1 = getSpecifiedDate(7 + (i-1)*7)
        const DATE2 = getSpecifiedDate(1 + (i-1)*7)
        const lastColumn = sheet.getLastColumn()
        const cell = sheet.getRange(WEEKS - i + 3, lastColumn)
        setCell(cell, DATE_CELL_BACKGROUND, `${DATE1} - ${DATE2}`, false)
    }
}

function getConversionCost(conversions, cost) {
    if (conversions === 0) return 0

    return (Math.round((cost/conversions)*100))/100
}

function getConversions(account, date1, date2) {
    const accountStats = account.getStatsFor(date1, date2)
    const conversions = accountStats.getConversions()

    return (Math.round(conversions * 100))/100
}

function getCost(account, date1, date2) {
    const accountStats = account.getStatsFor(date1, date2)
    const cost = accountStats.getCost()

    return cost
}

function getSpecifiedDate(pastDays) { // days back from today as a parameter, returns date in YYYY-MM-DD format
    const date = new Date()
    date.setDate(date.getDate() - pastDays)
    const dateISO = date.toISOString()

    return dateISO.split(dateISO[10], 2)[0]
}

function adjustDateFormat(date) { // returns appropriate for getStatsFor() date format
    let formattedDate = ''
    const dateElements = date.split('-')
    dateElements.forEach(element => {
        formattedDate += element
    })

    return formattedDate
}