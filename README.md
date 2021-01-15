# Introduction

Welcome to `git-monday-cli`!

This package provides a CLI with two commands that aid in development workflow using Monday, Git, and Github.

### _Gitmon Create_

```
gitmon create {Monday Issue Id} {Optional branch tag}
```

`gitmon create` will create a new local git branch with a name based off the Monday item tag (or any tag column you specify), the task id, and an optional branch tag.

For example, with the following Monday items:
![sample-monday-issues](images/monday_sample_items.png)
If you write

```
gitmon create 972602263 "Sample Feature"
```

the CLI will create a new local branch named `feature/972602263-Sample_Feature` (if you left out "Sample Feature" it will just be `feature/972602263`). I chose not to grab and append the item name automatically because item names can get long.

If you write

```
gitmon create 972602707
```

the CLI will create a new local branch named `bug/972602707`. This assumes that you have set an environment variable named `MONDAY_ITEM_TYPE_COLUMN_ID` to be the column ID of the "Item Type" column in Monday (more on that in [Setup](#setup)). If you don't have that variable set, all created branches will be prefixed with "feature" by default.

If you set the `MONDAY_STATUS_COLUMN_ID` environment variable, it will change the status of the corresponding Monday item to "Working on it" to let your team know that you are starting work on that task/item/feature/bug.

### _Gitmon PR_

```
gitmon pr
```

`gitmon pr` will automatically push the current local branch to the remote origin and create a pull-request in Github. The pull-request's title will be the name of the Monday item, and the body will be "Monday ID: `#{Monday Item Id}`". If you have enabled the [Recommended Monday Integration](#recommended-monday-integrations), this will create a link betwen the Monday item and the Github PR.

If you set the `MONDAY_STATUS_COLUMN_ID` environment variable, it will change the status of the corresponding Monday item to "In Review" to let your team know that the task is ready for review by other developers.

TODO: add a command line option to tag a reviewer and potentially update a column and/or create a new item for that reviewer in Monday

# Installation

`npm install -g git-monday-cli`

# Setup

This package will only work in an existing local `git` repository that has a remote origin. It is simply a thin layer on top of [git](https://git-scm.com/) and [gh](https://github.com/cli/cli) commands that makes use of Monday's API.

In order to connect to Monday's API and grab information about an item from a board, you will need to create a `.env` file in the repository in which you plan to use the CLI.

```
MONDAY_TOKEN={Your Monday Token}
MONDAY_BOARD_ID={Your Sprint Board Id}
MONDAY_STATUS_COLUMN_ID={Your Status Column Id}
MONDAY_ITEM_TYPE_COLUMN_ID={Your Item Type Id}
```

# Recommended Monday Integration

In order to have your Github PR automatically connected to the corresponding Monday item, I recommend adding the following integration to your Monday board:

![recommended-monday-integration](images/recommended_monday_integration.png)

Check out this Monday support article on setting up github integrations: https://support.monday.com/hc/en-us/articles/360002354759-GitHub-Integration

If you've set up this integration properly, you should see a new column added to your board called "Github PR" with the official github logo.
