const LABEL_NAME = ''
const WEEKS = 0
const SPREADSHEET_URL = ''
const SHEET_NAME = ""
const NAME_CELL_BACKGROUND = ""
const HEADER_CELL_BACKGROUND = ""
const DATE_CELL_BACKGROUND = ""
const DESCRIPTION_CELL_BACKGROUND = ""
const DATA_CELL_BACKGROUND = ""
const EXPLANATION_CELL_BACKGROUND = ""

let accountsNumber = 0

function main() {

    const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
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
        console.log('PRZELACZAM SIE NA KONTO: ' + account.getName())
        accountLabelSelector = account.labels()
        accountLabelIterator = accountLabelSelector.get()

        while(accountLabelIterator.hasNext()) {
            label = accountLabelIterator.next()
            if (label.getName() == LABEL_NAME) {
                accountsNumber += 1
                appendNameAndDescriptionCells(sheet, account.getName())

                //console.log(account.getName())
                for (let i = WEEKS; i >= 1; i -= 1) {
                    const DATE1 = getSpecifiedDate(7 + (i-1)*7)
                    const DATE2 = getSpecifiedDate(1 + (i-1)*7)
                    const formattedDate1 = adjustDateFormat(DATE1)
                    const formattedDate2 = adjustDateFormat(DATE2)
                    const conversionsValue = getConversionsValue(account, DATE1, DATE2)
                    const cost = getCost(account, formattedDate1, formattedDate2)
                    const conversionsValuePerCost = getConversionsValuePerCost(conversionsValue, cost)
                    console.log(conversionsValuePerCost)
                    /////////////
                    appendConversionsValueCell(sheet, i, conversionsValue)
                    appendConversionsValuePerCostCell(sheet, i, conversionsValuePerCost)
                }
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

function appendConversionsValueCell(sheet, i, conversionsValue) {
    let lastColumn = sheet.getLastColumn()
    let cell = sheet.getRange(WEEKS - i + 3, lastColumn - 1)
    setCell(cell, DATA_CELL_BACKGROUND, Math.round(conversionsValue), false)
}

function appendConversionsValuePerCostCell(sheet, i, conversionsValuePerCost) {
    let lastColumn = sheet.getLastColumn()
    let cell = sheet.getRange(WEEKS - i + 3, lastColumn)
    setCell(cell, DATA_CELL_BACKGROUND, conversionsValuePerCost, false)
}

function appendNameAndDescriptionCells(sheet, accountName) {
    let lastColumn = sheet.getLastColumn()
    let nameCell = sheet.getRange(1, lastColumn + 1)
    setCell(nameCell, NAME_CELL_BACKGROUND, accountName, true)
    lastColumn = sheet.getLastColumn()
    let conversionsCell = sheet.getRange(2, lastColumn)
    let conversionsCostCell = sheet.getRange(2, lastColumn + 1)
    setCell(conversionsCell, DESCRIPTION_CELL_BACKGROUND, "WK", true)
    setCell(conversionsCostCell, DESCRIPTION_CELL_BACKGROUND, "WK/K", true)
}

function appendDateCells(sheet) {
    const cell1 = sheet.getRange(1, 1)
    setCell(cell1, HEADER_CELL_BACKGROUND, "WK ORAZ WK/K", true)
    const cell2 = sheet.getRange(2, 1)
    setCell(cell2, DESCRIPTION_CELL_BACKGROUND, "DATA", true)

    for (let i = WEEKS; i >= 1; i -= 1) {
        const DATE1 = getSpecifiedDate(7 + (i-1)*7)
        const DATE2 = getSpecifiedDate(1 + (i-1)*7)
        const lastColumn = sheet.getLastColumn()
        const cell = sheet.getRange(WEEKS - i + 3, lastColumn)
        setCell(cell, DATE_CELL_BACKGROUND, `${DATE1} - ${DATE2}`, false)
    }
    const descCell1 = sheet.getRange(sheet.getLastRow() + 1, 1)
    setCell(descCell1, EXPLANATION_CELL_BACKGROUND, "WK - wartość konwersji", true)
    const descCell2 = sheet.getRange(sheet.getLastRow() + 1, 1)
    setCell(descCell2, EXPLANATION_CELL_BACKGROUND, "WK/K - wartość konw./koszt", true)
}

function getConversionsValuePerCost(conversionsValue, cost) {
    if (cost === 0) return 0

    return (Math.round((conversionsValue/cost)*100))/100
}

function getCost(account, date1, date2) {
    const accountStats = account.getStatsFor(date1, date2)
    const cost = accountStats.getCost()

    return cost
}

function getConversionsValue(account, date1, date2) {
    const query =
        `SELECT metrics.conversions_value FROM campaign
        WHERE segments.date BETWEEN "${date1}" AND "${date2}"`

    const report = AdsApp.search(query)
    let conversionsValue = 0
    for (const row of report) {
        conversionsValue += row.metrics.conversionsValue
    }

    return conversionsValue
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