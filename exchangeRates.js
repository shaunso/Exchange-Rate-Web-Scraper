// load the 'Puppeteer' and 'File Server' modules
const puppeteer = require('puppeteer');
const fs = require('fs');
const { Console } = require('console');

// set the URL to the web page that will be scraped
const url = 'https://zimpricecheck.com/price-updates/official-and-black-market-exchange-rates/';

// retrieving the current date to create a string to use when appending the CSV file and naming the JSON file
function theDate() {
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = ( today.getMonth() + 1 ).toString();
  const day = today.getDate().toString();
  // the date will be in the YYYY-MM-DD format
  return day.concat("-", month, "-", year);
}

// getData set to IIFE
const getData = async () => {
  // launch Puppeteer
  const browser = await puppeteer.launch();
  // Puppeteer opens a new page 
  const page = await browser.newPage();
  // set the viewport of the page
  await page.setViewport({
    width: 1680,
    height: 1080,
  })
  // request the web page
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })
  // take a screenshot of the page
  await page.screenshot({
    path:  `./exchange_rates/screenshot/${theDate()}.png`,
    fullPage: true,
  })
  // retrieve htmk data of requested page
  const result = await page.evaluate( () => {
    // select the element with the date on the page
    const dateData = document.querySelector('h4.fusion-responsive-typography-calculated:nth-child(5)');
    // select all rows from the table on the page
    const rateData = document.querySelectorAll('figure.wp-block-table:nth-child(6) > table:nth-child(1) > tbody:nth-child(2) tr');

    // set the date
    const currentDate = dateData.innerText.split(" ").slice(-3).join("-");
    // return the data from the each table row in an array of objects
    return Array.from(rateData).map( (el) => {
      const currency = el.querySelector('td:nth-child(1)').innerText;
      const rate = el.querySelector('td:nth-child(2)').innerText;

      return { 
        currentDate,
        currency,
        rate
      }
    });
  });

  // stop running Puppeteer
  await browser.close()
  // return the result of calling the function
  return result
}

getData().then ( value => {
  console.log('Data scrapped...');

  // save the scrapped data as to a JSON file
  fs.writeFile(`./exchange_rates/json/exchange_rates_${theDate()}.json`, JSON.stringify(value), err => {
    if (err) throw err;
    console.log(`Exchange rate data for ${theDate()} successfully saved to JSON...`)
  })

  // append the date to the first column of the CSV file
  fs.appendFile('./exchange_rates/exchange_rates.csv', `${value[0].currentDate}`, err => {
    if (err) throw err;
  })

  console.log(`Date added to CSV...`);

  // appending the data to each CSV file
  for ( let i = 0; i < 7; i++) {
    if ( i === 0 || i === 3 || i === 4 || i === 6 ) {
      // print the filtered value to the console
      console.log(value[i]);

      fs.appendFile('./exchange_rates/exchange_rates.csv', newLine(), err => {
        if (err) throw err;
      });
      // function adds a newline character to the last array element appended to the CSV file
      function newLine() {
        if ( i === 6 ) {
          return `,${value[i].rate}\n`
        } else return `,${value[i].rate}`
      }
    } else continue
  }

  console.log(`Exchange rate data for ${theDate()} saved to CSV...`)    
});