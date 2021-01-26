#!/usr/bin/env node
// index.js

const { exec } = require('child_process');
const {
  MONDAY_TOKEN,
  MONDAY_BOARD_ID,
  MONDAY_STATUS_COLUMN_ID,
  MONDAY_ITEM_TYPE_COLUMN_ID,
} = require('./config');

const {
  changeStatusString,
  getItemInfoString,
  getTagNames,
} = require('./monday');
const mondaySdk = require('monday-sdk-js');
const monday = mondaySdk();

const argv = require('yargs')
  .version()
  .usage('Usage: gitmon <command> [options]')
  .command(
    ['start <itemId> [branchTag]', 's'],
    'Create a new git branch from a Monday Item',
    function (yargs) {
      return yargs
        .positional('itemId', {
          type: 'number',
        })
        .positional('branchTag', { type: 'string' });
    }
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

monday.setToken(MONDAY_TOKEN);

// Anonymous arguments
const aArgs = argv._;

if (aArgs[0] === 'start') {
  if (isNaN(argv.itemId)) {
    console.error(
      'The first argument to gitmon start must be a valid Monday Item Id'
    );
    return;
  }
  start(argv.itemId, argv.branchTag);
  return;
}

if (aArgs[0] === 'pr') {
  pr();
  return;
}

async function start(itemId, branchTag) {
  const itemInfoString = getItemInfoString(itemId);
  let tagId;
  try {
    const { data } = await monday.api(itemInfoString);
    const { column_values } = data.items[0];
    if (MONDAY_ITEM_TYPE_COLUMN_ID) {
      const tagColumn = column_values.find(
        el => el.id === MONDAY_ITEM_TYPE_COLUMN_ID
      );
      if (tagColumn && tagColumn.value) {
        tagId = JSON.parse(tagColumn.value).tag_ids[0];
      }
    }
  } catch (err) {
    throw new Error(err);
  }
  let tagName = 'feature';
  if (tagId) {
    const tagsString = getTagNames();
    const { data: data2 } = await monday.api(tagsString);
    const res = data2.tags.find(el => el.id === tagId);
    if (res) {
      tagName = res.name;
    }
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
  if (MONDAY_STATUS_COLUMN_ID) {
    const mondayString = changeStatusString(
      MONDAY_BOARD_ID,
      itemId,
      MONDAY_STATUS_COLUMN_ID,
      'Working on it'
    );
    try {
      const res = await monday.api(mondayString);
    } catch (err) {
      throw new Error(err);
    }
  }
}

async function pr() {
  exec(`git rev-parse --abbrev-ref HEAD`, async (err, stdout, stderr) => {
    if (err) {
      //some err occurred
      console.error(err);
    } else {
      // the *entire* stdout and stderr (buffered)
      const branch = stdout;
      let itemId;
      try {
        itemId = branch.split('/')[1].split('-')[0];
      } catch {
        throw new Error(
          'Your branch name was not recognized as valid. Please make sure you use the gitmon start command to create your branch.'
        );
      }
      try {
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
      } catch (err) {
        throw new Error(err);
      }
      if (MONDAY_STATUS_COLUMN_ID) {
        const status_string = changeStatusString(
          MONDAY_BOARD_ID,
          itemId,
          MONDAY_STATUS_COLUMN_ID,
          'In Review'
        );
        try {
          const res = await monday.api(status_string);
        } catch (err) {
          throw new Error(err);
        }
      }
    }
  });
}
