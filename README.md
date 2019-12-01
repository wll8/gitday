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
以完整模式输出, 显示完成的 commitId, 且不排除 Merge 类型的提交
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
