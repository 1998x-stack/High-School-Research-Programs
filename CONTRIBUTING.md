# 贡献指南 · Contributing to Research Atlas

感谢帮助减少科研机会的信息差。我们欢迎**新增项目、纠正资料、补充高校培养基地、更新新年度招生规则、报告失效项目**。

## 原则：来源优先，疑问保留

1. 每条记录必须有**可打开的官方原始来源**，优先使用高校招生网、实验室/院所官网、中国科协、省级教育主管部门或主办机构网站。
2. 只引用该来源**明确写出的事实**。如果尚无明确费用、招生身份或时间，保留“未披露 / 待核实”。
3. 历史年度的计划不代表新的年度正在招生。请区分“2026已举办”与“2027已公布”。
4. “中学生英才计划 — 某大学培养基地”属于母计划的**高校轨道**；并不等于完全独立的项目。
5. 科学营 / 研学 / 讲座按短期科研体验归类，不能因为场地在实验室就标记为真实研究实习。
6. 少年班、英才班与特殊招生应标为 **admissions**，而不是暑期科研或实习。
7. 不收录未经验证的“保录取”“保论文”宣传；收录商业服务时明确标为商业，并注明费用与风险。
8. 不提交任何未成年人个人信息，包括学生姓名、联系方式、学籍、家庭收入、成绩单、选拔名单。

## 一、快速提出线索

不熟悉 GitHub 的参与者可以 [创建 Issue](https://github.com/1998x-stack/High-School-Research-Programs/issues/new)，至少提供：项目名称、主办机构、年份、官方原始链接、所在省/国家，以及最关键的一条资格限制。

维护者会先判断是否重复、是否已有同一个母计划，再审查来源。

## 二、直接修改数据

可编辑：

- **data/china-university-programs.json**：中国高校、科研院所承办轨道。建议新增中国专项信息到这里。
- **data/global-2026-2027.json**：已有 75 条全球原始条目（中文字段结构）。请保持既有结构，并填写所有能核实的信息。

**不要直接编辑 docs/data/catalog.json**：这是脚本自动生成的衍生数据，会在下一次构建时覆盖。

中国数据的字段（最核心）：

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| id | 是 | 稳定编号，如 CN-054；不得重用 |
| name | 是 | 带大学/轨道的准确名称 |
| host | 是 | 实际培养/承办机构 |
| country / province / city | 是/推荐 | 地区和所在地 |
| parent / track | 推荐 | 母项目与高校轨道 |
| type / tier | 是 | 中文类型 + 统一科研分层 |
| field | 推荐 | 研究方向，如计算机/生物 |
| delivery / duration | 推荐 | 线上、线下与期限 |
| eligibility | 是 | 居住地、学校推荐、年级、国籍等限制 |
| fee / aid | 推荐 | 费用和经济资助；未知则说明 |
| deadline | 推荐 | ISO YYYY-MM-DD，没公布则 null |
| status | 是 | 当届已举办/正在招募/2027待确认等 |
| year / source_date | 是 | 项目届次/证据发布年份（不混用） |
| source_url | 是 | **HTTPS 官网的具体原始页面** |
| checked_at | 是 | 最后人工核查日期 |
| notes | 推荐 | 特殊限制、竞争情况、真实性澄清 |

中国原始数据中已存在的默认字段由构建脚本补齐。新增编号前先检查已有的最大编号，避免重复。

### 中国高校轨道的示例

    {
      "id": "CN-054",
      "name": "某省中学生英才计划 · 某大学培养基地",
      "host": "某大学",
      "country": "中国",
      "province": "某省",
      "city": "某市",
      "type": "导师制科研",
      "tier": "mentor",
      "track": "高校培养基地",
      "parent": "中学生英才计划",
      "field": "数学/计算机",
      "delivery": "线下",
      "duration": "以当届通知为准",
      "eligibility": "某省内由学校推荐学生，范围以通知为准",
      "fee": "未披露；交通住宿需核实",
      "aid": "未披露",
      "deadline": null,
      "year": 2027,
      "status": "2027官方计划已公布",
      "source_url": "https://example.edu.cn/real-official-notice",
      "source_date": "2026-11-10",
      "checked_at": "2026-11-10",
      "notes": "仅在官方通知确认的情况下新增。"
    }

示例域名仅用于展示格式，**请勿提交虚构 URL**。

## 三、提交前自查

需要 Node 22+：

    node scripts/build.mjs --check
    node scripts/build.mjs
    node --check docs/assets/app.js

确保 JSON 格式有效，官方链接使用 HTTPS、ID 唯一、截止日期为合法 ISO 格式。对项目申请截止时间不确定时宁可使用 null。

Pull Request 建议描述：新增/修改了什么、来自哪些原始公告、哪些内容仍未证实、是否涉及招生资格或收费变化。

## 四、项目更新和历史资料

- 原有项目公布新一届通知后，优先更新同一 ID 的届次与资料时间，并记录变化；当同年存在多个彼此独立的轨道时可新增不同 ID。
- 如果项目永久停办，应保留历史证据并标记“停止 / 历史”，而非直接抹去。
- “2026开始报名”不能直接被程序推算为“2027同月报名”。
- 尽量提交**官方原始政策/招生公告**，而不是代发或搜索引擎摘要。
- 本站没有登录注册，不接收申请者的个人资料和未成年人敏感信息。

## 五、网页与自动化

网页位于 docs/index.html、docs/assets/ 下，采用语义化 HTML、现代 CSS 和原生 JavaScript，无 npm 生产依赖。

docs/data/catalog.json 是构建产物。向 main 分支提交后，GitHub Actions 校验数据、生成索引并部署 GitHub Pages。如 Pages 未首次启用，仓库管理员需要在 Settings → Pages 将 Source 设为 GitHub Actions。

欢迎改善响应式体验、可访问性、数据质量验证和低成本机会筛选；大型 UI 更改建议先开 Issue 讨论。

## English summary

Submit source-linked corrections and new high-school research opportunities through Issues or PRs. **Evidence first**, preserve year-specific restrictions, keep original sources, protect minors' privacy, and distinguish real mentored/lab research from short exposure visits and early university admissions. Run the Node validation script before submitting.
