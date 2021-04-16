const debug = require('debug')('crawler');
const puppeteer = require('puppeteer');
const commander = require('commander');
const { MongoClient } = require('mongodb');
const csv = require('./lib/export-csv');
const StackOverflowJobs = require('./lib/jobs');
require('dotenv').config();

// Connection URI
const uri = process.env.DB_PATH;
// Create a new MongoClient
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

commander
  .option('-p, --numberOfPage', 'Page (eg: 20)')
  .option('-f, --file', 'File (eg: jobs.csv)')
  .option('-l, --location', 'The location where to find a job (eg: Amsterdam)')
  .parse(process.argv);

debug.enabled = true;

async function run(location, filePath) {
  try {
    await client.connect();
    // Establish and verify connection
    const database = client.db('admin');

    const scraping = database.collection('scraping');

    debug('Starting puppeteer');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    debug('Getting jobs');

    const so = new StackOverflowJobs(page);
    const link = await so.getLinks(location);
    const jobs = await so.getJobs(link);

    const options = { ordered: true };
    const result = await scraping.insertMany(jobs, options);

    // csv(filePath, jobs);
    //debug('Exported jobs to %s', filePath);
    debug(`${result.insertedCount} documents were inserted`);

    console.log('\n');

    await page.close();
    await browser.close();
  } catch (e) {
    debug('error', e);
  }
}

if (commander.args.length !== 3) {
  commander.help();
  console.log('\n');
} else {
  run(...commander.args).catch(console.error);
}
