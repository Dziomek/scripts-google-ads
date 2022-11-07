const CAMPAIGN_DATA_LIST = []

function main() {
    let accountSelector = AdsManagerApp
        .accounts()

    let accountIterator = accountSelector.get()
    while(accountIterator.hasNext()) {
        let account = accountIterator.next()
        AdsManagerApp.select(account)
        console.log('PRZELACZAM SIE NA KONTO: ' + account.getName())

        getCampaignNameAndBudgetId(CAMPAIGN_DATA_LIST, account)

        console.log(CAMPAIGN_DATA_LIST)
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
              WHERE change_event.change_date_time BETWEEN "2022-10-01 00:00:00.00000" AND "2022-10-15 23:59:59.99999" LIMIT 10000`

        const report = AdsApp.search(queryEvent)
        for (const row of report) {
            const changeResourceType = row.changeEvent.changeResourceType
            if (changeResourceType === 'CAMPAIGN_BUDGET') {
                const oldBudget = row.changeEvent.oldResource
                const oldBudgetValue = oldBudget.campaignBudget.amountMicros / 1000000
                const newBudget = row.changeEvent.newResource
                const newBudgetValue = newBudget.campaignBudget.amountMicros / 1000000
                console.log(row, oldBudgetValue, newBudgetValue)
            }
        }
    }
}

function getCampaignNameAndBudgetId(CAMPAIGN_DATA_LIST, account) {
    let campaignName = null
    let budgetId = null
    let accountName = account.getName()
    const query = `SELECT campaign.campaign_budget, campaign.name FROM campaign`
    const report = AdsApp.search(query)
    for (const data of report) {
        campaignName = data.campaign.name
        const campaignBudget = data.campaign.campaignBudget
        budgetId = getBudgetId(campaignBudget)

        CAMPAIGN_DATA_LIST.push({"accountName": accountName, "campaignName": campaignName, "budgetId": budgetId})
    }
}

function getBudgetId(campaignBudget) {
    const parts = campaignBudget.split('/campaignBudgets/')
    return parts[parts.length - 1]
}