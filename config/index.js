module.exports = {
  report: [
    {
      select: `default`, // 报告标志, 可以使用不同的标志生成不同的周报
      title: `{{user.name}}的周报({{time.year}}年{{time.month}}月，第{{time.week}}周)`, // 报告标题, 例 # 张三的周报(2022年07月，第5周)
      layout: `repository-time`, // 布局方式 repository-time 先仓库后时间, time-repository 行时间后仓库
      author: [`wll8`], // 作者名称
      authorName: `张三`, // 实际输出到报告中的名称, 例如 git 用户名和报告中所需姓名不同时
      template: `week`, // 所用模板, 默认 week, 支持 month/week/day 或其组合
      useFile: `./个人项目小结-week.md`, // 使用文件模板, 相对于配置文件目录
      outFile: `./个人项目小结-week.out.md`, // 输出文件, 支持 .md .word .html, 相对于运行目录
      rootLevel: 1, // 从多少个#号开始表示第一级标题
      repository: [ // 仓库配置
        {
          path: `D:/git2/vue3`, // 绝对路径
          name: `vue 3.x`, // 仓库名
        },
        {
          path: `D:/git2/react`,
          name: `react`,
        },
      ],
    },
  ],
}