#!/usr/bin/env node

const moment = require('moment')
const util = require(`./util.js`)
const {
  parseArgv,
  execSync,
  help,
  paserLogToList,
  toMd,
  print,
} = util
const argv = parseArgv()
const query = {
  '--help': argv[`--help`],
  '--author': argv[`--author`] || execSync(`git config user.name`),
  '--x-template': argv[`--x-template`] || `week`,
  '--x-debug': argv[`--x-debug`] || false,
  '--x-message-body': argv[`--x-message-body`] || `compatible`,
  '--after': argv[`--after`],
  '--before': argv[`--before`],
  '--select': argv[`--select`] ? argv[`--select`].split(`,`) : [`default`],
}

{ // 关联参数特殊处理
  if(query['--help']) {
    const cliName = `gitday`
    help({cliName})
    process.exit()
  }
  // 根据 --x-template 预处理时间
  query['--after'] = query['--after'] || util.handleLogTime({query}).after
  query['--before'] = query['--before'] || util.handleLogTime({query}).before
}

console.log(`query`, query)
global.query = query

{ // 使用配置
  const config = require(`./config/index.js`)
  const reportList = config.report.filter(item => global.query[`--select`].includes(item.select))
  reportList.forEach(reportItem => {
    const repository = reportItem.repository.map(repositoryItem => {
      const cmdRes = execSync(
        util.logLine({query}),
        {
          cwd: repositoryItem.path,
        }
      )
      const list = paserLogToList(cmdRes)
      const toMdRes = toMd({tag: query['--x-template'], list})
      return [
        `# ${repositoryItem.name}`,
        toMdRes,
        `\n`,
      ].join(`\n`)
    }).join(`\n`).trim()
    require(`fs`).writeFileSync(reportItem.outFile, repository)
    print(repository)
  })
}


process.exit()
