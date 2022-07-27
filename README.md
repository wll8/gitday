# gitday
读取 git log 的数据生成类似月报/周报/日报的 markdown  

## 使用
``` sh
# 安装
npm i -g wll8/gitday

# 例: 以 月/周/天 的形式导出报告
gitday --x-template=month-week-day

# 查看使用说明
gitday --help
```

## 注
- 请在 git 仓库目录下使用本程序。
- 本程序使用 git log 的信息进行分析, 不会对你的项目产生任何影响。
- 没有第三方依赖。

## todo
- [ ] feat: 如果只有一个时间结点时, 则不显示它. 比如下面内容, 当为本周周报时, 重复显示 `2022年07月 第4周` 是没有意义的.
  ``` md
  # 项目一
  ## 2022年07月 第4周
  - feat: ...


  # 项目二
  ## 2022年07月 第4周
  - feat: ...

  ```
- [ ] fix: 应根据 CommitDate 移除不在指定范围内的 commit, 避免出现查这周但显示前几周的现象
- [ ] feat: 使用 --x-message-body 选项处理 message body 部分, 它的内容不可控制, 可能会破坏报告
  - raw 原样使用
  - none 不使用
  - compatible 默认, 当含有可能破坏报告的内容时不使用
- [ ] feat: 支持报告配置, 用于应对多个项目或周报
``` js
config = {
  report: [
    {
      select: `个人`, // 报告标志, 可以使用不同的标志生成不同的周报
      title: `{{user.name}}的周报({{time.year}}年{{time.month}}月，第{{time.week}}周)`, // 报告标题, 例 # 张三的周报(2022年07月，第5周)
      layout: `repository-time`, // 布局方式 repository-time 先仓库后时间, time-repository 行时间后仓库
      author: [`wll8`], // 作者名称
      authorName: `张三`, // 实际输出到报告中的名称, 例如 git 用户名和报告中所需姓名不同时
      template: `week`, // 所用模板, 默认 week, 支持 month/week/day 或其组合
      useFile: `./个人项目周小结.md`, // 使用文件模板, 相对于配置文件目录
      outFile: [`./个人项目周小结.html`], // 输出文件, 支持 .md .word .html, 相对于运行目录
      rootLevel: 1, // 从多少个#号开始表示第一级标题
      repository: [ // 仓库配置
        {
          path: `D:/git2/qs-cli`, // 绝对路径
          name: `命令行助手`, // 仓库名
        },
        {
          path: `D:/git2/mockm`,
          name: `接口联调器`,
        },
      ],
    },
  ],
}
```
- [ ] feat: 支持输出为 html 以方便携带格式进入邮件
- [ ] feat: 使用硬性时间节点, 而不是最近时间之后
  - 例如当天日期是7月26日, 周二, 运行以命令 `gitday --x-template=week`
    - 变更前查询 `最近7天`, 即 7月20日到7月26日 的提交记录.
    - 变更后查询 `本周`, 即 7月25日到7月26日 的提交记录.
- [x] feat: 支持 --x-debug 模式, 以确定输出是否正确
- [ ] feat: 支持输出到给定的模板文件中
- [ ] feat: 格式化输出
  - 每个 commit 前插入一个空行
  - 多行 commit 消息时再每行后面添加两个空格, 这样默认 markdown 才会显示换行效果
  - 移除 commit title 与 body 之前的空行
  - 移除 body 后面多于的空行
  - 合并两个空行为一个
  - 转换 msg 提交标志, 例如转换 `fix(client): xxx` 为 `修复 client 中的缺陷: xxx`
    ```
    # 主要type
    feat:     增加新功能
    fix:      修复bug

    # 特殊type
    docs:     只改动了文档相关的内容
    style:    不影响代码含义的改动，例如去掉空格、改变缩进、增删分号
    build:    构造工具的或者外部依赖的改动，例如webpack，npm
    refactor: 代码重构时使用
    revert:   执行git revert打印的message

    # 暂不使用type
    test:     添加测试或者修改现有测试
    perf:     提高性能的改动
    ci:       与CI（持续集成服务）有关的改动
    chore:    不修改src或者test的其余修改，例如构建过程或辅助工具的变动
    ```