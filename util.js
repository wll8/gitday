const cp = require('child_process')
const moment = require('moment')

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
function logLine({query}) {
  const str = [
    `git`,
    `log`,
    `--all`,
    `--after=${global.query['--after']}`,
    `--before=${global.query['--before']}`,
    `--no-merges`,
    `--format=fuller`,
  ].join(` `)
  return str
}

function help({cliName}) {
  return removeLeft(`
    读取 git log 的数据生成类似月报/周报/日报的 markdown 文档.
    
    参数:
    
    --help 显示使用方法
    --author=[作者名称] 默认为 git config user.name 的值
    --after=[时间范围] 默认为 --x-template 的最大标志日期, 例如 month-week 则自动取最近一个月. 支持 git 的参数形式
    --x-template=[格式模板] 默认 week, 支持 month/week/day 或其组合
    
    示例:
    
    ${cliName} --x-template=month
    ## 2021年01月
    - commitMsg
    - commitMsg
    
    ${cliName} --x-template=month-week
    ## 2021年01月
    ### 第1周
    - commitMsg
    - commitMsg
    
    ${cliName} --x-template=month-week-day
    ## 2021年01月
    ### 第1周
    #### 21日 星期1
    - commitMsg
    - commitMsg
    
    ${cliName} --x-template=week
    ## 2021年01月 第1周
    - commitMsg
    - commitMsg
    
    ${cliName} --x-template=week-day
    ## 2021年01月 第1周
    ### 21日 星期1
    - commitMsg
    - commitMsg
    
    ${cliName} --x-template=day
    ## 2021年01月24日
    - commitMsg
    - commitMsg
  
  `)
}

function execSync(cmd, option) {
  print(`>`, cmd)
  return cp.execSync(cmd, option).toString().trim()
}

function dateFormater(t, formater) { // 时间格式化
  let date = t ? new Date(t) : new Date()
  return moment(date).format(formater)
}

function parseArgv() {
  return process.argv.slice(2).reduce((acc, arg) => {
    let [k, v = true] = arg.split('=')
    acc[k] = v
    return acc
  }, {})
}

function handleMsg(rawMsg) {
  let msg = ((rawMsg.match(/(\n\n)([\s\S]+?$)/) || [])[2] || ``)
  msg = removeLeft(msg)
  if(global.query[`--x-message-body`] === `none`) { // 不使用 body
    msg = msg.split(`\n`)[0]
  }
  if(global.query[`--x-message-body`] === `compatible`) { // 当 body 含有可能破坏报告的内容时不使用
    const [one, ...body] = msg.split(`\n`)
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
      msg = one
    }
  }
  if(global.query[`--x-message-body`] === `raw`) { // 原样使用 body
    msg = msg
  }
  msg = msg.trim()
  return msg
}

/**
 * 把 git log 的内容解析为数组
 * @param {*} str 
 * @returns 
 */
function paserLogToList(str) {
  str = `\n${str}`
  const tag = /\ncommit /
  const list = str.split(tag).filter(item => item.trim()).map(rawMsg => {
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
      moment(item.date).isSameOrBefore(query['--before'])
      && moment(item.date).isSameOrAfter(query['--after'])
    )
  })
  return list
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
 * @param {array} param0.tag title 标志
 * @param {array} param0.list log 数据
 * @returns string
 */
function create({tag, list}) {
  let oldTitle = []
  const str = list.map(item => {
    let titleStr = []
    const newTitle = tag.map((title, index) => {
      title = eval.call(null, `({ year, month, week, day, weekDay }) => \`\n${title}\``)(item.dateObj)
      titleStr[index] = oldTitle[index] === title ? `` : title
      return title
    } )
    const res = [
      titleStr.join(``),
      `- ${debug({item})}${ // 多行 msg 的时候在行前面加空格, 以处理缩进关系
        item.msg.split(`\n`).map((msgLine) => `  ${msgLine}`).join(`\n`).trim()
      }`
    ].filter(item => item).join(`\n`)
    console.log({newTitle})
    oldTitle = newTitle
    return res
  }).join(`\n`).trim()
  return str
}

function debug({item}) {
  if(global.query[`--x-debug`]) {
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
function toMd({tag = `month`, list = [], showNew = true}){
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
  const handleObj =  {
    'month'(list) {
      return create({
        tag: [
          '## ${year}年${month}月',
        ],
        list,
      })
    },
    'month-week'(list) {
      return create({
        tag: [
          '## ${year}年${month}月',
          '### 第${week}周',
        ],
        list,
      })
    },
    'month-week-day'(list) {
      return create({
        tag: [
          '## ${year}年${month}月',
          '### 第${week}周',
          '#### ${day}日 星期${weekDay}',
        ],
        list,
      })
    },
    'week'(list) {
      return create({
        tag: [
          '## ${year}年${month}月 第${week}周',
        ],
        list,
      })
    },
    'week-day'(list) {
      return create({
        tag: [
          '## ${year}年${month}月 第${week}周',
          '### ${day}日 星期${weekDay}',
        ],
        list,
      })
    },
    'day'(list) {
      return create({
        tag: [
          '## ${year}年${month}月${day}日',
        ],
        list,
      })
    },
  }

  const handle = (handleObj)[tag]

  const res = handle ? handle(list) : new Error(`不支持的标记`);
  return res
}

/**
 * 获取模板对应的时间
 */
function handleLogTime({query}) {
  const tag = query['--x-template'].split(`-`).shift() // month week day
  // 处理 moment 是以周日作为每周的开始, 但现实中是以周一作为开始
  const offset = tag === `week` ? {day: 1} : {}
  const after = moment().startOf(tag).add(offset).format(`YYYY-MM-DD`)
  const before = moment().endOf(tag).add(offset).format(`YYYY-MM-DD`)
  return {after, before}
}

module.exports = {
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