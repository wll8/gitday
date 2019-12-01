# gitday
以作者及日期查询 git提交日志, 并进行统计和格式化.

## 体验或安装
``` sh
npx github:wll8/gitday --help
npm i -g wll8/gitday && gitday --help
```

## 参数:

``` txt
name=@all 
作者名称, 默认为当前项目配置的名称, @all 不限

date=@all|@-1... 
查询日期, 默认为今天, @all 不限; @-1 前1天; @-2 前2天...

format=line|yaml|json 
输出格式

--help 
显示使用方法

--all 
是否忽略所有条件, 查询所有

--partake 
忽略所有条件, 查询所有成员的参与度

--complete 
以完整模式输出, 显示完整的 commitId, 且不排除 Merge 类型的提交
``` 


## 示例:

``` sh
gitday # 今天你做了什么?
gitday name=小明 # 今天小明做了什么?
gitday date=@-1 # 昨天你做了什么?
gitday name=小明 date=@-1 # 昨天小明做了什么?
gitday date=@-1 format=yaml # 使用 yaml 格式输出, 昨天你做了什么?
gitday name=小明 date=2019-09-09 # 2019-09-09 小明做了什么?
gitday --all --partake # 统计这个项目中所有开发人员的参与情况?
```

查看今天的提交记录
``` sh
$> qs gitday
1: 14:36 doc: 体验或安装
2: 14:01 fix: #!/usr/bin/env node
3: 13:50 feat(cli): gitday
``` 

统计项目中所有开发人员的参与情况, * 号马赛克~
可以清晰看到, 排在第一的成员开发了至少两个月，提交了 339 次代码。
``` sh
$> gitday --all --partake
x** <da***@gmail.com> | day: 55 | commit: 339:
h**** <f******@gmail.com> | day: 16 | commit: 38:
w** <wa******o@******.com> | day: 2 | commit: 7:
S****** <s******@163.com> | day: 1 | commit: 1:
wl** <x***@gmail.com> | day: 1 | commit: 4:
ch**** <wa**@****.com> | day: 1 | commit: 1:
k** <zh**@******.com> | day: 5 | commit: 7:
Y** <1522****@163.com> | day: 4 | commit: 5:
```

## 注
- 请在 git 仓库目录下使用本程序。
- 本程序使用 git log 的信息进行分析, 不会能你的项目产生任何影响。
- 没有第三方依赖。
