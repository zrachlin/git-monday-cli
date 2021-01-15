#!/usr/bin/env node
// index.js

const { exec } = require('child_process');
const { MONDAY_TOKEN, MONDAY_BOARD_ID } = require('./config');
const args = require('minimist')(process.argv.slice(2));
const {
  changeStatusString,
  getItemInfoString,
  getTagName,
} = require('./monday');
const mondaySdk = require('monday-sdk-js');
const monday = mondaySdk();

const argv = require('yargs')
  .version()
  .usage('Usage: gitmon <command> [options]')
  .command(
    ['start [itemId] [branchTag]', 's'],
    'Create a new git branch from a Monday Item'
  )
  .example(
    'gitmon start 12345678',
    'Create a new git branch called "feature/12345678" and change the status of the corresponding Monday task with Id 12345678 to "Working on it".'
  )
  .example(
    'gitmon start 12345678 "modal component"',
    'Create a new git branch called "feature/12345678-modal_component" and change the status of the corresponding Monday task with Id 12345678 to "Working on it".'
  )
  .example(
    'gitmon pr',
    'Push the current git branch to the remote github repository and create a pull request with the title of the corresponding Monday item and a body with the Monday Item Id. This will create a linkage in the Github PR column of the Monday board.'
  )
  .command(
    ['pr'],
    'Push the current branch to the remote repository and create a pull request.'
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help('h')
  .alias('h', 'help')
  .epilogue(
    'for more information, find the documentation at https://github.com/zrachlin/git-monday-cli#readme'
  ).argv;

if (!MONDAY_TOKEN) {
  console.error('You must provide a valid MONDAY_TOKEN in your .env file.');
  return;
}

monday.setToken(process.env.MONDAY_TOKEN);

if (!Object.keys(args).length || !args['_'].length) {
  console.log(
    'Welcome to git-monday-cli. Pass -h as an argument to view available commands'
  );
}

if (args['h']) {
  const helpMessage = `Welcome to git-monday-cli. Here are a list of commands:\n
  start  Creates a new git branch given
  -h  Help
  start -
  `;
  console.log(helpMessage);
}

// Anonymous arguments
const aArgs = args['_'];

if (aArgs.length && args[0].toLowerCase() === 'start') {
  if (typeof aArgs[1] !== 'number') {
    console.error(
      'The first argument or the -i argument must be a valid Monday Item Id'
    );
  }
  start(aArgs[1], aArgs[2]);
  return;
}

if (aArgs.length && aArgs[0].toLowerCase() === 'pr') {
  pr();
  return;
}

async function start(itemId, branchTag) {
  const itemInfoString = getItemInfoString(itemId);
  const { data } = await monday.api(itemInfoString);
  const { column_values } = data.items[0];
  const tagColumn = column_values.find(el => el.id === 'tags1');
  let tagId;
  if (tagColumn.value) {
    tagId = JSON.parse(tagColumn.value).tag_ids[0];
  }
  let tagName = 'feature';
  if (tagId) {
    const tagsString = getTagName(tagId);
    const { data: data2 } = await monday.api(tagsString);
    tagName = data2.tags[0].name;
  }

  let branchName = `${tagName}/${itemId}`;
  if (branchTag) {
    branchName += `-${branchTag.split(' ').join('_')}`;
  }

  exec(`git checkout -b ${branchName}`, (err, stdout, stderr) => {
    if (err) {
      //some err occurred
      console.error(err);
    } else {
      // the *entire* stdout and stderr (buffered)
      console.log(stdout);
      console.log(stderr);
    }
  });
  const mondayString = changeStatusString(
    MONDAY_BOARD_ID,
    itemId,
    'Working on it'
  );
  const res = await monday.api(mondayString);
}

async function pr() {
  exec(`git rev-parse --abbrev-ref HEAD`, async (err, stdout, stderr) => {
    if (err) {
      //some err occurred
      console.error(err);
    } else {
      // the *entire* stdout and stderr (buffered)
      const branch = stdout;
      const itemId = branch.split('/')[1].split('-')[0];
      const itemInfoString = getItemInfoString(itemId);
      const { data } = await monday.api(itemInfoString);
      const { name } = data.items[0];
      exec(`git push origin ${branch}`, (err, stdout, stderr) => {
        if (err) {
          //some err occurred
          console.error(err);
        } else {
          // the *entire* stdout and stderr (buffered)
          console.log(stdout);
          // console.log(`stderr: ${stderr}`);
          exec(
            `gh pr create --title "${name}" --body "Monday ID: #${itemId}"`,
            (err, stdout, stderr) => {
              if (err) {
                //some err occurred
                console.error(err);
              } else {
                // the *entire* stdout and stderr (buffered)
                console.log(stdout);
                // console.log(`stderr: ${stderr}`);
              }
            }
          );
        }
      });

      const status_string = changeStatusString(
        MONDAY_BOARD_ID,
        itemId,
        'In Review'
      );
      const res = await monday.api(status_string);
    }
  });
}
