const LABEL_NAME = ''
const WEEKS = 0
const SPREADSHEET_URL = ''
const SHEET_WKK_NAME = ""
const SHEET_WK_NAME = ""

let accountsNumber = 0

function main() {

    const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    const sheet = spreadsheet.getSheetByName(SHEET_WKK_NAME)
    const sheet2 = spreadsheet.getSheetByName(SHEET_WK_NAME)
    spreadsheet.setColumnWidth(1, 190)
    sheet.clear()
    appendSheetDates(sheet, SHEET_WKK_NAME)
    sheet2.clear()
    appendSheetDates(sheet2, SHEET_WK_NAME)

    let accountSelector = AdsManagerApp
        .accounts()

    let accountIterator = accountSelector.get()

    while(accountIterator.hasNext()) {
        let account = accountIterator.next()
        AdsManagerApp.select(account)
        //console.log('PRZELACZAM SIE NA KONTO: ' + account.getName())
        accountLabelSelector = account.labels()
        accountLabelIterator = accountLabelSelector.get()

        while(accountLabelIterator.hasNext()) {
            label = accountLabelIterator.next()
            if (label.getName() == LABEL_NAME) {
                const lastColumn = sheet.getLastColumn()
                const lastColumn2 = sheet2.getLastColumn()
                const nameCell = sheet.getRange(1, lastColumn + 1)
                const nameCell2 = sheet2.getRange(1, lastColumn2 + 1)
                nameCell.setValue(account.getName())
                nameCell.setBackground('#F4F3E8')
                nameCell2.setValue(account.getName())
                nameCell2.setBackground('#F4F3E8')
                accountsNumber += 1
                console.log(account.getName())
                for (let i = WEEKS; i >= 1; i -= 1) {
                    const DATE1 = getSpecifiedDate(7 + (i-1)*7)
                    const DATE2 = getSpecifiedDate(1 + (i-1)*7)
                    const formattedDate1 = adjustDateFormat(DATE1)
                    const formattedDate2 = adjustDateFormat(DATE2)
                    console.log(DATE1, DATE2)
                    const conversionsValue = getConversionsValue(account, DATE1, DATE2)
                    const cost = getCost(account, formattedDate1, formattedDate2)
                    const conversionsValuePerCost = getConversionsValuePerCost(conversionsValue, cost)
                    console.log(conversionsValuePerCost)

                    const cell = sheet.getRange(WEEKS - i + 2, lastColumn + 1)
                    cell.setValue(conversionsValuePerCost)
                    cell.setBackground("#F1F1F1")

                    const cell2 = sheet2.getRange(WEEKS - i + 2, lastColumn2 + 1)
                    cell2.setValue(Math.round(conversionsValue))
                    cell2.setBackground("#F1F1F1")
                }
            }
        }
    }
    console.log('Sprawdzono', accountsNumber, 'kont')
}

function appendSheetDates(sheet, name) {

    sheet.appendRow([name])
    const cell1 = sheet.getRange(1, 1)
    cell1.setFontWeight("bold")
    cell1.setBackground("#86DADE")

    for (let i = WEEKS; i >= 1; i -= 1) {
        const DATE1 = getSpecifiedDate(7 + (i-1)*7)
        const DATE2 = getSpecifiedDate(1 + (i-1)*7)
        const cell = `${DATE1} - ${DATE2}`

        sheet.appendRow([cell])
        const lastColumn = sheet.getLastColumn()
        const currentCell = sheet.getRange(i+1, lastColumn)
        currentCell.setBackground('#EFF5F6')
    }

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