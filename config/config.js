module.exports = {
  report: [
    {
      select: `default`, // 默认配置, 不可删除
      layout: `repository-time`, // 
      author: [], // 当前用户名
      authorName: undefined, // 当前用户名
      template: `month-week`,
      messageBody: `compatible`,
      useFile: `./default.template.md`,
      after: ``,
      before: ``,
      outFile: `./${GET(`package`).name}.out.md`,
      insertFile: undefined,
      noEqualMsg: true,
      rootLevel: 2,
      similarity: 0.75,
      repository: [], // 当前项目
    },
  ],
}