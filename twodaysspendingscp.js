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
    const twoDaysAgo = adjustDateFormat(TWO_DAYS_AGO)
    let campaignsNumber = 0 // liczba kampani, których wydatki są zbyt małe w porównaniu do budżetu (łącznie z kampaniami PMax)
    let accountsNumber = 0 // liczba sprawdzonych kont
    const campaignsToCheck = [] // kampanie, których wydatki są zbyt małe w porównaniu do budżetu

    const accountSelector = AdsManagerApp
        .accounts()
    const accountIterator = accountSelector.get()

    while(accountIterator.hasNext()) {
        const account = accountIterator.next()
        const accountId = getFormattedCustomerId(account)
        //console.log(accountId)
        AdsManagerApp.select(account)
        console.log('PRZELACZAM SIE NA KONTO: ' + account.getName())

        const accountLabelSelector = account
            .labels()
        const accountLabelIterator = accountLabelSelector.get()

        while(accountLabelIterator.hasNext()) {
            label = accountLabelIterator.next()
            if (label.getName() === LABEL_NAME) {
                accountsNumber += 1

                ///////////////// 1 DAY AGO //////////////////

                //// campaigns ////

                let campaignsSelector = AdsApp
                    .campaigns()
                let campaignsIterator = campaignsSelector.get()
                while(campaignsIterator.hasNext()) {
                    const campaign = campaignsIterator.next()
                }


                ///////////////// 2 DAYS AGO //////////////////
            }
        }
    }
}

function getFormattedCustomerId(account) {
    const CUSTOMER_ID = account.getCustomerId()
    let customerId = ""
    const parts = CUSTOMER_ID.split('-')
    console.log(parts)
    parts.forEach(part => {
        customerId += part
    })

    return customerId
}

function ifCampaignEnabled(accountId, campaign, day) { // sprawdza, czy kampania w danym dniu była uruchomiona
    let status = ""
    let isEnabled = campaign.isEnabled()
    let campaignId = campaign.getId()
    let changeResourceType = null
    const queryEvent = `SELECT 
            change_event.resource_name,
            change_event.change_date_time,
            change_event.change_resource_name,
            change_event.change_resource_type,
            change_event.old_resource,
            change_event.new_resource,
            change_event.changed_fields
            FROM change_event
            WHERE 
            change_event.change_date_time >= "${getSpecifiedDate(29)} 00:00:00.00000" 
            AND change_event.change_date_time <= "${day} 23:59:59.99999"
            AND change_event.change_resource_name = "customers/${accountId}/campaigns/${campaignId}"
            LIMIT 10000`

    const report = AdsApp.search(queryEvent)
    for(const row of report) {
        console.log(row)
        changeResourceType = row.changeEvent.changeResourceType
        changedFields = row.changeEvent.changedFields
        if (changeResourceType == 'CAMPAIGN') {
            if (changedFields.includes('status')) {
                status = row.changeEvent.newResource.campaign.status
                console.log(status)
            }
        }
    }
}

function getNumberOfDays(date1, date2) { // zwraca jsona potrzebnego do sprawdzenia, czy budzet nie zmienił sie na przestrzeni dni date1 i date2.
    const day1 = parseInt(date1.slice(-2))
    const day2 = parseInt(date2.slice(-2))
    const range = day2 - day1
    return {
        "day1": day1,
        "day2": day2,
        "range": range
    }
}

function checkCampaignBudget(campaign, date) { // sprawdza, czy budżet nie zmienił się począwszy od wczoraj do ustalonej daty. Jeśli zmienił się, przyjmie nową wartość
    let campaignBudget = campaign.getBudget()
    let campaignDailyBudget = campaignBudget.getAmount()
    const yesterday = getSpecifiedDate(1)
    const json = getNumberOfDays(yesterday, date)
    const day1 = json.day1
    const day2 = json.day2
    const range = json.range

    for (let i=range; i>=0; i--) {
        const queryEvent = `SELECT 
              change_event.resource_name,
              change_event.change_date_time,
              change_event.change_resource_type,
              change_event.old_resource,
              change_event.new_resource,
              FROM change_event
              WHERE change_event.change_date_time BETWEEN "${date} 00:00:00.00000" AND "${yesterday} 23:59:59.99999" LIMIT 10000`

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
