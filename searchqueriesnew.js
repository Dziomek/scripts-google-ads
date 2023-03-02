const LABEL_NAME = ''
const START_DATE = getSpecifiedDate(30)
const START_DATE_FORMATTED = getFormattedDate(30)
const END_DATE = getSpecifiedDate(1)
const END_DATE_FORMATTED = getFormattedDate(1)
const RECIPIENT = ''
const TEST_RECIPIENT = ''
const SUBJECT = ``

let NUMBER = 0
const OBJECTS_TO_SEND = []
const EXCLUDED_KEYWORDS = []

console.log(START_DATE, END_DATE, START_DATE_FORMATTED, END_DATE_FORMATTED, typeof START_DATE, typeof END_DATE, typeof START_DATE_FORMATTED, typeof END_DATE_FORMATTED)

function main() {
  let accountIterator = AdsManagerApp.accounts().get()
  
  while(accountIterator.hasNext()) {
    const account = accountIterator.next()
    AdsManagerApp.select(account)
    console.log('PRZELACZAM SIE NA KONTO: ' + account.getName())
    const accountLabelsIterator = account.labels().get()
    while(accountLabelsIterator.hasNext()) {
      const label = accountLabelsIterator.next()
      if (label.getName() === LABEL_NAME) {
        const campaignIterator = AdsApp.campaigns().get()
        while(campaignIterator.hasNext()) {
          const excludedKeywords = []
          const campaign = campaignIterator.next()
          const negativeKeywordsIterator = campaign.negativeKeywords().get()
          while(negativeKeywordsIterator.hasNext()) {
            const negativeKeyword = negativeKeywordsIterator.next()
            excludedKeywords.push(negativeKeyword.getText())
          }
          checkSearchQueries(campaign, account.getName(), excludedKeywords)
        }
      
        const pmCampaignIterator = AdsApp.performanceMaxCampaigns().get()
        while(pmCampaignIterator.hasNext()) {
          const pmCampaign = pmCampaignIterator.next()
          checkSearchQueries(pmCampaign, account.getName())
        }
      }
    }
  }
  console.log(OBJECTS_TO_SEND)
  OBJECTS_TO_SEND.sort(function(a, b) {
    if (a.accountName < b.accountName) return -1;
    if (a.accountName > b.accountName) return 1;
    return b.queryClicks - a.queryClicks;
  })
  console.log(generateMailMessage())
  //sendEmail(RECIPIENT, SUBJECT, generateMailMessage())
  sendEmail(TEST_RECIPIENT, SUBJECT, generateMailMessage())
  console.log(NUMBER)
  console.log(EXCLUDED_KEYWORDS)
}

function checkSearchQueries(campaign, accountName, excludedKeywords) {
  const campaignId = campaign.getId()
  const query = `SELECT Query, Clicks, Conversions FROM SEARCH_QUERY_PERFORMANCE_REPORT 
  WHERE CampaignId = ${campaignId} 
  AND Clicks > 300 
  AND Conversions = 0
  DURING LAST_30_DAYS`
  const report = AdsApp.report(query)
  const rows = report.rows()
  while(rows.hasNext()) {
    const row = rows.next()
    if (!excludedKeywords.includes(row.Query)) {
      OBJECTS_TO_SEND.push(prepareMessageObject(accountName, campaign.getName(), row.Query, row.Clicks, row.Conversions))
      NUMBER += 1
    }
  }
}


function getFormattedDate(pastDays) {
  const date = new Date()
  date.setDate(date.getDate() - pastDays)
  
  return Utilities.formatDate(date, "UTC", "yyyyMMdd")
}

function getSpecifiedDate(pastDays) { // days back from today as a parameter, returns date in YYYY-MM-DD format 
  const date = new Date()
  date.setDate(date.getDate() - pastDays)
  
  return Utilities.formatDate(date, "UTC", "yyyy-MM-dd")
}

function sendEmail(recipient, subject, body) { // sends email
    MailApp.sendEmail(recipient, subject, body)
}

function prepareMessageObject(accountName, campaignName, query, queryClicks, queryConversions) {
  return {
    accountName: accountName, 
    campaignName: campaignName,
    query: query,
    queryClicks: queryClicks,
    queryConversions: queryConversions
  }
}

function generateMailMessage() {
  let message = ``
  let stringObjects = OBJECTS_TO_SEND.map(item => {
    return `
    `
  })
  stringObjects.forEach(object => {
    message += object
  })
  return message
}