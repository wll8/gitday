#!/usr/bin/env node

// https://git-scm.com/docs/git-log
const cp = require('child_process')
const fs = require('fs')
const argv = parseArgv()
const query = {
  '--help': argv[`--help`],
  '--author': argv[`--author`] || execSync(`git config user.name`),
  '--x-template': argv[`--x-template`] || `week`,
  '--after': argv[`--after`],
}

{ // 关联参数特殊处理
  if(query['--help']) {
    const cliName = `gitday`
    print(
`
读取 git log 的数据生成类似月报/周报/日报的 markdown 文档.

参数:

--help 显示使用方法
name=[作者名称] 默认为 git config user.name 的值
date=[时间范围] 默认为 tag 的最大标志日期, 例如 month-week 则自动取最近一个月. 支持 git 
tag=[格式模板] 默认 week, 支持 month/week/day 或其组合

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
    return
  }

  query['--after'] = query['--after'] || `1.${query['--x-template'].split(`-`).shift()}s`
}

/**
git log

--author 作者
--all 显示所有分支
--after=1.months 显示某个时间之后
--no-merges 不包括 merges


 */
const cmdRes = execSync(`git log --author="${query[`--author`]}" --all --after="${query[`--after`]}" --no-merges`)
const list = paserLogToList(cmdRes)
const toMdRes = toMd({tag: query['--x-template'], list})
print(toMdRes)

process.exit()

function parseArgv() {
  return process.argv.slice(2).reduce((acc, arg) => {
    let [k, v = true] = arg.split('=')
    acc[k] = v
    return acc
  }, {})
}

function paserLogToList(str) { // 把 git log 的内容解析为数组
  str = `\n${str}`
  const tag = /\ncommit /
  const list = str.split(tag).filter(item => item.trim()).map(item => {
    const obj = {}
    obj.raw = item
    obj.date = (dateFormater((item.match(/Date:(.*)/) || [])[1].trim(), 'YYYY-MM-DD HH:mm:ss'))
    obj.commit = (item.match(/(.*)\n/) || [])[1].trim()
    obj.author = (item.match(/Author:(.*)/) || [])[1].trim()
    obj.msg = (item.match(/    [\s\S]+?$/) || [])[0] // 去除 msg 前面的多于空格
      .split('\n')
      .reduce((all, str) => all + (str.replace('    ', '\n')), '')
      .trim()
    return obj
  })
  return list
}

function dateFormater(t, formater) { // 时间格式化
  let date = t ? new Date(t) : new Date(),
    Y = date.getFullYear() + '',
    M = date.getMonth() + 1,
    D = date.getDate(),
    H = date.getHours(),
    m = date.getMinutes(),
    s = date.getSeconds();
  return formater.replace(/YYYY|yyyy/g, Y)
    .replace(/YY|yy/g, Y.substr(2, 2))
    .replace(/MM/g, (M < 10 ? '0' : '') + M)
    .replace(/DD/g, (D < 10 ? '0' : '') + D)
    .replace(/HH|hh/g, (H < 10 ? '0' : '') + H)
    .replace(/mm/g, (m < 10 ? '0' : '') + m)
    .replace(/ss/g, (s < 10 ? '0' : '') + s)
}

function absPath(file = '') {
  return require('path').resolve(__dirname, file)
}

function execSync(cmd) {
  print(`>`, cmd)
  return cp.execSync(cmd).toString().trim()
}

function print(...arg) {
  return console.log(...arg)
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
      weekDay: date.getDay(), // 星期几
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
      `- ${ // 多行 msg 的时候在行前面加空格, 以处理缩进关系
        item.msg.split(`\n`).map((msgLine) => `  ${msgLine}`).join(`\n`).trim()
      }`
    ].filter(item => item).join(`\n`)
    oldTitle = newTitle
    return res
  }).join(`\n`).trim()
  return str
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