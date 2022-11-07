const YESTERDAY = getSpecifiedDate(1)
const TWO_DAYS_AGO = getSpecifiedDate(2)
const LABEL_NAME = ''
const THRESHOLD = 0 // campaignDailyCost > threshold / 100 * campaignDailyBudget
const EXCLUDED = ''

const SUBJECT = ``
const RECIPIENT = ''
const TEST_RECIPIENT = ''

function main() {
    const yesterday = adjustDateFormat(YESTERDAY)
    const two_days_ago = adjustDateFormat(TWO_DAYS_AGO)
    let campaignsNumber = 0
    let accountsNumber = 0
    const campaignsToCheck = []

    console.log(yesterday)

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
            if (label.getName() == LABEL_NAME) {

                accountsNumber += 1

                ///////////////// CAMPAIGNS //////////////////

                let campaignsSelector = AdsApp
                    .campaigns()
                let campaignsIterator = campaignsSelector.get()
                campaignsNumber += getCampaignDataAndPush(campaignsIterator, campaignsToCheck, EXCLUDED, THRESHOLD, yesterday, two_days_ago)

                ///////////////// PERFORMANCE MAX CAMPAIGNS //////////////////

                let performanceMaxCampaignsSelector = AdsApp.performanceMaxCampaigns()
                let performanceMaxCampaignsIterator = performanceMaxCampaignsSelector.get()
                campaignsNumber += getCampaignDataAndPush(performanceMaxCampaignsIterator, campaignsToCheck, EXCLUDED, THRESHOLD, yesterday, two_days_ago)


            }
        }
    }
    sendEmail(TEST_RECIPIENT, SUBJECT, createEmailMessage(campaignsToCheck, accountsNumber, campaignsNumber))
    //sendEmail(RECIPIENT, SUBJECT, createEmailMessage(campaignsToCheck))
    console.log(campaignsNumber)
    console.log(accountsNumber)
    console.log(campaignsToCheck)
}

function getCampaignDataAndPush(campaignTypeIterator, campaignsToCheck, EXCLUDED, THRESHOLD, yesterday, two_days_ago) {
    let activeCampaignsNumber = 0
    while(campaignTypeIterator.hasNext()) {
        const campaign = campaignTypeIterator.next()
        if (campaign.isEnabled()) {
            console.log(campaign.getName())
            activeCampaignsNumber += 1
            if (!ifIncludes(campaign.getName(), EXCLUDED)) {
                const campaignBudget = campaign.getBudget()
                const campaignDailyBudget = campaignBudget.getAmount() // dzienny budzet kampanii
                const budgetStats = campaignBudget.getStatsFor(yesterday, yesterday)
                const campaignDailyCost = budgetStats.getCost() // rzeczywiste wydatki kampanii
                console.log(campaign.getName(), campaignBudget.getAmount(), budgetStats.getCost())
                if (campaignDailyCost >= 1) {
                    if (!checkDailyCost(campaignDailyBudget, campaignDailyCost, THRESHOLD)) {
                        const budgetPreviousStats = campaignBudget.getStatsFor(two_days_ago, two_days_ago)
                        const campaignPreviousDailyCost = budgetPreviousStats.getCost()
                        console.log('TU SIE COS ZADZIALO', campaignPreviousDailyCost)
                        if (!checkDailyCost(campaignDailyBudget, campaignPreviousDailyCost, THRESHOLD)) {
                            campaignsToCheck.push(createCampaignObject(campaignDailyBudget, campaignDailyCost, campaignPreviousDailyCost, campaign.getName()))
                        }
                    }
                }
            }
        }
    }
    return activeCampaignsNumber
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

function checkDailyCost(campaignDailyBudget, campaignDailyCost, threshold) {
    return campaignDailyCost > threshold / 100 * campaignDailyBudget
}

function createCampaignObject(campaignDailyBudget, campaignDailyCost, campaignPreviousDailyCost, campaignName) {
    const campaignObject = {
        "accountName": AdsApp.currentAccount().getName(),
        "campaignName": campaignName,
        "campaignDailyBudget": campaignDailyBudget,
        "campaignDailyCost": campaignDailyCost,
        "campaignPreviousDailyCost": campaignPreviousDailyCost,
    }

    return campaignObject
}

function displayCampaignObjects(campaignsToCheck) {
    let message = ''

    campaignsToCheck.forEach(campaignObject => {
        message += `
     KONTO: ${campaignObject.accountName},
     KAMPANIA: ${campaignObject.campaignName}, 
     USTALONY BUDŻET:      ${campaignObject.campaignDailyBudget}, 
     RZECZYWISTE WYDATKI W DNIU ${YESTERDAY}:  ${campaignObject.campaignDailyCost}
     RZECZYWISTE WYDATKI W DNIO ${TWO_DAYS_AGO}: ${campaignObject.campaignPreviousDailyCost}
     `
    })

    return message
}

function createEmailMessage(campaignsToCheck, accountsNumber, campaignsNumber) { // creates a message for an email
    let body = ''

    if (campaignsToCheck.length > 0) {
        body = ``
    }
    else
        {
            body = ``


        body +=
            `
  
  
  
  `}
    return body

}

function sendEmail(recipient, subject, body) { // sends email
    MailApp.sendEmail(recipient, subject, body)
}

function ifIncludes(campaignName, word) {
    campaignNameLowerCase = campaignName.toLowerCase()
    return campaignNameLowerCase.includes(word)
}

function test2() {
    let accountSelector = AdsManagerApp
        .accounts()

    let accountIterator = accountSelector.get()

    const fields = ['campaign.name', 'campaign.status']
    const query = `SELECT ${fields} from campaign`

    while(accountIterator.hasNext()) {
        const account = accountIterator.next()
        AdsManagerApp.select(account)

        const report = AdsApp.search(query)
        for (const row of report) {
            console.log(row)
        }
    }
}