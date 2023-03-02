const LABEL_NAME = ''
const START_DATE = getSpecifiedDate(30)
const START_DATE_FORMATTED = getFormattedDate(30)
const END_DATE = getSpecifiedDate(1)
const END_DATE_FORMATTED = getFormattedDate(1)
const RECIPIENT = ''
const TEST_RECIPIENT = ''
const SUBJECT = ``

let NUMBER = 0
const THRESHOLD = 0.4 // level that indicates how much less can be query ctr than campaign avg ctr
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
          const ctr = checkCampaignStats(campaign)
          console.log(excludedKeywords, campaign.getName())
          checkSearchQueries(campaign, ctr, account.getName(), excludedKeywords)
        }
      
        const pmCampaignIterator = AdsApp.performanceMaxCampaigns().get()
        while(pmCampaignIterator.hasNext()) {
          const pmCampaign = pmCampaignIterator.next()
          const ctr = checkCampaignStats(pmCampaign)
          checkSearchQueries(pmCampaign, ctr, account.getName(), [])
        }
      }
    }
  }
  console.log(OBJECTS_TO_SEND)
  OBJECTS_TO_SEND.sort(function(a, b) {
    if (a.accountName < b.accountName) return -1;
    if (a.accountName > b.accountName) return 1;
    return b.queryImpressions - a.queryImpressions;
  })
  console.log(generateMailMessage())
  //sendEmail(RECIPIENT, SUBJECT, generateMailMessage())
  //sendEmail(TEST_RECIPIENT, SUBJECT, generateMailMessage())
  console.log(NUMBER)
}

function checkCampaignStats(campaign) {
  const stats = campaign.getStatsFor(START_DATE_FORMATTED, END_DATE_FORMATTED)
  if (stats.getClicks() >= 500) {
    console.log(campaign.getName(), (stats.getCtr() * 100) + "%")
    return stats.getCtr()
  }
  return false
}

function convertPercent(percent) {
  const percentValue = percent.replace("%", "")
  const floatValue = parseFloat(percentValue)
  
  return floatValue / 100
}

function checkSearchQueries(campaign, ctr, accountName, excludedKeywords) {
  const campaignId = campaign.getId()
  if (ctr) {
    const query = `SELECT Query, Ctr, Impressions FROM SEARCH_QUERY_PERFORMANCE_REPORT WHERE CampaignId = ${campaignId} AND Impressions > 300 DURING LAST_30_DAYS`
    const report = AdsApp.report(query)
    const rows = report.rows()
    while(rows.hasNext()) {
      const row = rows.next()
      if (convertPercent(row.Ctr) < THRESHOLD * ctr && !excludedKeywords.includes(row.Query)) {
        //console.log(convertPercent(row.Ctr), row.Query,  ctr, THRESHOLD * ctr,  'CLICKS:', row.Clicks)
        NUMBER += 1
        OBJECTS_TO_SEND.push(prepareMessageObject(accountName, campaign.getName(), ctr * 100 + "%", row.Query, row.Ctr, row.Impressions))
      }
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

function prepareMessageObject(accountName, campaignName, campaignCtr, query, queryCtr, queryImpressions) {
  return {
    accountName: accountName, 
    campaignName: campaignName,
    campaignCtr: campaignCtr,
    query: query,
    queryCtr: queryCtr,
    queryImpressions: queryImpressions
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