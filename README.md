# git-monday-cli

Welcome to `git-monday-cli`!

This package provides a CLI with two commands that aid in development workflow using Monday, Git, and Github.

```
gitmon create {Monday Issue Id} {Optional branch tag}
```

`Gitmon create` will create a new local git branch with a name based off the Monday item tag (or any tag column you specify), the task id, and an optional branch tag.

For example, with the following Monday items:
![sample-monday-issues]("images/Monday Sample Items.png")

`gitmon pr`

## Installation

`npm install -g git-monday-cli`

## Requirements
