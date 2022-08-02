const fs = require('fs')
const os = require('os')
const cp = require('child_process')
const path = require('path')
const moment = require('moment')
const mustache = require('mustache')
const stringSimilarity = require('string-similarity')
const opener = require('./lib/opener.js')
const unionby = require('lodash.unionby')
const pkg = require(`./package.json`)


function removeLeft(str) {
  const lines = str.split(`\n`)
  // 获取应该删除的空白符数量
  const minSpaceNum = lines.filter(item => item.trim())
    .map(item => item.match(/(^\s+)?/)[0].length)
    .sort((a, b) => a - b)[0]
  // 删除空白符
  const newStr = lines
    .map(item => item.slice(minSpaceNum))
    .join(`\n`)
  return newStr
}

function print(...arg) {
  return console.log(...arg)
}

/**
 * 获取所使用的 git log 命令
 * @returns string
 */
function logLine({after, before}) {
  // 由于 git --before 包含当天, 但 --after 不包含当天, 所以 after 需要再推前
  const newAfter = moment(after).add({day: -1}).format(`YYYY-MM-DD`)
  const str = [
    `git`,
    `log`,
    `--branches`,
    `--after=${newAfter}`,
    `--before=${before}`,
    `--no-merges`,
    `--format=fuller`,
  ].join(` `)
  return str
}

function help() {
  print(`请访问 ${pkg.homepage} 查看使用文档`)
  opener(pkg.homepage)
}

function execSync(cmd, option) {
  print(`>`, cmd)
  return cp.execSync(cmd, option).toString().trim()
}

function dateFormater(t, formater) { // 时间格式化
  let date = t ? new Date(t) : new Date()
  return moment(date).format(formater)
}

function parseArgv(arr) { // 解析命令行参数
  return (arr || process.argv.slice(2)).reduce((acc, arg) => {
    let [k, ...v] = arg.split(`=`)
    v = v.join(`=`) // 把带有 = 的值合并为字符串
    acc[k] = v === `` // 没有值时, 则表示为 true
      ? true
      : (
        /^(true|false)$/.test(v) // 转换指明的 true/false
        ? v === `true`
        : (
          /[\d|.]+/.test(v)
          ? (isNaN(Number(v)) ? v : Number(v)) // 如果转换为数字失败, 则使用原始字符
          : v
        )
      )
    return acc
  }, {})
}

function handleMsg(rawMsg) {
  let msg = ((rawMsg.match(/(\n\n)([\s\S]+?$)/) || [])[2] || ``)
  msg = removeLeft(msg)
  let [one, ...body] = msg.split(`\n`)
  one = handleOneMsg(one)
  let newMsg = ``
  if(GET(`curReport`).messageBody === `none`) { // 不使用 body
    newMsg = one
  }
  if(GET(`curReport`).messageBody === `compatible`) { // 当 body 含有可能破坏报告的内容时不使用
    if(
      // 含有 body 时
      (body.filter(item => item.trim()) > 1)
      // body 中有特殊样式时
      && body.some(item => (
        // 含有 # 标题
        item.match(/^#{1,6}\s+/)
        // 含有分割线
        // || item.match(/^#{1,6}\s+/).split(`-`).filter(item => item).length === 0
      ))
    ) {
      newMsg = one
    } else {
      newMsg = [one, ...body].join(`\n`)
    }
  }
  if(GET(`curReport`).messageBody === `raw`) { // 原样使用 body
    newMsg = [one, ...body].join(`\n`)
  }
  newMsg = newMsg.trim()
  return newMsg
}

/**
 * 根据 git commit 规范转换 msg 风格
 */
function handleOneMsg(msg) {
  const {type, scope, subject} = parseMsg(msg)
  let newMsg = msg
  const [key, val] = Object.entries(GET(`curReport`).messageConvert).find(([key, val]) => {
    const {rating} = stringSimilarity.findBestMatch(type, [key, ...val.alias]).bestMatch
    return (rating > GET(`curReport`).messageTypeSimilarity)
  }) || []
  if(key) {
    const template = scope ? val.des.text[1] : val.des.text[0]
    const text = render( [template, subject].join(``), {scope})
    const emoji = val.des.emoji
    const newText = render(GET(`curReport`).messageTypeTemplate, {text, emoji})
    newMsg = newText
  }
  return newMsg
}

/**
 * 解析 git msg 中的 type scope subject
 * arg0 string
 * @param {*} msg 
 * @returns 
 */
function parseMsg(msg) {
  let type, scope, subject
  ;[, type = ``, subject = ``] = msg.trim().match(/(.+?)[:：][\s+](.*$)/) || []
  ;[, type = ``, scope = ``] = type.trim().match(/\s{0}(.+?)\s{0}\(\s{0,}(.*)\s{0,}\)$/) || [, type]
  type = type.trim()
  scope = scope.trim()
  subject = subject.trim()
  const res = {type, scope, subject}
  return res
}

/**
 * 把 git log 的内容解析为数组
 * @param {*} str 
 * @returns 
 */
function paserLogToList({str}) {
  const authorList = GET(`curReport`).author || []
  str = `\n${str}`
  const tag = /\ncommit /
  let list = str.split(tag).filter(item => item.trim()).map(rawMsg => {
    rawMsg = `commit ${rawMsg}`
    const obj = {}
    obj.raw = rawMsg
    // 使用 CommitDate 而不是 AuthorDate
    // CommitDate: 被再次修改的时间或作为补丁使用的时间
    obj.date = (dateFormater((rawMsg.match(/CommitDate:(.*)/) || [])[1].trim(), 'YYYY-MM-DD HH:mm:ss'))
    // commit sha
    obj.commit = (rawMsg.match(/(.*)\n/) || [])[1].trim()
    // 作者及邮箱
    obj.author = (rawMsg.match(/Author:(.*)/) || [])[1].trim()
    obj.msg = handleMsg(rawMsg)
    return obj
  }).filter(item => {
    return (
      ( // 时间范围
        moment(item.date).isSameOrBefore(GET(`curReport`).before)
        && moment(item.date).isSameOrAfter(GET(`curReport`).after)
      )
      && ( // 作者
        GET(`curReport`).ignoreAuthor ||
        authorList.some(author => {
          return item.author.startsWith(`${author} <`)
        } ) 
      )
    )
  })
  // 去除重复的 msg
  GET(`curReport`).noEqualMsg && (list = unionby(list, `msg`));
  // 去除大于指定相似度的 msg
  GET(`curReport`).similarity && (list = list = removeSimilarity({list, key: `msg`, similarity: GET(`curReport`).similarity}));
  return list
}

/**
 * 删除数组中指定字段的相似度大于指定值的数组
 * arg.list 提供的数组
 * arg.key 要比较相似度的字段
 * arg.similarity 相似值
 */
function removeSimilarity({list, key = `msg`, similarity = 0.75}) {
  let msgList = list.map(item => item[key])
  let res = []
  msgList.forEach((msg, index) => {
    let newList = [...msgList]
    newList.splice(index, 1)
    const diff = stringSimilarity.findBestMatch(msg, newList)
      .ratings
      .filter(item => {
        return item.rating > similarity
      }).map(item => item.target)
      const select = diff.length ? diff[0] : msg
      res = res.includes(select) ? res :  res.concat(msg)
  })
  const newList = list.filter(item => res.includes(item[key]))
  return newList
}


/**
 * 根据指定的 key 排序
 * @param {boolean} showNew false 降序 true 升序
 * @param {string} key 要排序的 key
 * @returns function
 */
function sort(showNew, key) {
  return (a, b) =>  showNew ? (b[key] - a[key]) : (a[key] - b[key])
}

/**
 * 根据 title 标记输出 md
 * @param {object} param0
 * @param {array} param0.list log 数据
 * @returns string
 */
function create({list, rootLevel}) {
  const template = GET(`curReport`).template
  const titleMap = {
    'month': [
      '@{year}年@{month}月',
    ],
    'month-week': [
      '@{year}年@{month}月',
      '第@{week}周',
    ],
    'month-week-day': [
      '@{year}年@{month}月',
      '第@{week}周',
      '@{day}日 星期@{weekDay}',
    ],
    'week': [
      '@{year}年@{month}月 第@{week}周',
    ],
    'week-day': [
      '@{year}年@{month}月 第@{week}周',
      '@{day}日 星期@{weekDay}',
    ],
    'day': [
      '@{year}年@{month}月@{day}日',
    ],
  }
  let titleList = titleMap[template]
  if(!titleList) {
    new Error(`不支持的标记`)
    return process.exit()
  } else { // 添加 # 标题标志
    titleList = titleList.map((item, index) => {
      const level = getTitleLevel({type: `date`, rootLevel}) + index
      return `${`#`.repeat(level)} ${item}`
    })
  }
  let oldTitle = []
  const str = list.map(item => {
    let titleStr = []
    const newTitle = titleList.map((title, index) => {
      // 模拟一段代码实现简单的模板语法
      title = render(`\n${title}`, item.dateObj)
      titleStr[index] = oldTitle[index] === title ? `` : title
      return title
    } )
    const res = [
      titleStr.join(``),
      `- ${debug({item})}${ // 多行 msg 的时候在行前面加空格, 以处理缩进关系
        item.msg.split(`\n`).map((msgLine) => `  ${msgLine}`).join(`\n`).trim()
      }`
    ].filter(item => item).join(`\n`)
    oldTitle = newTitle
    return res
  }).join(`\n`).trim()
  return str
}

function debug({item}) {
  if(GET(`cli`)[`--debug`]) {
    return `${item.date} ${item.commit} ${item.author}\n  `
  } else {
    return ``
  }
}

/**
 * 根据标志对应的时间转换为 markdown 格式
 * @param {object} param0 
 * @param {string} [param0.tag = day] - 标记
 * @param {array} param0.list - 数据
 * @param {boolean} [param0.showNew = true] - 是否把新时间排到前面
 */
function toMd({
  list = [],
  showNew = true,
  rootLevel = 1,
}){
  list = list.map(obj => { // 先把每个类型的时间取出来方便使用
    const date = new Date(obj.date)
    obj.timeStamp = date.getTime()
    obj.dateObj = {
      year: dateFormater(obj.date, `YYYY`),
      month: dateFormater(obj.date, `MM`),
      day: dateFormater(obj.date, `DD`),
      week: Math.ceil((date.getDate() + 6 - date.getDay()) / 7), // 第几周
      weekDay: [`日`, `一`, `二`, `三`, `四`, `五`, `六`][date.getDay()], // 星期几
    }
    return obj
  }).sort(sort(showNew, `timeStamp`))
  const res = create({
    list,
    rootLevel,
  })
  return res
}

/**
 * 获取模板对应的时间
 */
function handleLogTime({template}) {
  const tag = template.split(`-`).shift() // month week day
  // 处理 moment 是以周日作为每周的开始, 但现实中是以周一作为开始
  const offset = tag === `week` ? {day: 1} : {}
  const after = moment().startOf(tag).add(offset).format(`YYYY-MM-DD`)
  const before = moment().endOf(tag).add(offset).format(`YYYY-MM-DD`)
  return {after, before}
}

/**
 * 获取标题级别
 * 假设 rootLevel = 1, 效果为:
 * # 文档名称
 * ## 项目名称
 * ### 时间级别1
 * #### 时间级别2
 */
function getTitleLevel({type, rootLevel = 1}) {
  return {
    repository: rootLevel + 1,
    date: rootLevel + 2,
  }[type]
}

/**
 * 模板处理器
 * report 报告配置
 */
function handleTemplateFile({report, body}) {
  const insertBody = render(``, GET(`curReport`))
  const useFilePath = `${__dirname}/config/${report.useFile}` // 相对于配置文件的地址
  const useFilePathDefault = `${__dirname}/config/default.template.md` // 相对于配置文件的地址
  let mdBody = fs.existsSync(useFilePath) ? fs.readFileSync(useFilePath, `utf8`) : fs.readFileSync(useFilePathDefault, `utf8`)
  mdBody = render(mdBody, GET(`curReport`))
  mdBody = mdBody.replace(/<!--\s+slot-body-start\s+-->([\s\S]+?)<!--\s+slot-body-end\s+-->/, ($0, $1) => (body || $1))
  mdBody = mdBody.replace(/<!--\s+slot-insert-start\s+-->([\s\S]+?)<!--\s+slot-insert-end\s+-->/, ($0, $1) => (insertBody || $1))
  return mdBody
}

/**
 * 渲染模板
 * @param {*} template 
 * @returns 
 */
function render(template, view) {
  return mustache.render(template, view, {}, [`@{`, `}`])
}

/**
 * 处理报告配置，例如使用命令行参数覆盖报告中的配置
 */
function handleReportConfig({reportItem: cfg, query: cli}) {
  const curPath = process.cwd()
  const curPathName = path.parse(curPath).name
  const newReport = {
    // 默认值
    ...GET(`reportDefault`),
    // 配置值
    ...cfg,
    // 命令行值
    ...Object.entries(cli).reduce((acc, [key, val]) => ({...acc, [key]: val}), {})
  }
  // 根据 template 预处理时间
  newReport.after = newReport.after || handleLogTime({template: newReport.template}).after
  newReport.before = newReport.before || handleLogTime({template: newReport.template}).before

  newReport.author = cli[`author`] 
    ? cli[`author`].split(`,`) 
    : (
      (cfg.author && cfg.author.length) 
      ? cfg.author 
      : [getDefaultGitName()]
    );

  newReport.authorName = newReport.authorName || newReport.author[0]
  newReport.repository = cli[`repository`] 
    ? cli[`author`].split(`,`).map(item => ({path: item, name: path.parse(item).name})) 
    : (
      (cfg.repository && cfg.repository.length) 
      ? cfg.repository 
      : [{path: curPath, name: curPathName}]
    );
  return newReport
}

function getDefaultGitName() {
  try {
    return execSync(`git config user.name`)
  } catch (error) {
    errExit(`获取 git 的默认用户名失败`, error)
  }
}

function errExit(msg, error) {
  print(msg)
  print(String(error))
  process.exit()
}

/**
 * 初始化程序
 */
function init() {
  global.SET = (key, val) => {
    print(`SET`, key, val)
    global[`${pkg.name}_${key}`] = val
    return val
  }
  global.GET = (key) => {
    return global[`${pkg.name}_${key}`]
  }
  global.SET(`package`, pkg)
  const configdir = `${os.homedir()}/.${pkg.name}/`
  global.SET(`configdir`, configdir)
  global.SET(`configFilePath`, `${configdir}/config.js`)
  global.SET(`reportDefault`, require(`./config/config.js`).report.find(item => item.select === `default`))
  if(fs.existsSync(configdir) === false) { // 创建配置文件目录
    fs.mkdirSync(configdir, {recursive: true})
  }
  
  // 如果文件不存在, 则创建它们
  [
    [`${__dirname}/config/config.js`, GET(`configFilePath`)],
    [`${__dirname}/config/default.template.md`, `${GET(`configdir`)}/default.template.md`],
  ].forEach(([form, to]) => {
    if(
      (fs.existsSync(to) === false)
      || (fs.readFileSync(to, `utf8`).trim() === ``)
    ) { // 创建配置文件
      fs.copyFileSync(form, to)
    }
  })
  global.SET(`config`, require(GET(`configFilePath`)))
}

module.exports = {
  init,
  opener,
  errExit,
  handleReportConfig,
  handleTemplateFile,
  getTitleLevel,
  handleLogTime,
  logLine,
  toMd,
  create,
  sort,
  help,
  print,
  removeLeft,
  execSync,
  parseArgv,
  paserLogToList,
}