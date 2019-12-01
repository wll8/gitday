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
    const cliName = 'gitday'
    print(
`
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

const cmdRes = execSync('git log --all --decorate') // --all 显示所有分支 --decorate 显示完整的提交分支
const list = paserLogToList(cmdRes)
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
  let tag = '\ncommit '
  let list = str.split(tag).filter(item => item.trim()).map(item => {
    let obj = {}
    item.split('\n').forEach(line => {
      let [, key, val] = line.match(/^(\w+):\s+(.*)/) || [] // 使用正则取出 key val
      if(key) {
        obj[key] = val // 把每行中的值设置到对象的 key 上
        key === 'Date' && (obj[key] = (dateFormater(new Date(val), 'YYYY-MM-DD HH:mm:ss')) ) // 格式化时间
      }
    })
    obj.Commit = (item.match(/(.*)\n/) || [])[1]
    obj.Msg = (item.match(/    [\s\S]+?$/) || [])[0] // 匹配 msg 信息
    obj.Msg = obj.Msg // 去除 msg 前面的多于空格
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
  return cp.execSync(cmd).toString().trim()
}

function print(...arg) {
  return console.log(...arg)
}
