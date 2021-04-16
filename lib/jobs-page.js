/* eslint-disable prefer-const */
/* eslint-disable indent */
/* eslint-disable arrow-parens */
/* eslint-disable function-paren-newline */
const debug = require('debug')('so-page');
const commander = require('commander');

debug.enabled = true;

function parseJob(job) {
  if (!job) {
    return {};
  }
  // eslint-disable-next-line one-var
  let currency = null,
    salary = null,
    min = null,
    max = null;
  if (job.salary != null) {
    currency = job.salary.charAt(0);
    console.log(currency);
    salary = job.salary.replace(' | Equity', '').split(' ');
    min = salary[0].substr(1);
    // eslint-disable-next-line prefer-destructuring
    max = salary.slice(-1)[0];
  }
  return {
    title: job.title,
    company_logo: job.company_logo,
    currency,
    'minimum-salary': job.salary ? Number(min.replace('k', '000')) : null,
    'maximum-salary': job.salary ? Number(max.replace('k', '000')) : null,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    description: job.description,
    role: job.role,
    skills: job.skills,
    country: commander.args[0],
    city: job.city,
  };
}

function parseRows(row) {
  try {
    let sections = row.querySelectorAll('section');
    if (sections.length < 3) {
      return null;
    }
    const skills = sections[2].querySelectorAll('.grid a');
    const description = sections[sections.length - 1].querySelectorAll('p');
    let parsSkills = [];
    let parsDescription = [];
    for (let i = 0; i < skills.length; i++) {
      parsSkills.push(skills[i].innerText);
    }

    for (let i = 0; i < description.length; i++) {
      parsDescription.push(description[i].innerText);
    }

    return {
      title: row.querySelector('header > .grid > .grid--cell > .fl1 >h1 > a')
        .innerHTML,
      company_name: row.querySelector(
        'header > .grid > .grid--cell > .fl1 > .fc-black-700 > a',
      ).innerHTML,
      company_logo: row.querySelector(
        'header > .grid > .grid--cell >.fl-shrink0 > a',
      )
        ? row.querySelector(
            'header > .grid > .grid--cell >.fl-shrink0 >a >.s-avatar',
          ).src
        : row.querySelector(
            'header > .grid > .grid--cell >.fl-shrink0 >.s-avatar',
          ).src,
      salary:
        row.querySelector(
          'header.sticky-header div.grid--cell.fl1 li span.fc-green-400',
        ) &&
        row.querySelector(
          'header.sticky-header div.grid--cell.fl1 li span.fc-green-400',
        ).innerText,
      jobType: sections[0].querySelectorAll('.mb8')[0].querySelector('.fw-bold')
        .innerText,
      experienceLevel: sections[0]
        .querySelectorAll('.mb8')[1]
        .querySelector('.fw-bold').innerText,
      role: sections[0].querySelectorAll('.mb8')[2]
        ? sections[0].querySelectorAll('.mb8')[2].querySelector('.fw-bold')
            .innerText
        : null,
      skills: parsSkills.join(','),
      description: parsDescription.join(' '),

      city: row.querySelector(
        'header > .grid > .grid--cell > .fl1 > .fc-black-700 > span',
      ).innerHTML,
    };
  } catch (e) {
    return null;
  }
}

module.exports = class StackOverflowJobsPage {
  constructor(page) {
    this.page = page;
  }

  async getPage(link) {
    debug('Loading page %s', link);

    await this.page.goto(link);

    const jobs = [];
    console.log('Link : ', link);
    const row = await this.page.$eval('.snippet-hidden', parseRows);
    console.log(row);
    jobs.push(parseJob(row));

    return jobs;
  }
};
