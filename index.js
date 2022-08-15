#!/usr/bin/env node

console._log = console.log
console.log = () => {}
const util = require(`./util.js`)
util.init()
const {
  parseArgv,
  execSync,
  help,
  paserLogToList,
  toMd,
} = util
const argv = parseArgv()
const cli = {
  ...argv,
  '--debug': argv[`--debug`] || false,
  '--select': argv[`--select`] ? argv[`--select`].split(`,`) : [`default`],
}

{ // 关联参数特殊处理
  if(cli['--help']) {
    help()
    process.exit()
  }
  if(cli['--config']) {
    util.opener(GET(`configdir`))
    process.exit()
  }
  if(cli['-v'] || cli['--version']) {
    util.print(GET(`package`).version)
    process.exit()
  }
}

SET(`cli`, cli)

const config = GET(`config`)
const reportList = config.report.filter(item => cli[`--select`].includes(item.select))
reportList.forEach(reportItem => {
  const newReportItem = util.handleReportConfig({reportItem, query: cli})
  SET(`curReport`, newReportItem)
  const repository = newReportItem.repository.map(repositoryItem => {
    let cmdRes = ``
    try {
      cmdRes = execSync(
        util.logLine(newReportItem),
        {
          cwd: repositoryItem.path,
        }
      )
    } catch (error) {
      util.errExit(`获取 git 工作记录失败`, error)
    }
    const list = paserLogToList({str: cmdRes})
    const toMdRes = toMd({
      list,
      rootLevel: newReportItem.rootLevel,
    })
    const obj = {
      name: `${`#`.repeat(util.getTitleLevel({type: `repository`, rootLevel: newReportItem.rootLevel}))} ${repositoryItem.name}`,
      toMdRes
    }
    return [
      obj.name,
      obj.toMdRes,
      `\n`,
    ].join(`\n`)
  }).join(`\n`).trim()
  const out = util.handleTemplateFile({report: reportItem, body: repository})
  require(`fs`).writeFileSync(newReportItem.outFile, out)
})