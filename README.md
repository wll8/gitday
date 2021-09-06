# gitday
读取 git log 的数据生成类似月报/周报/日报的 markdown  

## 体验或安装
``` sh
npx github:wll8/gitday --help
npm i -g wll8/gitday && gitday --help
```

## 参数:

``` txt
--help 显示使用方法
--author=[作者名称] 默认为 git config user.name 的值  
--after=[时间范围] 默认为 --x-template 的最大标志日期, 例如 month-week 则自动取最近一个月. 支持 git 的参数形
式
--x-template=[格式模板] 默认 week, 支持 month/week/day 或其组合

示例:

gitday --x-template=month
## 2021年01月
- commitMsg
- commitMsg

gitday --x-template=month-week
## 2021年01月
### 第1周
- commitMsg
- commitMsg

gitday --x-template=month-week-day
## 2021年01月
### 第1周
#### 21日 星期1
- commitMsg
- commitMsg

gitday --x-template=week
## 2021年01月 第1周
- commitMsg
- commitMsg

gitday --x-template=week-day
## 2021年01月 第1周
### 21日 星期1
- commitMsg
- commitMsg

gitday --x-template=day
## 2021年01月24日
- commitMsg
- commitMsg
```

## 注
- 请在 git 仓库目录下使用本程序。
- 本程序使用 git log 的信息进行分析, 不会对你的项目产生任何影响。
- 没有第三方依赖。
