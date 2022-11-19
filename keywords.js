const SPREADSHEET_URL = ''
const SHEET_NAME = ''

const HEADER_CELL_BACKGROUND = ""
const NAME_CELL_BACKGROUND = ""
const DATE_CELL_BACKGROUND = ""
const DATA_CELL_BACKGROUND = ""
const DESCRIPTION_CELL_BACKGROUND = ""

const LABEL_NAME = ''
const TODAY = getSpecifiedDate(0)
const ACCOUNT_NAMES_LIST = getAccountNames()


function main() {
    const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL)
    const sheet = spreadsheet.getSheetByName(SHEET_NAME)
    console.log('otworzylem')
    // sheet.clear()
    // SPRAWDZENIE, CZY SHEET JEST PUSTY
    if (sheet.getLastRow() === 0) {
        printTitle(sheet)
        printNames(sheet)
    } else {
        const accountNamesFromSheet = getAccountNamesFromSheet(sheet)
        if (!areArraysEqual(accountNamesFromSheet, ACCOUNT_NAMES_LIST)) {
            const notIncludedAccountNames = getNotIncludedAccountNames(ACCOUNT_NAMES_LIST, accountNamesFromSheet)
            addNotIncludedAccountNamesToSheet(sheet, notIncludedAccountNames)
        }
    }

    appendTodaysDateCell(sheet)

    const accountSelector = AdsManagerApp.accounts()
    const accountIterator = accountSelector.get()
    while(accountIterator.hasNext()) {
        const account = accountIterator.next()
        const accountName = account.getName()
        if(ACCOUNT_NAMES_LIST.includes(accountName)) {
            AdsManagerApp.select(account)
            //console.log('PRZELACZAM SIE NA KONTO', accountName)
            const accountRange = getRangeForAccountName(sheet, accountName)
            const keywordSelector = AdsApp.keywords()
            const keywordIterator = keywordSelector.get()

            let keywordsNumber = 0
            let qualitySum = 0
            while(keywordIterator.hasNext()) {
                const keyword = keywordIterator.next()
                const keywordQuality = keyword.getQualityScore()
                if(keywordQuality) {
                    keywordsNumber += 1
                    qualitySum += keywordQuality
                }
            }
            const avgQuality = getAvgQuality(qualitySum, keywordsNumber)
            const avgQualityCell = sheet.getRange(sheet.getLastRow(), accountRange)
            setCell(avgQualityCell, DATA_CELL_BACKGROUND, avgQuality, false)
            console.log('KONTO',  accountName, avgQuality)
        }
    }
}

function getAvgQuality(qualitySum, keywordsNumber) {
    if(keywordsNumber === 0) return 0
    return Math.round(qualitySum / keywordsNumber * 100) / 100
}

function setCell(cell, color, value, bold) {
    cell.setBackground(color)
    cell.setValue(value)
    if (bold) cell.setFontWeight("bold")
}

function getAccountNames() {
    const accountNames = []
    const accountSelector = AdsManagerApp.accounts()
    const accountIterator = accountSelector.get()

    while(accountIterator.hasNext()) {
        const account = accountIterator.next()
        const accountName = account.getName()
        const accountLabelSelector = account.labels()
        const accountLabelIterator = accountLabelSelector.get()
        const accountLabelsList = []

        while(accountLabelIterator.hasNext()) {
            const label = accountLabelIterator.next()
            const labelName = label.getName()
            accountLabelsList.push(labelName)
        }
        if (accountLabelsList.includes(LABEL_NAME)) {
            accountNames.push(accountName)
        }
    }

    return accountNames
}

function getAccountNamesFromSheet(sheet) {
    const accountNamesFromSheet = []
    const lastColumn = sheet.getLastColumn()
    for (let i = 2; i <= lastColumn; i += 1) {
        const nameCell = sheet.getRange(1, i)
        const accountName = nameCell.getValue()
        accountNamesFromSheet.push(accountName)
    }

    return accountNamesFromSheet
}

function getNotIncludedAccountNames(accountNames, accountNamesFromSheet) {
    const notIncludedAccountNames = []
    accountNames.forEach(accountName => {
        if (!accountNamesFromSheet.includes(accountName)) {
            notIncludedAccountNames.push(accountName)
        }
    })

    return notIncludedAccountNames
}

function printTitle(sheet) {
    sheet.setColumnWidth(1, 190)
    const titleCell = sheet.getRange(1, 1)
    setCell(titleCell, HEADER_CELL_BACKGROUND, "", true)
}

function printNames(sheet) {
    ACCOUNT_NAMES_LIST.forEach(accountName => {
        const lastColumn = sheet.getLastColumn()
        const nameCell = sheet.getRange(1, lastColumn + 1)
        setCell(nameCell, NAME_CELL_BACKGROUND, accountName, true)
    })
}

function areArraysEqual(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2)
}

function getSpecifiedDate(pastDays) { // days back from today as a parameter, returns date in YYYY-MM-DD format
    const date = new Date()
    date.setDate(date.getDate() - pastDays)
    const dateISO = date.toISOString()

    return dateISO.split(dateISO[10], 2)[0]
}

function appendTodaysDateCell(sheet) {
    const lastRow = sheet.getLastRow()
    const dateCell = sheet.getRange(lastRow + 1, 1)
    setCell(dateCell, DATE_CELL_BACKGROUND, TODAY, false)
}

function getRangeForAccountName(sheet, accountName) {
    const lastColumn = sheet.getLastColumn()
    for (let i = 2; i <= lastColumn; i += 1) {
        const nameCell = sheet.getRange(1, i)
        const nameValue = nameCell.getValue()
        if (nameValue === accountName) return i
    }
}

function getHistoricalQualityScore() {
    let query = `SELECT metrics.historical_quality_score FROM keyword_view WHERE segments.date BETWEEN "${YESTERDAY}" AND "${YESTERDAY}"`
    let report = AdsApp.search(query)

    for (const data of report) {
        console.log(data)
    }
}