王小花的工作报告(2022-08-01 至 2022-08-21)

- [1. 工作报告](#1-工作报告)
  - [1.1. 工作报告生成器](#11-工作报告生成器)
    - [1.1.1. 2022年08月 第3周](#111-2022年08月-第3周)
    - [1.1.2. 2022年08月 第1周](#112-2022年08月-第1周)
  - [1.2. markdown 转换工具](#12-markdown-转换工具)
    - [1.2.1. 2022年08月 第3周](#121-2022年08月-第3周)
    - [1.2.2. 2022年08月 第2周](#122-2022年08月-第2周)
    - [1.2.3. 2022年08月 第1周](#123-2022年08月-第1周)
  - [1.3. 接口伴侣](#13-接口伴侣)
    - [1.3.1. 2022年08月 第3周](#131-2022年08月-第3周)
    - [1.3.2. 2022年08月 第1周](#132-2022年08月-第1周)
- [2. 后续计划](#2-后续计划)
  - [2.1. 工作报告生成器](#21-工作报告生成器)

---

大家好，以下内容是我的工作报告和后续计划，不足之处敬请指正。


## 1. 工作报告

小结：在这个阶段中，主要精力集中在 `工作报告生成器` 这个项目，以及 `添加功能` 。 处理 `支持过滤掉相似度较高的 msg` 这项工作消耗了比预期较多的时间，主要原因是 `在实现功能上需要处理比较多的逻辑` 。


### 1.1. 工作报告生成器
#### 1.1.1. 2022年08月 第3周
- 🔧更新辅助工具: 屏蔽无关日志, 使用 readme 作为 help 输出
- ✨添加功能: 更新默认模板
- 🐛修复缺陷: git log 结果仅有一条时不应出现错误
  
  ```
  Error: Bad arguments: First argument should be a string, second should be an array of strings
  ```

#### 1.1.2. 2022年08月 第1周
- ✨添加功能: 比较 commit msg 时忽略大小写
- ✨添加功能: 支持 ignoreAuthor 参数, 是否忽略按用户名进行过滤
- ✨添加功能: 使用 --branches 参数而不是 --all 参数
- 🐛修复缺陷: 修复 --debug 参数失效
- ✨添加功能: 从命令行覆盖配置项不再需要 -- 前缀
- 🐛修复缺陷: 处理 --help 报错
- 🐛修复缺陷: 需要显示当天内容
  
  - 例如当天是 2022-08-01, 并且当天有 commit, 但是运行 `after=2022-08-01 before=2022-08-31` 没有任何输出. 运行 `after=2022-07-31 before=2022-07-31` 也没有输出.
  - 应变更为包含当天
- ✨添加功能: 转换 msg 提交标志
  
  例如转换 `fix(client): xxx` 为 `修复 client 中的缺陷: xxx`
- ✨添加功能: 支持过滤掉相似度较高的 msg


### 1.2. markdown 转换工具
#### 1.2.1. 2022年08月 第3周
- 📝更新文档: update readme
- 🐛修复缺陷: 不应屏蔽 console.log, 因为源插件使用它输出错误

#### 1.2.2. 2022年08月 第2周
- ✨添加功能: 简化输入参数
- 🔧更新辅助工具: 更新文档, 修剪日志
- ✨添加功能: 简化输入的命令
  
  - 前: extension.js cmd=extension.markdown-pdf.pdf
  - 后: extension.js out=pdf
- ✨添加功能: 优化 input 参数合法性判断
- ✨添加功能: 实现从命令行导出 pdf
  
  ``` sh
  extension.js cmd=extension.markdown-pdf.pdf input=D:/README.zh.md
  ```

#### 1.2.3. 2022年08月 第1周
- ✨添加功能: 实现对象拦截, 目前验证 vscode 功能正常
- ✨添加功能: 使用自己实现的方法简单实现拦截
- ✨添加功能: 在 node 环境创建 vscode proxy
  
  但是在 vscode 环境会导致 proxy 失败.
  
  如果对 vscode 对象进行代理, 会报以下错误:
  ``` txt
  TypeError: 'get' on proxy: property 'getText' is a read-only and non-configurable data property on the proxy target but the proxy did not return its actual value (expected 'getText(p){return p?w._getTextInRange(p):w.getText()}' but got 'getText(p){return p?w._getTextInRange(p):w.getText()}')
  ```
- 🔧更新辅助工具: 添加 vsce package 和 npm build 命令


### 1.3. 接口伴侣
#### 1.3.1. 2022年08月 第3周
- 🐛修复缺陷: 避免 config.openApi 配置为空数组时出现读取错误

#### 1.3.2. 2022年08月 第1周
- ✨添加功能: 调整一些依赖为可选项
  
  注: yarn install 使用 --ignore-optional 或 --production 时依然会请求可选项中的依赖表文件
- ✨添加功能: 把动态依赖放置于 optionalDependencies
  
  因为动态安装经常不太稳定, 如果放置在可选依赖中则可以在第一次安装时尝试安装它们, 就算安装失败了也没有关系
- 🐛修复缺陷: hasPackage 不应只检测子级 node_modules
  
  例如全局安装时, npm 会把 node_modules 进行扁平化, 例如 md-cli 依赖了 mockm, 安装 md-cli 时, 只会存在 md-cli/node_modules 而不会存在 md-cli/node_modules/mockm/node_modules .


## 2. 后续计划
### 2.1. 工作报告生成器
- [ ] feat: 支持生成 html/pdf/jpeg...
- [ ] feat: 支持作为邮件自动发送