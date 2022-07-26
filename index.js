#!/usr/bin/env node

// https://git-scm.com/docs/git-log
const {
  parseArgv,
  execSync,
  help,
  paserLogToList,
  toMd,
  print,
} = require(`./util.js`)
const argv = parseArgv()
const query = {
  '--help': argv[`--help`],
  '--author': argv[`--author`] || execSync(`git config user.name`),
  '--x-template': argv[`--x-template`] || `week`,
  '--x-debug': argv[`--x-debug`] || false,
  '--after': argv[`--after`],
}

{ // 关联参数特殊处理
  if(query['--help']) {
    const cliName = `gitday`
    help({cliName})
    process.exit()
  }

  query['--after'] = query['--after'] || `1.${query['--x-template'].split(`-`).shift()}s`
}

global.query = query

const cmdRes = execSync(`git log --author="${query[`--author`]}" --all --after="${query[`--after`]}" --no-merges`)
const list = paserLogToList(cmdRes)
const toMdRes = toMd({tag: query['--x-template'], list})
print(toMdRes)

process.exit()
