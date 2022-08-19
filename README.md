# gitwork
读取 git log 的数据生成类似月报/周报/日报的 markdown  

**效果演示**  

- [👉 多项目 week 格式的报告](https://wll8.github.io/gitwork/example/gitwork.out.week.html)
- [👉 多项目 month-week 格式的报告](https://wll8.github.io/gitwork/example/gitwork.out.month-week.html)

## 使用
``` sh
# 安装
npm i -g gitwork

# 生成当月工作报告
gitwork

# 指定开始时间生成报告
gitwork after=2021-01-01

# 生成周报
gitwork template=week

# 查看使用说明
gitwork --help

# 查看版本号
gitwork -v

# 打开配置文件所在位置
gitwork --config
```

## 命令行参数
- -v, --version 显示程序版本号
- --help 显示帮助页面
- --config 打开配置文件所在位置
- --select 选择报告配置

## 可配置项
这些选项来自配置文件，你可以使用 `gitwork --config` 打开配置文件所在位置，也可以在使用时通过命令行设置报告参数, 例如 `gitwork author=wll8` 。

- select
  - [x] 你可以使用配置文件保存多个报告，批量生成它们，多个使用逗号分割。
  - 可选值
    - default 程序默认的报告配置
    - 其他自己在配置文件中添加的模板标志
  - 默认值 `default`
- layout
  - [ ] 布局方式
  - 可选值
    - repository-time 先仓库后时间
    - time-repository 先时间后仓库
  - 默认值 `repository-time`
- author
  - [x] 指定要生成报告的 git 用户名
  - 可选值
    - 其他你自己指定的用户名，多个使用逗号分割
  - 默认值 `当前 git 用户`, 即 `git config user.name` 的值
- ignoreAuthor
  - 是否忽略按用户名进行过滤
  - 可选值
    - true
    - false
  - 默认值 false
- authorName
  - [x] 实际输出到报告中的名称, 例如 git 用户名和报告中所需姓名不同时
  - 默认值 `当前 git 用户`
- template
  - [ ] 报告的时间编排方式
  - 可选值
    - month
    - month-week
    - month-week-day
    - week
    - week-day
    - day
  - 默认值 `month-week`
- messageBody
  - 如何处理 git commit message 的 body 部分, 由于它的内容不可控, 可能会破坏报告
  - 可选值
    - raw 原样使用
    - none 不使用
    - compatible 当含有可能破坏报告的内容时不使用
  - 默认值: `compatible`
- useFile
 - [x] 使用文件模板, 相对于配置文件目录
  - 默认值: `./default.template.md`
- after
  - 开始时间, YYYY-MM-DD 格式
  - 默认值 `根据 template 转换`
- before
  - 结束时间, YYYY-MM-DD 格式
  - 默认值 `根据 template 转换`
- outFile
  - [ ] 输出文件, 支持 .md .html .pdf .jpeg .word .xlsx, 相对于运行目录
  - 默认值: `./gitwork.out.md`
- insertFile
  - [ ] 插入文件, 相对于运行目录
  - 默认值: `./todo.md`
- rootLevel
  - [x] 从多少个#号开始表示生成内容中最高级别标题, 不包含文档根结点标题, 根节点标题的级别应在 report.title 中添加
  - 默认值: 2
- repository
  - [x] 从哪些仓库中生成报告
  - 可选值
    - string 本地仓库绝对路径, 多个时使用逗号分割
    - array
      - path 本地仓库绝对路径
      - name 项目名称
  - 默认值: 当前仓库
- noEqualMsg
  - [x] 过滤掉重复的 msg
  - 可选值
    - true
    - false
  - 默认值: true
- similarity
  - [x] 过滤掉大于给定相似值的 msg
  - 可选值
    - 0 到 1 之前的值
  - 默认值: 0.75
- messageTypeSimilarity
  - [x] 配置 message type 的相似程度
  - 可选值
    - 0 到 1 之前的值
  - 默认值: 0.8
- noUnknownType
  - [x] 是否移除未知的 type
  - 可选值
    - true
    - false
  - 默认值: false
- messageTypeTemplate
  - [x] 配置 message 的生成模板
  - 可选值
    - 可使用字符串模板, 支持使用 messageConvert[type].des 中的变量
  - 默认值: `#{emoji}#{text}`
- messageConvert
  - [x] 配置 message 的详细生成规则
  - 可选值
    - false 不进行转换
    - object [自定义请参考](./config/config.js)
      - [type] git commit message type 标志
        - alias array type 别名
        - des type 转换配置
          - emoji 表情
          - text type 和 scope 的转换模板
            - 0 没有 scope 时的模板
            - 1 有 scope 时的模板
  - 默认值: [参考 config.js](./config/config.js)

## todo
- [ ] fix: 应使用保险的方式检查 messageBody 中的内容
- [ ] feat: 如果只有一个时间结点时, 则不显示它. 比如下面内容, 当为本周周报时, 重复显示 `2022年07月 第4周` 是没有意义的.
- [ ] feat: 格式化输出
  - 每个 commit 前插入一个空行
  - 多行 commit 消息时再每行后面添加两个空格, 这样默认 markdown 才会显示换行效果
  - 移除 commit title 与 body 之前的空行
  - 移除 body 后面多于的空行
  - 合并两个空行为一个
  - [x] 转换 msg 提交标志, 例如转换 `fix(client): xxx` 为 `修复 client 中的缺陷: xxx`