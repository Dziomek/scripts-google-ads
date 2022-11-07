const LABEL_NAME = ''
const YESTERDAY = getSpecifiedDate(1)
const WEEK_AGO = getSpecifiedDate(8)
const THRESHOLD = 0 // %
const MINIMAL_DIFFERENCE = 0 // minimal click difference between YESTERDAY and WEEK_AGO

const SUBJECT = ``
const RECIPIENT = ''
const TEST_RECIPIENT = ''

let accountsNumber = 0
const accountsToCheck = []

function main() {

    console.log(YESTERDAY)
    console.log(WEEK_AGO)
    const yesterday = adjustDateFormat(YESTERDAY)
    const weekAgo = adjustDateFormat(WEEK_AGO)

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
                clicksYesterday = getClicks(account, yesterday)
                clicksWeekAgo = getClicks(account, weekAgo)
                console.log('KLIKNIECIA WCZORAJ/TYDZIEN TEMU', clicksYesterday, clicksWeekAgo)
                compareClicks(clicksYesterday, clicksWeekAgo, THRESHOLD)
            }
        }
    }
    console.log(accountsNumber)
    console.log(accountsToCheck)

    sendEmail(RECIPIENT, SUBJECT, createEmailMessage(accountsToCheck))
    sendEmail(TEST_RECIPIENT, SUBJECT, createEmailMessage(accountsToCheck))
}


function getClicksMetric(accountStats) { // auxiliary
    return accountStats.metrics.clicks
}

function getClicks(account, date) { // get clicks per day for specified account
    accountStats = account.getStatsFor(date, date)

    return getClicksMetric(accountStats)
}

function createAccountSet(clicksYesterday, clicksWeekAgo) { // creates an object that represents account's data
    const accountObject = {
        "accountName": AdsApp.currentAccount().getName(),
        "clicksYesterday": clicksYesterday,
        "clicksWeekAgo": clicksWeekAgo
    }

    return accountObject
}

function compareClicks(clicksYesterday, clicksWeekAgo, threshold) { // comparing clicks for yesterday and week ago taking into account the threshold
    const clicksLevel = Math.round(clicksWeekAgo * threshold / 100)
    const clickDifference = clicksWeekAgo - clicksYesterday
    console.log('PROG', clicksLevel)
    if (clickDifference > MINIMAL_DIFFERENCE) {
        if (clicksYesterday <= clicksLevel) {
            accountsToCheck.push(createAccountSet(clicksYesterday, clicksWeekAgo))
        }
    }
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

function displayAccountsToCheck(accountsToCheck) { // displays account data in email
    let message = ''

    accountsToCheck.forEach(account => {
        message += `
     KONTO: ${account.accountName}, 
     KLIKNIĘCIA W DNIU ${YESTERDAY}:      ${account.clicksYesterday}, 
     KLIKNIĘCIA W DNIU ${WEEK_AGO}:      ${account.clicksWeekAgo}
     `
    })

    return message
}

function createEmailMessage(accountsToCheck) { // creates a message for an email
    let body = ''

    if (accountsToCheck.length > 0) {
        body = ``
    }
    else {
        body = ``
    }

    body +=
        `
  
  
  `


    return body
}

function sendEmail(recipient, subject, body) { // sends email
    MailApp.sendEmail(recipient, subject, body)
}
