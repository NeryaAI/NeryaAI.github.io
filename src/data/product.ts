export type LocalizedText = { zh: string; en: string };

export type ProductFeature = {
  id: 'strategy' | 'team' | 'evolution' | 'vault';
  title: LocalizedText;
  description: LocalizedText;
  steps: [LocalizedText, LocalizedText, LocalizedText];
  cta: LocalizedText;
  /** Internal demo route. Link as /demo/#${route}. */
  route: string;
  detail?: LocalizedText;
};

// Copy and implementation boundaries: docs/astro-product-facts-20260926.md.
// The lead may adjust the hero without changing the feature contract.
export const hero = {
  title: {
    zh: 'Quant Super Agent',
    en: 'Quant Super Agent',
  },
  description: {
    zh: '研究行情、写策略、跑回测',
    en: 'Research markets, build strategies, run backtests',
  },
  evolution: {
    zh: '以 Recursive Self-Improvement 持续迭代策略',
    en: 'Iterate with Recursive Self-Improvement',
  },
  cta: { zh: '查看策略示例', en: 'Explore a strategy example' },
  route: '/chat/demo-strategy',
};

export const features: ProductFeature[] = [
  {
    id: 'strategy',
    title: { zh: '从想法到第一版策略', en: 'From idea to version one' },
    description: {
      zh: 'Super Agent 把买卖逻辑拆成规则、参数和回测。',
      en: 'The Super Agent turns trading logic into rules, parameters and a backtest.',
    },
    steps: [
      { zh: '接住想法', en: 'Take the idea' },
      { zh: '拆成任务', en: 'Split the work' },
      { zh: '跑出第一版', en: 'Run a first version' },
    ],
    cta: { zh: '体验策略创建', en: 'Explore strategy creation' },
    route: '/chat/demo-strategy',
    detail: {
      zh: '草稿保留参数和逻辑说明。启用前需完成验证与审核。',
      en: 'Drafts include parameters and logic notes. Validate and approve the candidate before activation.',
    },
  },
  {
    id: 'team',
    title: { zh: 'Super Agent，调度量化团队', en: 'Super Agent, quant team' },
    description: {
      zh: '研究员、因子分析师与审阅员并行投研。',
      en: 'Researchers, factor analysts and reviewers work in parallel.',
    },
    steps: [
      { zh: '分派工作', en: 'Assign the work' },
      { zh: '并行研究', en: 'Research in parallel' },
      { zh: '汇总研究', en: 'Combine findings' },
    ],
    cta: { zh: '查看 Agent 团队', en: 'Explore the Agent team' },
    route: '/agents',
    detail: {
      zh: '团队按任务依赖推进。缺少必需任务或证据时，运行会标记为受阻。',
      en: 'Team members follow task dependencies. Missing required work or evidence leaves the run blocked.',
    },
  },
  {
    id: 'evolution',
    title: { zh: '策略进入下一版', en: 'The strategy enters its next version' },
    description: {
      zh: '它读运行结果，找到薄弱处，提出修改。',
      en: 'It reads the run, finds the weak spot and proposes a change.',
    },
    steps: [
      { zh: '回看结果', en: 'Read the result' },
      { zh: '找出问题', en: 'Find the weak spot' },
      { zh: '准备下一版', en: 'Prepare the next version' },
    ],
    cta: { zh: '查看复盘与提案', en: 'Explore reviews and proposals' },
    route: '/self-evolution',
    detail: {
      zh: '策略代码更新需要审核。可选自动应用仅覆盖通过验证的限定提示词与配置改动。',
      en: 'Strategy code updates require approval. Optional auto-apply covers validated prompt and configuration edits within a fixed allowlist.',
    },
  },
  {
    id: 'vault',
    title: { zh: 'API 密钥，交给 Vault 保管', en: 'Keep your API keys in Vault' },
    description: {
      zh: '交易所和数据服务的密钥集中存放，连接时按需调用。',
      en: 'Store exchange and data-service keys together, ready for your connections.',
    },
    steps: [
      { zh: '添加密钥', en: 'Add a key' },
      { zh: '本地保存', en: 'Store locally' },
      { zh: '按需调用', en: 'Use when needed' },
    ],
    cta: { zh: '打开 Vault', en: 'Open Vault' },
    route: '/env-vault',
    detail: {
      zh: '凭据保存在本地 Vault，连接配置通过 vault:// 引用使用。',
      en: 'Credentials stay in the local Vault; connection settings use vault:// references.',
    },
  },
];

// Secondary content: research categories do not imply equal execution support.
export const markets = [
  {
    id: 'crypto',
    title: { zh: '加密货币', en: 'Crypto' },
    description: { zh: '看看价格和链上信号', en: 'Look at price action and on-chain signals' },
    route: '/strategies?strategy_id=btc_trend_guard',
  },
  {
    id: 'prediction',
    title: { zh: '预测市场', en: 'Prediction markets' },
    description: { zh: '比较事件概率和结算规则', en: 'Compare event probabilities and resolution rules' },
    route: '/strategies?strategy_id=event_probability',
  },
  {
    id: 'futures',
    title: { zh: '期货', en: 'Futures' },
    description: { zh: '看看期限结构和换月条件', en: 'Look at term structure and contract rolls' },
    route: '/strategies?strategy_id=futures_term_structure',
  },
  {
    id: 'equities',
    title: { zh: '海外美股', en: 'US equities' },
    description: { zh: '看看因子和组合轮动', en: 'Look at factors and portfolio rotation' },
    route: '/strategies?strategy_id=us_equity_factor_rotation',
  },
];

export const connectorAuthoring = {
  title: { zh: '先把想接什么说清楚', en: 'Start by saying what you need' },
  description: {
    zh: '告诉 Agent 目标平台和数据需求。它会看看现有连接器，再整理下一步。',
    en: 'Tell the Agent the platform and data you need. It checks the existing connectors and maps the next step.',
  },
  detail: {
    zh: '新增适配代码需要验证与审核。接口文档和接入提案不能证明连接已可用。',
    en: 'New adapter code needs validation and approval. API documentation and a proposal do not establish a working connection.',
  },
  cta: { zh: '在对话中提出需求', en: 'Describe an integration in chat' },
  route: '/chat/demo-strategy',
};
