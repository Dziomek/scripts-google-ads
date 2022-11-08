// DATES ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const YESTERDAY = getSpecifiedDate(1)
const THIRTY_DAYS_AGO = getSpecifiedDate(30)
const yesterday = adjustDateFormat(YESTERDAY)
const thirty_days_ago = adjustDateFormat(THIRTY_DAYS_AGO)
const DAYS_TO_CHECK = 30

// SHEET ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const SPREADSHEET_URL = ''
const SHEET_NAME = ""
const NAME_CELL_BACKGROUND = ""
const HEADER_CELL_BACKGROUND = ""
const DATE_CELL_BACKGROUND = ""
const DESCRIPTION_CELL_BACKGROUND = ""
const DATA_CELL_BACKGROUND = ""
const TOTAL_CELL_BACKGROUND = ""

// SCRIPT ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const LABEL_NAME = ''
let accountsNumber = 0
let activeCampaignsNumber = 0

// FUNCTIONS ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function appendCostPerBudgetCell(sheet, i, costPerBudget) {
    let lastColumn = sheet.getLastColumn()
    let cell = sheet.getRange(DAYS_TO_CHECK - i + 3, lastColumn)
    setCell(cell, DATA_CELL_BACKGROUND, costPerBudget, false)
}

function appendTotalCostPerBudgetCell(sheet, costPerBudget) {
    let lastColumn = sheet.getLastColumn()
    let lastRow = sheet.getLastRow()
    let cell = sheet.getRange(lastRow, lastColumn)
    setCell(cell, TOTAL_CELL_BACKGROUND, costPerBudget, true)
}

function getCostPerDailyBudget(cost, budget) {
    if (cost === 0 && budget === 0) {
        return '-'
    } else if (budget === 0) {
        return '-'
    }
    return Math.round( (cost / budget) * 100 ) / 100
}

function appendTotalBudgetCell(sheet, budget) {
    let lastColumn = sheet.getLastColumn()
    let lastRow = sheet.getLastRow()
    let cell = sheet.getRange(lastRow, lastColumn - 1)
    setCell(cell, TOTAL_CELL_BACKGROUND, budget, true)
}

function appendBudgetCell(sheet, i, budget) {
    let lastColumn = sheet.getLastColumn()
    let cell = sheet.getRange(DAYS_TO_CHECK - i + 3, lastColumn - 1)
    setCell(cell, DATA_CELL_BACKGROUND, budget, false)
}

function appendTotalCostCell(sheet, cost) {
    let lastColumn = sheet.getLastColumn()
    let lastRow = sheet.getLastRow()
    let cell = sheet.getRange(lastRow, lastColumn - 2)
    setCell(cell, TOTAL_CELL_BACKGROUND, cost, true)
}

function appendCostCell(sheet, i, cost) {
    let lastColumn = sheet.getLastColumn()
    let cell = sheet.getRange(DAYS_TO_CHECK - i + 3, lastColumn - 2)
    setCell(cell, DATA_CELL_BACKGROUND, cost, false)
}

function appendNameAndDescriptionCells(sheet, accountName) {
    let lastColumn = sheet.getLastColumn()
    let nameCell = sheet.getRange(1, lastColumn + 2)
    setCell(nameCell, NAME_CELL_BACKGROUND, accountName, true)
    lastColumn = sheet.getLastColumn()
    let costCell = sheet.getRange(2, lastColumn - 1)
    let budgetCell = sheet.getRange(2, lastColumn)
    let costPerBudgetCell = sheet.getRange(2, lastColumn + 1)
    setCell(costCell, DESCRIPTION_CELL_BACKGROUND, "KOSZT", true)
    setCell(budgetCell, DESCRIPTION_CELL_BACKGROUND, "BUDŻET", true)
    setCell(costPerBudgetCell, DESCRIPTION_CELL_BACKGROUND, "K / B", true)
}

function setCell(cell, color, value, bold) {
    cell.setBackground(color)
    cell.setValue(value)
    if (bold) cell.setFontWeight("bold")
}

function appendDateCells(sheet) {
    const cell1 = sheet.getRange(1, 1)
    setCell(cell1, HEADER_CELL_BACKGROUND, "WYDATKI / BUDŻET", true)
    const cell2 = sheet.getRange(2, 1)
    setCell(cell2, DESCRIPTION_CELL_BACKGROUND, "DATA", true)

    for (let i = 30; i >= 1; i -= 1) {
        const lastColumn = sheet.getLastColumn()
        const cell = sheet.getRange(DAYS_TO_CHECK - i + 3, lastColumn)
        setCell(cell, DATE_CELL_BACKGROUND, `${getSpecifiedDate(i)}`, false)
    }
    const lastCell = sheet.getRange(sheet.getLastRow() + 1, sheet.getLastColumn())
    setCell(lastCell, TOTAL_CELL_BACKGROUND, 'ŁĄCZNIE', true)
}

function getCampaignDailyDataAndWrite(day, next_day, account, sheet, i) {
    console.log(day, next_day)
    let query = `SELECT campaign.status, campaign.name, campaign.campaign_budget FROM campaign WHERE segments.date BETWEEN "${day}" AND "${day}"`
    let report = AdsApp.search(query)
    const namesOfEnabled = []
    const budgetsOfEnabled = []

    let dailyBudget = 0

    for (const data of report) {
        if (data.campaign.status === 'ENABLED') {
            namesOfEnabled.push(data.campaign.name)
            budgetsOfEnabled.push(data.campaign.campaignBudget)
        }
    }

    //console.log('NAMES:', namesOfEnabled)
    //console.log('BUDGETS:', budgets)

    query = `SELECT campaign_budget.amount_micros, campaign_budget.name FROM campaign_budget WHERE segments.date BETWEEN "${day}" AND "${day}"`
    report = AdsApp.search(query)

    for (const data of report) {
        console.log(data)
        const name = data.campaignBudget.name
        if (namesOfEnabled.includes(name) && budgetsOfEnabled.includes(data.campaignBudget.resourceName)) {
            const amount = data.campaignBudget.amountMicros / 1000000
            console.log(name, amount)
            dailyBudget += amount
        }
    }

    const cost = getDailyCost(account, day)
    const costPerDailyBudget = getCostPerDailyBudget(cost, dailyBudget)
    console.log('DZIEN', day, 'BUDZET', dailyBudget, 'KOSZT', cost, 'STOSUNEK', costPerDailyBudget)

    // SHEET
    appendCostCell(sheet, i, Math.round(cost * 100) / 100)
    appendBudgetCell(sheet, i, Math.round(dailyBudget * 100) / 100)
    appendCostPerBudgetCell(sheet, i, costPerDailyBudget)

    return dailyBudget
}

function getDailyCost(account, day) {
    const formattedDay = adjustDateFormat(day)
    const accountStats = account.getStatsFor(formattedDay, formattedDay)
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

// MAIN ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function main() {
    console.log(YESTERDAY, THIRTY_DAYS_AGO)

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
        const account = accountIterator.next()
        AdsManagerApp.select(account)
        console.log('PRZELACZAM SIE NA KONTO: ' + account.getName())
        accountLabelSelector = account.labels()
        accountLabelIterator = accountLabelSelector.get()

        while(accountLabelIterator.hasNext()) {
            label = accountLabelIterator.next()
            if (label.getName() === LABEL_NAME) {
                appendNameAndDescriptionCells(sheet, account.getName())
                accountsNumber += 1

                let monthBudget = 0
                for(let i=30; i>=1; i--) {
                    monthBudget += getCampaignDailyDataAndWrite(getSpecifiedDate(i), getSpecifiedDate(i-1), account, sheet, i)
                }
                //console.log(monthBudget)

                const accountStats = account.getStatsFor(thirty_days_ago, yesterday)
                const cost = accountStats.getCost()
                const costPerBudget = getCostPerDailyBudget(cost, monthBudget)
                appendTotalCostCell(sheet, Math.round(cost * 100) / 100)
                appendTotalBudgetCell(sheet, Math.round(monthBudget * 100) / 100)
                appendTotalCostPerBudgetCell(sheet, costPerBudget)
                console.log('WYDATKI ZE STATYSTYK:', cost, 'BUDZET', monthBudget, 'KONTO', account.getName())
            }
        }
    }
}