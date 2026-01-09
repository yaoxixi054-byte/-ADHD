
import { Scale } from './types';

export const SCALES: Scale[] = [
  {
    id: 'asrs5',
    name: 'ASRS-5 (核心症状筛查)',
    description: 'DSM-5 标准转换器。评估注意力障碍及多动/冲动核心表现。计分：0-24。',
    threshold: 14,
    scoringType: 'sum',
    options: [
      { label: '从不', value: 0 },
      { label: '很少', value: 1 },
      { label: '有时', value: 2 },
      { label: '经常', value: 3 },
      { label: '非常经常', value: 4 }
    ],
    questions: [
      { id: 1, text: '当一项任务中最具挑战性的部分完成后，你是否经常在处理收尾细节时感到困难？' },
      { id: 2, text: '当你需要处理需要组织规划、条理清晰的任务时，你是否感到难以应付或把事情做得井井有条？' },
      { id: 3, text: '你是否经常忘记约会或必须要履行的义务（如缴费、回电）？' },
      { id: 4, text: '当你有一项需要大量脑力劳动的任务时，你是否经常回避、推迟或拖延开始？' },
      { id: 5, text: '当需要长时间坐着时，你是否经常感到手脚不停地扭动或在座位上坐立不安？' },
      { id: 6, text: '你是否经常感到过度活跃，不得不做点什么，就像“被马达驱动着”一样停不下来？' }
    ]
  },
  {
    id: 'wfirs_s',
    name: 'WFIRS-S (生活功能损害评估)',
    description: 'Weiss 功能障碍评定量表。通过 7 大维度测量症状对现实生活的破坏力。阈值：均分 >= 1.5。',
    scoringType: 'mean',
    options: [
      { label: '从不/没有', value: 0 },
      { label: '有时/有些', value: 1 },
      { label: '经常/很多', value: 2 },
      { label: '非常经常/非常多', value: 3 },
      { label: '不适用', value: -1 }
    ],
    questions: [
      // 家庭维度
      { id: 1, text: '损害了你与家人之间的关系', domain: '家庭' },
      { id: 2, text: '导致你与配偶/伴侣的关系出现紧张或冲突', domain: '家庭' },
      { id: 3, text: '导致你不得不依赖他人帮你处理你应该完成的事务', domain: '家庭' },
      { id: 4, text: '引起家庭内部的争吵或矛盾', domain: '家庭' },
      { id: 8, text: '在家人面前难以控制自己的情绪或突然失控', domain: '家庭' },
      // 工作维度
      { id: 11, text: '难以履行应尽的工作职责', domain: '工作' },
      { id: 12, text: '工作效率低下，难以在规定时间内保质保量完成任务', domain: '工作' },
      { id: 13, text: '与上司或领导之间存在沟通障碍或冲突', domain: '工作' },
      { id: 14, text: '难以维持一份稳定的工作（频繁离职或被动离职）', domain: '工作' },
      { id: 18, text: '上班或开会经常迟到，存在“时间盲区”', domain: '工作' },
      // 学校维度 (仅学生可见)
      { id: 21, text: '课堂记笔记困难，容易漏掉重点', domain: '学校' },
      { id: 22, text: '难以按时完成作业、课题或项目任务', domain: '学校' },
      { id: 26, text: '由于学分或表现不足，面临留校察看、挂科或劝退风险', domain: '学校' },
      { id: 28, text: '上学迟到、旷课或出勤率不稳定', domain: '学校' },
      // 生活技能维度
      { id: 31, text: '过度或不当地使用互联网、电子游戏或电视，难以停下', domain: '生活技能' },
      { id: 33, text: '准备出门时存在困难，总是忙乱且无法准时', domain: '生活技能' },
      { id: 34, text: '就寝困难（报复性熬夜，深夜难以关闭大脑）', domain: '生活技能' },
      { id: 37, text: '长期受失眠、入睡困难或睡眠质量差困扰', domain: '生活技能' },
      { id: 42, text: '财务管理困难（如：冲动消费、忘记支付账单、收支失衡）', domain: '生活技能' },
      // 自我概念维度
      { id: 43, text: '对自己评价极低，时常感觉自己很“糟糕”', domain: '自我概念' },
      { id: 44, text: '因无法达到预期而感到挫败、沮丧或焦虑', domain: '自我概念' },
      { id: 47, text: '感到自己无能或缺乏掌控生活的能力', domain: '自我概念' },
      // 社交维度
      { id: 51, text: '难以与他人协作完成任务', domain: '社交' },
      { id: 52, text: '难以与他人建立或维持融洽的人际关系', domain: '社交' },
      { id: 57, text: '由于疏于联系或沟通不当，难以维持长期的友谊', domain: '社交' },
      // 风险行为维度
      { id: 61, text: '驾驶时表现出攻击性（路怒、超速）', domain: '风险' },
      { id: 62, text: '驾驶时做其他分心的事情（看手机、吃东西）', domain: '风险' },
      { id: 65, text: '卷入警察调查、法律纠纷或出现违法违规行为', domain: '风险' },
      { id: 69, text: '存在饮酒过量、抽烟上瘾或滥用处方药/非法药物的情况', domain: '风险' }
    ]
  },
  {
    id: 'bdefs_sf',
    name: 'BDEFS-SF (执行功能缺陷测评)',
    description: '巴克利执行功能简版量表。评估前额叶调节行为、规划未来和情绪的能力。计分：1-4。',
    scoringType: 'sum',
    options: [
      { label: '从不/很少', value: 1 },
      { label: '有时', value: 2 },
      { label: '经常', value: 3 },
      { label: '非常经常', value: 4 }
    ],
    questions: [
      { id: 1, text: '习惯性地把事情拖延到最后一刻才着手处理', domain: '时间管理' },
      { id: 2, text: '无法在大脑中记住需要做的事情（工作记忆极差，像“便签纸”随写随丢）', domain: '自组织' },
      { id: 3, text: '缺乏动力为已知必须要做的事情提前做好准备', domain: '自驱动' },
      { id: 4, text: '“知行分离”，即无法做到自己告诉自己要做的事', domain: '自驱动' },
      { id: 9, text: '无法抑制对他人的冲动反应，就像“刹车失灵”一样（自我约束差）', domain: '自我约束' },
      { id: 10, text: '在交谈中会说出不合时宜、具有冲击性或让人难堪的评论', domain: '自我约束' },
      { id: 11, text: '做事不考虑后果，甚至无法从过去的错误中汲取教训（后见之明缺乏）', domain: '自我约束' },
      { id: 13, text: '在工作或学习中投入的努力明显少于应该达到的目标', domain: '自驱动' },
      { id: 15, text: '工作或表现的质量极其不稳定，呈现出“好一天坏一天”的波动性', domain: '自驱动' },
      { id: 17, text: '一旦情绪变得烦乱或激动，就极其难以让自己迅速平静下来', domain: '情绪调节' },
      { id: 19, text: '无法将注意力从令人烦恼的事情上移开，陷入强迫性的负面联想', domain: '情绪调节' },
      { id: 20, text: '保持负面情绪或不安的时间比周围人要长得多', domain: '情绪调节' }
    ]
  },
  {
    id: 'aamm',
    name: 'AAMM (成人 ADHD 伪装/掩蔽测评)',
    description: '识别高功能人群的心理代价。捕捉那些“表面成功但内心精疲力竭”的行为。计分：0-4。',
    scoringType: 'sum',
    options: [
      { label: '从不', value: 0 },
      { label: '很少', value: 1 },
      { label: '有时', value: 2 },
      { label: '经常', value: 3 },
      { label: '非常经常', value: 4 }
    ],
    questions: [
      { id: 1, text: '由于意识到自己的健忘或分心，我养成了向他人过度道歉、频繁道歉的习惯。' },
      { id: 2, text: '为了掩饰内心的混乱和能力不足感，我强迫自己追求极度的完美主义。' },
      { id: 3, text: '为了防止迟到，我不得不比规定时间提前一个小时甚至更久到达约会地点。' },
      { id: 4, text: '在社交谈话中，我必须耗费巨大的能量强迫自己集中注意力，导致交流后感觉极度疲惫。' },
      { id: 5, text: '我刻意隐瞒自己在维持工作或学习状态时所付出的巨大痛苦，假装一切都很轻松。' },
      { id: 8, text: '我强迫自己把所有事情都写下来，因为我一旦不记录就会陷入彻底的失控和恐慌。' },
      { id: 10, text: '我通过高强度的工作来弥补白天的分心，即便这意味着我要牺牲几乎所有的休息时间。' }
    ]
  },
  {
    id: 'wurs25',
    name: 'WURS-25 (童年溯源测评)',
    description: '用于回溯 6-12 岁儿童时期的行为模式。这是成人诊断的关键证据。计分：0-4。',
    threshold: 46,
    scoringType: 'sum',
    options: [
      { label: '完全没有', value: 0 },
      { label: '很少', value: 1 },
      { label: '中等', value: 2 },
      { label: '相当多', value: 3 },
      { label: '非常多', value: 4 }
    ],
    questions: [
      { id: 1, text: '（童年）课堂上难以集中注意力，极易分心，思绪飞走。' },
      { id: 2, text: '（童年）经常感到焦虑、担心或担忧。' },
      { id: 3, text: '（童年）感到紧张、坐立不安、无法保持安静。' },
      { id: 5, text: '（童年）脾气极其暴躁，容易被微小的事情激怒，沸点极低。' },
      { id: 6, text: '（童年）频繁发脾气，情绪失控。' },
      { id: 7, text: '（童年）做事缺乏持久性，总是虎头蛇尾，难以坚持到底。' },
      { id: 8, text: '（童年）性格固执、任性，难以接受他人的指令。' },
      { id: 9, text: '（童年）经常感到悲伤、忧郁或不快乐。' },
      { id: 10, text: '（童年）不听父母话，顶嘴，甚至出现反叛行为。' },
      { id: 11, text: '（童年）自我评价极低，缺乏自信。' },
      { id: 12, text: '（童年）表现出易激惹、挑衅的态度。' },
      { id: 15, text: '（童年）做事不经思考，极其冲动，幽默感往往表现为打断他人。' },
      { id: 16, text: '（童年）倾向于表现得不成熟，社交年龄比实际年龄小。' },
      { id: 18, text: '（童年）感到由于冲动而失去了对自己的控制力。' },
      { id: 23, text: '（童年）在校表现总体不佳，被老师评价为“聪明但不用功”。' },
      { id: 24, text: '（童年）在数学或处理数字逻辑方面存在明显困难。' },
      { id: 25, text: '（童年）未能发挥出应有的学习潜力，学业产出与其智力不匹配。' }
    ]
  }
];

export const REFERENCES = [
  { name: "ASRS-5", source: "Kessler, R. C., et al. (2017). WHO Adult ADHD Self-Report Scale (ASRS) for DSM-5." },
  { name: "WFIRS-S", source: "Weiss, M. D. (2000). Weiss Functional Impairment Rating Scale - Self Report." },
  { name: "BDEFS-SF", source: "Barkley, R. A. (2011). Barkley Deficits in Executive Functioning Scale - Short Form." },
  { name: "AAMM", source: "ADHD Adult Masking Measure (2022). Identification of Hidden ADHD in High-Functioning Populations." },
  { name: "WURS-25", source: "Ward, M. F., Wender, P. H., & Reimherr, F. W. (1993). Wender Utah Rating Scale." }
];
