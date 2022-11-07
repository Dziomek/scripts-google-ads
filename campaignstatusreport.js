const YESTERDAY = getSpecifiedDate(1)
const LABEL_NAME = ''
const RECIPIENT = ''
const TEST_RECIPIENT = ''
const SUBJECT = ``



const changedCampaigns = []
let accountsNumber = 0

function main() {

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
                console.log(`ETYKIETA DLA KONTA ${account.getName()}: ${label.getName()}`)
                const queryEvent = `SELECT 
                    change_event.resource_name,
                    change_event.change_date_time,
                    change_event.change_resource_name,
                    change_event.user_email,
                    change_event.client_type,
                    change_event.change_resource_type,
                    change_event.old_resource,
                    change_event.new_resource,
                    change_event.resource_change_operation,
                    change_event.changed_fields
                    FROM change_event
                    WHERE change_event.change_date_time BETWEEN "${YESTERDAY} 00:00:00.00000" AND "${YESTERDAY} 23:59:59.99999" LIMIT 10000`

                console.log(getChangeEventData(queryEvent))
            }
        }
    }

    for (object of changedCampaigns) {
        console.log(getObjectData(object))
    }
    console.log('NUMBER OF CHANGED CAMPAIGNS:', changedCampaigns.length)
    console.log('CHECKED ACCOUNTS: ' + accountsNumber)
    if (changedCampaigns.length > 0) {
        sendEmail(RECIPIENT, SUBJECT, createEmailMessage(changedCampaigns))
        sendEmail(TEST_RECIPIENT, SUBJECT, createEmailMessage(changedCampaigns))
    }
}

function collectCampaignData(campaignId) {

    const accountName = AdsApp.currentAccount().getName()
    const query = `SELECT campaign.name, campaign.status FROM campaign WHERE campaign.id = '${campaignId}'`
    const report = AdsApp.search(query)
    for (row of report) {

        return [accountName, row.campaign.name, campaignId, row.campaign.status]
    }
}

function checkResults(row) {
    const changeResourceType = row.changeEvent.changeResourceType
    const changedFields = row.changeEvent.changedFields
    const changeResourceName = row.changeEvent.changeResourceName
    const campaignId = changeResourceName.split('/').pop()


    if (changeResourceType == 'CAMPAIGN') {
        if (changedFields.includes('status')) {
            console.log(changeResourceType, changedFields, campaignId)
            changedCampaigns.push(createCampaignObject(collectCampaignData(campaignId)))

            return true
        }
    }

    return false
}

function getChangeEventData(query) {
    const reportRows = [];
    const report = AdsApp.search(query)

    for(const row of report) {
        if (checkResults(row)) {
            const campaigns = reportRows.push(row)
        }
    }

    return reportRows
}


function createCampaignObject(arrayOfData) {

    let campaignObject = {
        "account": arrayOfData[0],
        "campaignName": arrayOfData[1],
        "campaignId": arrayOfData[2],
        "currentStatus": arrayOfData[3]
    }

    return campaignObject
}

function getObjectData(object) {

    return `${object.account} ${object.campaignName} ${object.campaignId} ${object.currentStatus}`
}

function getSpecifiedDate(pastDays) { // days back from today as a parameter, date format YYYY-MM-DD
    const date = new Date()
    date.setDate(date.getDate() - pastDays)

    const dateISO = date.toISOString()

    return dateISO.split(dateISO[10], 2)[0]
}

function createEmailMessage(changedCampaigns) {
    let body = ''

    if (changedCampaigns.length > 0) {
        body = "Wykryto zmiany statusu następujących kampanii " + displayAllChangedCampaigns(changedCampaigns)
    }
    else {
        body = "Status żadnej kampanii nie uległ zmianie."
    }

    body += `
  Dane pobrano z ${accountsNumber} kont`

    return body
}

function sendEmail(recipient, subject, body) {
    MailApp.sendEmail(recipient, subject, body)
}

function displayAllChangedCampaigns(changedCampaigns) {

    let message = ''

    for (const campaign of changedCampaigns) {
        message += `
     KONTO: ${campaign.account}, 
     NAZWA KAMPANII: ${campaign.campaignName}, 
     ID: ${campaign.campaignId}, 
     AKTUALNY STATUS: ${campaign.currentStatus}
     `
    }

    return message
}
