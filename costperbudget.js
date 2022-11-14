const SPREADSHEET_URL = ''
const SHEET_NAME = ''

const HEADER_CELL_BACKGROUND = ""
const NAME_CELL_BACKGROUND = ""
const DATE_CELL_BACKGROUND = ""
const DATA_CELL_BACKGROUND = ""
const DESCRIPTION_CELL_BACKGROUND = ""

const LABEL_NAME = ''
const YESTERDAY = getSpecifiedDate(1)
const ACCOUNT_NAMES_LIST = getAccountNames()

function main() {
    const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL)
    const sheet = spreadsheet.getSheetByName(SHEET_NAME)
    // sheet.clear()
    // SPRAWDZENIE, CZY SHEET JEST PUSTY
    if (sheet.getLastRow() === 0) {
        printTitle(sheet)
        printNamesAndDescription(sheet)
    } else {
        const accountNamesFromSheet = getAccountNamesFromSheet(sheet)
        if (!areArraysEqual(accountNamesFromSheet, ACCOUNT_NAMES_LIST)) {
            const notIncludedAccountNames = getNotIncludedAccountNames(ACCOUNT_NAMES_LIST, accountNamesFromSheet)
            addNotIncludedAccountNamesToSheet(sheet, notIncludedAccountNames)
        }
    }

    ////////////////////////////////////

    appendYesterdayDateCell(sheet)

    const accountSelector = AdsManagerApp.accounts()
    const accountIterator = accountSelector.get()
    while(accountIterator.hasNext()) {
        const account = accountIterator.next()
        const accountName = account.getName()
        if(ACCOUNT_NAMES_LIST.includes(accountName)) {
            AdsManagerApp.select(account)
            const accountRange = getRangeForAccountName(sheet, accountName)
            const cost = getYesterdaysCost(account)
            const budget = getYesterdaysBudget(account)
            const costPerBudget = getCostPerBudget(cost, budget)
            printCostCell(sheet, cost, accountRange)
            printBudgetCell(sheet, budget, accountRange)
            printCostPerBudgetCell(sheet, costPerBudget, accountRange)

            console.log('KONTO', accountName, 'KOSZT', cost, 'BUDZET', budget)
        }
    }
}

function printCostCell(sheet, cost, accountRange) {
    const lastRow = sheet.getLastRow()
    const costCell = sheet.getRange(lastRow, accountRange - 1)
    setCell(costCell, DATA_CELL_BACKGROUND, Math.round(cost * 100) / 100, false)
}

function printBudgetCell(sheet, budget, accountRange) {
    const lastRow = sheet.getLastRow()
    const budgetCell = sheet.getRange(lastRow, accountRange)
    setCell(budgetCell, DATA_CELL_BACKGROUND, budget, false)
}

function printCostPerBudgetCell(sheet, costPerBudget, accountRange) {
    const lastRow = sheet.getLastRow()
    const costPerBudgetCell = sheet.getRange(lastRow, accountRange + 1)
    setCell(costPerBudgetCell, DATA_CELL_BACKGROUND, costPerBudget, false)
}

function getCostPerBudget(cost, budget) {
    if (budget === 0) return 0
    return Math.round(cost / budget * 100) / 100
}

function getYesterdaysBudget2(account) {
    const enabledCampaigns = []
    const budgetsOfEnabled = []

    const campaignSelector = AdsApp.campaigns()
    const campaignIterator = campaignSelector.get()
    while(campaignIterator.hasNext()) {
        const campaign = campaignIterator.next()
        if ('a' === 'a') {
            enabledCampaigns.push(campaign.getName())
        }
    }

    const performanceMaxCampaignSelector = AdsApp.performanceMaxCampaigns()
    const performanceMaxCampaignIterator = performanceMaxCampaignSelector.get()
    while(performanceMaxCampaignIterator.hasNext()) {
        const campaign = performanceMaxCampaignIterator.next()
        if ('a' === 'a') {
            enabledCampaigns.push(campaign.getName())
        }
    }
    console.log(enabledCampaigns)

    return 0
}

function getYesterdaysBudget(account) {
    let query = `SELECT campaign.status, campaign.name, campaign.campaign_budget FROM campaign WHERE segments.date BETWEEN "${YESTERDAY}" AND "${YESTERDAY}"`
    let report = AdsApp.search(query)
    const enabledCampaigns = []
    const budgetsOfEnabled = []

    let dailyBudget = 0

    for (const data of report) {
        if (data.campaign.status === 'ENABLED') {
            enabledCampaigns.push(data.campaign.name)
            budgetsOfEnabled.push(data.campaign.campaignBudget)
        }
    }

    //console.log('ACCOUNT', account.getName(), 'BUDGETS:', budgetsOfEnabled, 'NAMES:', enabledCampaigns)


    query = `SELECT campaign_budget.amount_micros, campaign_budget.name FROM campaign_budget WHERE segments.date BETWEEN "${YESTERDAY}" AND "${YESTERDAY}"`
    report = AdsApp.search(query)

    for (const data of report) {
        const campaignName = data.campaignBudget.name
        if (enabledCampaigns.includes(campaignName) && budgetsOfEnabled.includes(data.campaignBudget.resourceName)) {
            const amount = data.campaignBudget.amountMicros / 1000000
            dailyBudget += amount
        }
    }

    return dailyBudget
}

function getRangeForAccountName(sheet, accountName) {
    const lastColumn = sheet.getLastColumn()
    for (let i = 3; i <= lastColumn; i += 3) {
        const nameCell = sheet.getRange(1, i)
        const nameValue = nameCell.getValue()
        if (nameValue === accountName) return i
    }
}

function setCell(cell, color, value, bold) {
    cell.setBackground(color)
    cell.setValue(value)
    if (bold) cell.setFontWeight("bold")
}

function printTitle(sheet) {
    sheet.setColumnWidth(1, 190)
    const titleCell = sheet.getRange(1, 1)
    setCell(titleCell, HEADER_CELL_BACKGROUND, "WYDATKI / BUDŻET", true)
}

function printNamesAndDescription(sheet) {
    ACCOUNT_NAMES_LIST.forEach(accountName => {
        const lastColumn = sheet.getLastColumn()
        const nextHop = 2
        const nameCell = sheet.getRange(1, lastColumn + nextHop)
        setCell(nameCell, NAME_CELL_BACKGROUND, accountName, true)
        printDescriptionCells(sheet)
    })
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
    for (let i = 3; i <= lastColumn; i += 3) {
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

function addNotIncludedAccountNamesToSheet(sheet, notIncludedAccountNames) {
    notIncludedAccountNames.forEach(accountName => {
        const lastColumn = sheet.getLastColumn()
        const nameCell = sheet.getRange(1, lastColumn + 2)
        setCell(nameCell, NAME_CELL_BACKGROUND, accountName, true)
        printDescriptionCells(sheet)
    })
}

function printDescriptionCells(sheet) {
    const lastColumn = sheet.getLastColumn()
    const dateCell = sheet.getRange(2, 1)
    setCell(dateCell, DESCRIPTION_CELL_BACKGROUND, 'DATA', true)
    const costCell = sheet.getRange(2, lastColumn - 1)
    const budgetCell = sheet.getRange(2, lastColumn)
    const costPerBudgetCell = sheet.getRange(2, lastColumn + 1)
    setCell(costCell, DESCRIPTION_CELL_BACKGROUND, 'KOSZT', true)
    setCell(budgetCell, DESCRIPTION_CELL_BACKGROUND, 'BUDŻET', true)
    setCell(costPerBudgetCell, DESCRIPTION_CELL_BACKGROUND, 'K / B', true)
}

function areArraysEqual(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2)
}

function appendYesterdayDateCell(sheet) {
    const lastRow = sheet.getLastRow()
    const dateCell = sheet.getRange(lastRow + 1, 1)
    setCell(dateCell, DATE_CELL_BACKGROUND, YESTERDAY, false)
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

function getYesterdaysCost(account, day) {
    const formattedDay = adjustDateFormat(YESTERDAY)
    const accountStats = account.getStatsFor(formattedDay, formattedDay)
    const cost = accountStats.getCost()

    return cost
}