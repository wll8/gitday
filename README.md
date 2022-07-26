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
- [ ] feat: 支持输出为 html 以方便携带格式进入邮件
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