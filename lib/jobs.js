const debug = require('debug')('so');
const asyncForEach = require('./async-foreach');
const StackOverflowJobsPage = require('./jobs-page');

debug.enabled = true;

module.exports = class StackOverflowJobs {
  constructor(page) {
    this.page = page;
  }

  async getLinks(location) {
    debug('Counting total job pages for %s', location);
    var links = [];
    for (let i = 0; i < 3; i++) {
      await this.page.goto(
        `https://stackoverflow.com/jobs?sort=i&pg=${i}&l=${location}i&d=100&u=Km`,
        {
          waitUntil: 'networkidle2',
        },
      );

      let linksPage = await this.page.$$eval(
        'div.js-search-results div.listResults a.s-link',
        (elements) => elements.map((e) => e.href),
      );

      linksPage.pop();
      links.push(...linksPage);
      debug('Page :', i);
    }

    return links;
  }

  async getJobs(links, location) {
    const jobs = [];
    await asyncForEach(links, async (link) => {
      const page = new StackOverflowJobsPage(this.page);
      jobs.push(...(await page.getPage(link, location)));
    });

    debug('Found %s jobs', jobs.length);
    return jobs;
  }
};
