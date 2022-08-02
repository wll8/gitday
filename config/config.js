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
      messageTypeSimilarity: 0.8,
      messageTypeTemplate: `@{emoji}@{text}`,
      useMessageConvert: true,
      messageConvert: {
        feat: {
          alias: [`feature`],
          des: {
            emoji: `✨`,
            text: [`添加功能: `, `在@{scope}中添加新功能: `],
          },
        },
        fix: {
          alias: [`fixed`],
          des: {
            emoji: `🐛`,
            text: [`修复缺陷: `, `修复@{scope}中的缺陷: `],
          },
        },
        doc: {
          alias: [`docs`],
          des: {
            emoji: `📝`,
            text: [`更新文档: `, `更新@{scope}中的文档: `],
          },
        },
        style: {
          alias: [`styles`],
          des: {
            emoji: `🌈`,
            text: [`优化代码可读性: `, `优化@{scope}中的代码可读性: `],
          },
        },
        build: {
          alias: [],
          des: {
            emoji: `📦`,
            text: [`更新构建工具: `, `更新@{scope}中的构建工具: `],
          },
        },
        refactor: {
          alias: [],
          des: {
            emoji: `♻️`,
            text: [`重构代码: `, `重构@{scope}中的代码: `],
          },
        },
        revert: {
          alias: [],
          des: {
            emoji: `⏪`,
            text: [`回退代码: `, `回退@{scope}中的代码: `],
          },
        },
        test: {
          alias: [],
          des: {
            emoji: `🚨`,
            text: [`更新测试逻辑: `, `更新@{scope}中的测试逻辑: `],
          },
        },
        perf: {
          alias: [],
          des: {
            emoji: `🚀`,
            text: [`提升性能: `, `提升@{scope}中的性能: `],
          },
        },
        ci: {
          alias: [],
          des: {
            emoji: `💚`,
            text: [`更新持续集成服务: `, `更新@{scope}中的持续集成服务: `],
          },
        },
        chore: {
          alias: [],
          des: {
            emoji: `🔧`,
            text: [`更新辅助工具: `, `更新@{scope}中的辅助工具: `],
          },
        },
      },
      ignoreAuthor: false,
    },
  ],
}