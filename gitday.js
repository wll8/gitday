#!/usr/bin/env node

// https://git-scm.com/docs/git-log
const cp = require('child_process')
const json2yaml = require(absPath('./json2yaml.js'))
const fs = require('fs')
const argv = parseArgv()
const query = {
  help: argv['--help'], // 显示帮助信息
  name: argv.name || execSync(`git config user.name`), // 作者名称, 默认为当前项目配置的名称
  date: argv.date || dateFormater(new Date(), `YYYY-MM-DD`), // 查询日期, 默认为今天
  all: argv['--all'], // 是否忽略所有条件, 查询所有
  partake: argv['--partake'], // 忽略所有条件, 查询所有成员的参与度
  format: argv.format || 'line', // 输出格式: line | yaml | json
  complete: argv['--complete'], // 以完整模式输出, 显示完成的 commitId, 且不排除 Merge 类型的提交
}

{ // 关联参数特殊处理
  if(query.help) {
    const cliName = 'gitday' // todo rename to codelog
    print(
`
-- month
## 2021年01月
- commitNsg
- commitNsg

-- month-week
## 2021年01月
### 第1周
- commitNsg
- commitNsg

-- month-week-day
## 2021年01月
### 第1周
#### 礼拜1
- commitNsg
- commitNsg

-- week
## 2021年01月 第1周
- commitNsg
- commitNsg

-- week-day
## 2021年01月 第1周
### 礼拜1
- commitNsg
- commitNsg

-- day
## 2021年01月24日
- commitNsg
- commitNsg




以作者及日期为条件，进行日志查询、统计和格式化.

参数:

name=@all 作者名称, 默认为当前项目配置的名称, @all 不限
date=@all|@-1... 查询日期, 默认为今天, @all 不限; @-1 前1天; @-2 前2天...
format=line|yaml|json 输出格式
--help 显示使用方法
--all 是否忽略所有条件, 查询所有
--partake 忽略所有条件, 查询所有成员的参与度
--complete 以完整模式输出, 显示完整的 commitId, 且不排除 Merge 类型的提交

示例:

${cliName} # 今天你做了什么?
${cliName} name=小明 # 今天实习生做了什么?
${cliName} date=@-1 # 昨天你做了什么?
${cliName} date=@-1 format=yaml # 使用 yaml 格式输出, 昨天你做了什么?
${cliName} name=小明 date=@-1 # 昨天小明做了什么?
${cliName} name=小明 date=2019-09-09 # 2019-09-09 小明做了什么?
${cliName} --all --partake # 统计这个项目中所有开发人员的参与情况?

-month
-week
-day
-支持组合, 例如 week-day

`)
    return
  }

  query.partake && (query.format = 'yaml');
  let findPast = query.date.match(/@-(\d+)/)
  if(findPast) {
    let newDate = new Date(Date.now() - Number(findPast[1]) * 24*60*60*1000)
    let findDay = dateFormater(newDate, 'YYYY-MM-DD')
    query.date = findDay
  }
}

const author = execSync(`git config user.name`) // 获取当前配置的 git 用户名
const cmdRes = execSync(`git log --author="${author}" --all --decorate --since=1.months`) // --all 显示所有分支 --decorate 显示完整的提交分支
const list = paserLogToList(cmdRes)
console.log(`list`, list)
toMd({list})
process.exit()

const filterList = list.filter(item => {
  return (
    (query.complete || !item.Merge) // 完整模式下不排除 Merge 类型的提交
    && (
      query.all
      || (
        (query.name.includes('@all') || item.Author.match(new RegExp(`^${query.name} <`)))
        && (query.date.includes('@all') || item.Date.includes(query.date))
      )
    )
  )
})


const obj = listToAuthorDay(filterList)

if(query.partake) {
  for (const key in obj) {
    obj[key] = ''
  }
}

const stringifyObj = JSON.stringify(obj, null, 2)


process.exit()
// fs.writeFileSync(absPath('./gitday.json'), stringifyObj)

;({
  json: () => print(stringifyObj),
  yaml: () => print(json2yaml(stringifyObj)),
  line: () => {
    let hasMultiple = Object.keys(obj).length > 1
    let line = filterList.reduce((all, item, index) => {
      let time = dateFormater(item.Date, 'HH:mm')
      return all
        + `${index+1}: ${time} ` // 序号和时间
        + `${hasMultiple ? item.Author.match(/(.*) </)[1] + ' ' : ''}` // 查询多个作者时输入作者名
        + item.Msg // log 信息
        + '\n'
    }, '')
    print(line)
  },
})[query.format]()

function parseArgv() {
  return process.argv.slice(2).reduce((acc, arg) => {
    let [k, v = true] = arg.split('=')
    acc[k] = v
    return acc
  }, {})
}

function listToAuthorDay(list) { // 转换 log list
  let obj = {}
  list.forEach((item, index, arr) => { // 按 Author >> Day 进行层级化
    let key = item.Author
    let day = dateFormater(item.Date, 'YYYY-MM-DD')
    { // 设置 Author
      (obj[key] || (obj[key] = {}))
    }
    { // push 每条记录到 day 中
      (obj[key][day] || (obj[key][day] = [])).push(({
        ...item,
        Commit: query.complete ? item.Commit : item.Commit.slice(0, 7),
        Author: query.complete ? item.Author : undefined,
      }))
    }
  })

  // 统计每个 key 下的内容, 并保存到 key 上
  let objKey = Object.keys(obj)
  for (let index = 0; index < objKey.length; index++) {
    const author = objKey[index]
    const authorObj = obj[author]
    const authorObjKey = Object.keys(authorObj)
    const authorObjKeyLength = authorObjKey.length
    const newAuthorLabel = `${author} | day: ${authorObjKeyLength} | commit: ${list.filter(item => item.Author === author).length}`
    obj[newAuthorLabel] = authorObj
    delete obj[author]

    for (let index = 0; index < authorObjKey.length; index++) {
      const day = authorObjKey[index]
      let newDayLabel = `${day} | week: ${new Date(day).getDay()} | commit: ${authorObj[day].length}`
      obj[newAuthorLabel][newDayLabel] = authorObj[day]
      delete authorObj[day]
    }

  }

  return obj
}

function paserLogToList(str) { // 把 git log 的内容解析为数组
  str = `\n${str}`
  const tag = /\ncommit /
  const list = str.split(tag).filter(item => item.trim()).map(item => {
    const obj = {}
    // obj.Raw = item
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
  console.log([`>`, console.log(cmd)].join(`\n`))
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
    obj.timeStamp = new Date(obj.date).getTime()
    obj.dateObj = {
      year: dateFormater(obj.date, `YYYY`),
      month: dateFormater(obj.date, `MM`),
      week: Math.ceil(new Date(obj.date).getDate() / 7),
      day: dateFormater(obj.date, `DD`),
      weekDay: new Date(obj.date).getDay() + 1, // 礼拜n

      // month: dateFormater(obj.date, `YYYY年MM月`),
      // week: `${dateFormater(obj.date, `YYYY年MM月`)} 第${Math.ceil(new Date(obj.date).getDate() / 7)}周 礼拜${new Date(obj.date).getDay() + 1}` ,
      // day: `${dateFormater(obj.date, `YYYY年MM月DD日`)}` ,
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
          '#### 礼拜${weekDay}',
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
          '### 礼拜${weekDay}',
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
  // console.log(`res`, JSON.stringify(res, null, 2))
  console.log(`res`, res)

  function create({tag, list}) {
    let oldTitle = ``
    const str = list.map(item => {
      const newTitle = tag.map(title => {
        title = `({ year, month, week, day, weekDay }) => \`\n${title}\``
        return eval.call(null, title)(item.dateObj)
      } ).join(``)
      let str = ``
      if(oldTitle !== newTitle) {
        oldTitle = newTitle
        str = newTitle
      }
      return [str, `- ${item.date}`].filter(item => item).join(`\n`)
    }).join(`\n`).trim()
    return str
  }
  
}

function sort(showNew, key) {
  return (a, b) =>  showNew ? (b[key] - a[key]) : (a[key] - b[key])
}