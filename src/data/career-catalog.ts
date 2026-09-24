// 求职指南目录清单
// 定义职业发展知识库的分类与文档元数据。
// - slug 用作 URL 中的唯一标识（URL 安全，不含特殊字符）
// - file 是 public/knowledge/career/<categoryId>/ 下的实际文件名（不含 .md）

export interface CareerDoc {
  /** URL slug（短、URL 安全） */
  slug: string;
  /** 实际文件名（不含 .md），用于 fs 读取 */
  file: string;
  /** 文档标题 */
  title: string;
  /** 排序权重（序号，越小越靠前；无序号文档排最后） */
  order: number | null;
}

export interface CareerCategory {
  /** 分类 id，也是 public/knowledge/career 下的子目录名 */
  id: string;
  /** 分类展示名 */
  label: string;
  /** 分类描述 */
  description: string;
  /** 文档列表，按 order 升序 */
  docs: CareerDoc[];
}

export const CAREER_CATEGORIES: CareerCategory[] = [
  {
    id: "job-strategy",
    label: "求职策略",
    description: "求职前的定位、简历投递、谈薪与 Offer 决策的完整方法论",
    docs: [
      {
        slug: "01-kai-chang",
        file: "01-小册开场篇：求职市场竞争激烈，技术人该如何杀出重围",
        title: "求职市场竞争激烈，技术人该如何杀出重围",
        order: 1,
      },
      {
        slug: "02-ziwo-renzhi",
        file: "02-自我认知篇：作为技术人该如何定位自己在行业内的级别",
        title: "自我认知篇：如何定位自己在行业内的级别",
        order: 2,
      },
      {
        slug: "03-qiuzhi-yixiang",
        file: "03-求职意向篇：怎样定下合理的期望薪资及确定目标公司",
        title: "求职意向篇：怎样定下合理的期望薪资及确定目标公司",
        order: 3,
      },
      {
        slug: "04-jishu-tuji",
        file: "04-技术突击篇：如何根据求职意向进行快速提升与复盘",
        title: "技术突击篇：如何根据求职意向进行快速提升与复盘",
        order: 4,
      },
      {
        slug: "10-qiuzhi-jiyu",
        file: "10-求职机遇篇：你可以通过哪些方式与渠道获取面试机会",
        title: "求职机遇篇：获取面试机会的渠道",
        order: 10,
      },
      {
        slug: "11-jianli-toudi",
        file: "11-简历投递篇：那些你未曾关注过却很实用的简历投递技巧",
        title: "简历投递篇：实用的简历投递技巧",
        order: 11,
      },
      {
        slug: "12-mianshi-qian-guize",
        file: "12-了解面试潜规则，从海选中脱颖而出",
        title: "了解面试潜规则，从海选中脱颖而出",
        order: 12,
      },
      {
        slug: "13-sheji-jianli",
        file: "13-设计一份吸引面试官的简历",
        title: "设计一份吸引面试官的简历",
        order: 13,
      },
      {
        slug: "14-du-dong-jd",
        file: "14-读懂职位-JD，精准投递简历",
        title: "读懂职位 JD，精准投递简历",
        order: 14,
      },
      {
        slug: "15-toudi-huangjin-shiduan",
        file: "15-把握投递简历的黄金时间段",
        title: "把握投递简历的黄金时间段",
        order: 15,
      },
      {
        slug: "16-renqing-shili",
        file: "16-认清自身实力，明确求职方向",
        title: "认清自身实力，明确求职方向",
        order: 16,
      },
      {
        slug: "17-panduan-gongsi",
        file: "17-判断公司背景，做出合理选择",
        title: "判断公司背景，做出合理选择",
        order: 17,
      },
      {
        slug: "18-xingye-xinzi",
        file: "18-了解行业薪资，清晰找准定位",
        title: "了解行业薪资，清晰找准定位",
        order: 18,
      },
      {
        slug: "19-gongzuo-jiaojie",
        file: "19-工作交接流程与福利衔接",
        title: "工作交接流程与福利衔接",
        order: 19,
      },
      {
        slug: "huode-xinyi-offer",
        file: "获得心仪Offer",
        title: "如何获得心仪的 Offer？",
        order: null,
      },
    ],
  },
  {
    id: "resume",
    label: "简历优化",
    description: "从 HR 视角理解简历筛选逻辑，打造高质量技术简历",
    docs: [
      {
        slug: "05-dongxi-renshi",
        file: "05-洞悉人事篇：HR是如何在成百上千份简历中挑选候选者的",
        title: "洞悉人事篇：HR 如何在成百上千份简历中挑选候选者",
        order: 5,
      },
      {
        slug: "06-jianli-zhuanxie",
        file: "06-简历优化篇（上）：怎样撰写一份与自身情况最匹配的简历",
        title: "简历优化篇（上）：怎样撰写一份与自身情况最匹配的简历",
        order: 6,
      },
      {
        slug: "07-jianli-meihua",
        file: "07-简历优化篇（下）：如何美化专业技能与打造项目技术亮点",
        title: "简历优化篇（下）：如何美化专业技能与打造项目技术亮点",
        order: 7,
      },
    ],
  },
  {
    id: "interview-skills",
    label: "面试技巧",
    description: "自我介绍、面试流程、谈薪到复盘，掌握技术面试全流程技巧",
    docs: [
      {
        slug: "08-ziwo-jieshao",
        file: "08-自我练习篇：自我介绍、项目介绍该怎么说面试官才会听",
        title: "自我练习篇：自我介绍、项目介绍该怎么说",
        order: 8,
      },
      {
        slug: "09-mianshi-zhunbei",
        file: "09-面试准备篇：作为一位优秀的将军从不打无准备之仗",
        title: "面试准备篇：作为优秀的将军从不打无准备之仗",
        order: 9,
      },
      {
        slug: "12-zhi-jizhi-bi",
        file: "12-知己知彼篇：负责面试你的面试官究竟是什么角色",
        title: "知己知彼篇：负责面试你的面试官是什么角色",
        order: 12,
      },
      {
        slug: "13-mianshi-liucheng",
        file: "13-面试流程篇：不同企业的面试流程到底是怎么样的",
        title: "面试流程篇：不同企业的面试流程",
        order: 13,
      },
      {
        slug: "14-mianshi-jiqiao-shang",
        file: "14-面试技巧篇（上）：留下好印象的面试技巧和要避开的忌讳",
        title: "面试技巧篇（上）：留下好印象的技巧和避开的忌讳",
        order: 14,
      },
      {
        slug: "15-mianshi-jiqiao-xia",
        file: "15-面试技巧篇（下）：如何主导面试节奏和有技巧地提问面试官",
        title: "面试技巧篇（下）：主导面试节奏和提问技巧",
        order: 15,
      },
      {
        slug: "16-duixian-renshi",
        file: "16-对线人事篇：面对HR的百般刁难该如何从容谈薪",
        title: "对线人事篇：面对 HR 的百般刁难该如何从容谈薪",
        order: 16,
      },
      {
        slug: "17-mianshi-fupan",
        file: "17-面试复盘篇：胜不骄败不馁，面试后造就更好的自己",
        title: "面试复盘篇：胜不骄败不馁，面试后造就更好的自己",
        order: 17,
      },
      {
        slug: "18-zuohao-zhunbei",
        file: "18-做好充分的准备去面试",
        title: "做好充分的准备去面试",
        order: 18,
      },
      {
        slug: "19-bawo-guanjian-dian",
        file: "19-把握面试时的关键点",
        title: "把握面试时的关键点",
        order: 19,
      },
      {
        slug: "20-buzhuo-wei-biaoqing",
        file: "20-捕捉-HR-微表情，做出应对策略",
        title: "捕捉 HR 微表情，做出应对策略",
        order: 20,
      },
      {
        slug: "21-qiaomiao-tuixiao",
        file: "21-巧妙推销自己的-3-个技巧",
        title: "巧妙推销自己的 3 个技巧",
        order: 21,
      },
      {
        slug: "22-mubiao-mingque",
        file: "22-目标明确，阐明沟通",
        title: "目标明确，阐明沟通",
        order: 22,
      },
    ],
  },
  {
    id: "soft-skills",
    label: "软技能",
    description: "以结果为导向、验收标准、持续集成等高效工作方法",
    docs: [
      {
        slug: "1-jieguo-daoxiang",
        file: "1-如何让努力不白费-以结果为导向",
        title: "如何让努力不白费：以结果为导向",
        order: 1,
      },
      {
        slug: "2-dod",
        file: "2-DoD--做任何事之前，先定义完成的标准",
        title: "DoD：做任何事之前，先定义完成的标准",
        order: 2,
      },
      {
        slug: "3-yanshou-biaozhun",
        file: "3-接到需求任务-先定好验收标准",
        title: "接到需求任务，先定好验收标准",
        order: 3,
      },
      {
        slug: "4-chixu-jicheng",
        file: "4-持续集成",
        title: "持续集成",
        order: 4,
      },
      {
        slug: "zhichang-qingshang",
        file: "职场情商课",
        title: "职场情商课",
        order: null,
      },
      {
        slug: "ruan-ji-neng",
        file: "软技能",
        title: "软技能：程序员需要什么样的情商",
        order: null,
      },
    ],
  },
  {
    id: "career-competitiveness",
    label: "职场竞争力",
    description: "提升职场竞争力的多维能力：思维、方法与人际",
    docs: [
      { slug: "00-zhichangshiyichangduoweidudejingzheng", file: "00-职场是一场多维度的竞争", title: "职场是一场多维度的竞争", order: 0 },
      { slug: "01-liuchengyishiruhechengweishanyongliuchengdegaoshou", file: "01-流程意识-：如何成为善用流程的高手？", title: "流程意识-：如何成为善用流程的高手？", order: 1 },
      { slug: "02-shujuzhishangruheyongshujuzengqiangnidezhichangshuofuli", file: "02-数据至上-：如何用数据增强你的职场说服力", title: "数据至上-：如何用数据增强你的职场说服力", order: 2 },
      { slug: "03-fupanjiqiaoshendufupandesangebuzhou", file: "03-复盘技巧-：深度复盘的三个步骤", title: "复盘技巧-：深度复盘的三个步骤", order: 3 },
      { slug: "04-chaijiefangfaruhepojiegongzuonantiwucongxiashoudeganga", file: "04-拆解方法-：如何破解工作难题无从下手的尴尬", title: "拆解方法-：如何破解工作难题无从下手的尴尬", order: 4 },
      { slug: "05-youxiansiweishouzhongbaijianshiruhepinggushiqingdeyouxianji", file: "05-优先思维：手中百件事，如何评估事情的优先级？", title: "优先思维：手中百件事，如何评估事情的优先级？", order: 5 },
      { slug: "06-yuyanbiaodajiaoniqingxibiaodagaoxiaogoutong", file: "06-语言表达：教你清晰表达，高效沟通", title: "语言表达：教你清晰表达，高效沟通", order: 6 },
      { slug: "07-shumianbiaodarangzhoubaohuibaojiyaochengweinidezhichangbishaji", file: "07-书面表达：让周报、汇报、纪要成为你的职场必杀技", title: "书面表达：让周报、汇报、纪要成为你的职场必杀技", order: 7 },
      { slug: "08-zhichangxuexibuyaorangchilaobendexintaihuileziji", file: "08-职场学习：不要让吃老本的心态毁了自己", title: "职场学习：不要让吃老本的心态毁了自己", order: 8 },
      { slug: "09-gongzuojinengruhebimianzijichengweiyigezhichangluosiding", file: "09-工作技能：如何避免自己成为一个职场螺丝钉？", title: "工作技能：如何避免自己成为一个职场螺丝钉？", order: 9 },
      { slug: "10-hangyeshiyeweishanidelingdaojiushibinilihai", file: "10-行业视野：为啥你的领导就是比你厉害？", title: "行业视野：为啥你的领导就是比你厉害？", order: 10 },
      { slug: "11-shangyesiweinaxieyewuyibashouxiangdedoushisha", file: "11-商业思维：那些业务一把手想的都是啥？", title: "商业思维：那些业务一把手想的都是啥？", order: 11 },
      { slug: "12-guanxijianlishenmeyangderenjiguanxicaishiduigongzuoyoujiazhide", file: "12-关系建立：什么样的人际关系才是对工作有价值的？", title: "关系建立：什么样的人际关系才是对工作有价值的？", order: 12 },
      { slug: "13-guanxijingyingruherangbierenzaiguanjianshikezhichini", file: "13-关系经营：如何让别人在关键时刻支持你？", title: "关系经营：如何让别人在关键时刻支持你？", order: 13 },
      { slug: "14-goutongshuofuruhegoutongcainengrangbierenzhenxinshiyidibangni", file: "14-沟通说服：如何沟通才能让别人真心实意地帮你？", title: "沟通说服：如何沟通才能让别人真心实意地帮你？", order: 14 },
      { slug: "15-rangjinshengzaigerenxiuxingzhongziranwancheng", file: "15-让晋升在个人修行中自然完成", title: "让晋升在个人修行中自然完成", order: 15 },
    ],
  },
  {
    id: "tech-leadership",
    label: "技术管理",
    description: "从工程师到管理者：带团队的方法论与实践",
    docs: [
      { slug: "00-zaiguanliyishuzhongxunzhaoquedingxingdegongchengluoji", file: "00-在管理艺术中寻找确定性的“工程逻辑”", title: "在管理艺术中寻找确定性的“工程逻辑”", order: 0 },
      { slug: "01-wendingxingcongshiguyingduidaokeyongxingzhili", file: "01-稳定性：从事故应对到可用性治理", title: "稳定性：从事故应对到可用性治理", order: 1 },
      { slug: "04-jishuzhaiwuruhedailingtuanduicongkunjingzhongtuweierchu", file: "04-技术债务：如何带领团队从困境中突围而出？", title: "技术债务：如何带领团队从困境中突围而出？", order: 4 },
      { slug: "05-daxiangmubawoguanjiandianmoudingerhoudong", file: "05-大项目：把握关键点，谋定而后动", title: "大项目：把握关键点，谋定而后动", order: 5 },
      { slug: "06-yewulijieshenruyewushizuohaojiagoudeqianti", file: "06-业务理解：深入业务是做好架构的前提", title: "业务理解：深入业务是做好架构的前提", order: 6 },
      { slug: "07-jiagoushejizhilihaoxitongfuzaducaizuiwushi", file: "07-架构设计：治理好系统复杂度才最务实", title: "架构设计：治理好系统复杂度才最务实", order: 7 },
      { slug: "08-dingmubiaorangnidefangxiangyugongsidefangxiangbaochiyizhi", file: "08-定目标：让你的方向与公司的方向保持一致", title: "定目标：让你的方向与公司的方向保持一致", order: 8 },
      { slug: "09-zhuiguochengruheyongpdcazuoguochengguanli", file: "09-追过程：如何用-PDCA-做过程管理？", title: "追过程：如何用-PDCA-做过程管理？", order: 9 },
      { slug: "10-jiangyoufaliezenyangchuandiwomenyaoshenmeyubuyaoshenme", file: "10-奖优罚劣：怎样传递我们要什么与“不要什么”？", title: "奖优罚劣：怎样传递我们要什么与“不要什么”？", order: 10 },
      { slug: "11-qingoutongzaixinrendejichushangranggoutongjiandanqiechuncui", file: "11-勤沟通：在信任的基础上，让沟通简单且纯粹", title: "勤沟通：在信任的基础上，让沟通简单且纯粹", order: 11 },
      { slug: "12-jianjizhiguizeliuchengyuejianyueduoweihexiaoguoqueyuelaiyuecha", file: "12-建机制：规则流程越建越多，为何效果却越来越差？", title: "建机制：规则流程越建越多，为何效果却越来越差？", order: 12 },
      { slug: "13-zhirenshanyongjieshixiurenjierenchengshi", file: "13-知人善用：借事修人，借人成事", title: "知人善用：借事修人，借人成事", order: 13 },
      { slug: "14-zhaodaorenzhaopinshileaderdezerenbushihrde", file: "14-找到人：招聘是-Leader-的责任，不是-HR-的", title: "找到人：招聘是-Leader-的责任，不是-HR-的", order: 14 },
      { slug: "15-nengluodi90tianshiyongqizhuanzhengshiwomenyaokaochashenme", file: "15-能落地：90-天试用期，转正时我们要考察什么？", title: "能落地：90-天试用期，转正时我们要考察什么？", order: 15 },
      { slug: "16-shengjitaihuanxinyaocidaoyaokuai", file: "16-升级汰换：“心要慈，刀要快”", title: "升级汰换：“心要慈，刀要快”", order: 16 },
      { slug: "17-jinshengshibushijishudaoweixiangmuzuohaojiugoule", file: "17-晋升：是不是技术到位、项目做好就够了？", title: "晋升：是不是技术到位、项目做好就够了？", order: 17 },
      { slug: "18-kuatuanduimeiyouhuibaoxianderenheshijiushituibudong", file: "18-跨团队：没有汇报线的人和事就是推不动？", title: "跨团队：没有汇报线的人和事就是推不动？", order: 18 },
      { slug: "19-zuoguihuachulejiaofuhewendingxinghaiyaoguihuashenme", file: "19-做规划：除了交付和稳定性，还要规划什么？", title: "做规划：除了交付和稳定性，还要规划什么？", order: 19 },
      { slug: "20-jieshouxintuanduishiqidijiaofuchishiguduofaruhexiashoujiejue", file: "20-接手新团队：士气低、交付迟、事故多发，如何下手解决？", title: "接手新团队：士气低、交付迟、事故多发，如何下手解决？", order: 20 },
      { slug: "21-suiyuejinghaojishurenyiranyaofuzhongqianxing", file: "21-岁月静好，技术人依然要负重前行", title: "岁月静好，技术人依然要负重前行", order: 21 },
    ],
  },
  {
    id: "career-planning",
    label: "职业规划",
    description: "职业规划、跳槽涨薪与个人成长",
    docs: [
      { slug: "1-chengxuyuankunjingjijiejuebanfa", file: "1-程序员困境及解决办法", title: "程序员困境及解决办法", order: 1 },
      { slug: "18-ruzhijuezepianzenyangzaiduofenofferzhongtiaoxuanzuishihezijideruzhi", file: "18-入职抉择篇：怎样在多份Offer中挑选最适合自己的入职", title: "入职抉择篇：怎样在多份Offer中挑选最适合自己的入职", order: 18 },
      { slug: "19-gongzuoshigangpianxinrenruhekuaisurongruhuanjingyuanwenduguoshiyongqi", file: "19-工作试岗篇：“新人”如何快速融入环境与安稳度过试用期", title: "工作试岗篇：“新人”如何快速融入环境与安稳度过试用期", order: 19 },
      { slug: "20-jinjietishengpianyigejishurengairuhezuohaozijiweilaidezhiyeguihua", file: "20-进阶提升篇：一个技术人该如何做好自己未来的职业规划", title: "进阶提升篇：一个技术人该如何做好自己未来的职业规划", order: 20 },
      { slug: "21-jishuguanlipianshangshenweijishurengaizenyangdaihaotuanduibingzuohaoguanlizhe", file: "21-技术管理篇（上）：身为技术人该怎样带好团队并做好管理者", title: "技术管理篇（上）：身为技术人该怎样带好团队并做好管理者", order: 21 },
      { slug: "22-jishuguanlipianxiaguanlishidetongyongjiqiaojiruhezuohaoxiangshangguanli", file: "22-技术管理篇（下）：管理时的通用技巧及如何做好向上管理", title: "技术管理篇（下）：管理时的通用技巧及如何做好向上管理", order: 22 },
      { slug: "23-tiaocaozhangxinpiangairuheyouyacongrongdixianglingdaotichuzhangxinyulizhi", file: "23-跳槽涨薪篇：该如何优雅从容地向领导提出涨薪与离职", title: "跳槽涨薪篇：该如何优雅从容地向领导提出涨薪与离职", order: 23 },
      { slug: "24-fuyejianzhipianjishurenkeyitongguonaxietujingshixianshuihoushouru", file: "24-副业兼职篇：技术人可以通过哪些途径实现“睡后收入”", title: "副业兼职篇：技术人可以通过哪些途径实现“睡后收入”", order: 24 },
      { slug: "25-fangpianzhinanpianxishuonaxielingrenxindongdanchongmanxianjingdefuyedakeng", file: "25-防骗指南篇：细说那些令人心动但充满陷阱的副业大坑", title: "防骗指南篇：细说那些令人心动但充满陷阱的副业大坑", order: 25 },
      { slug: "26-fenshouxiehoupianyixieguanyuzijiderenshengganwujifenshougaobieyu", file: "26-分手邂逅篇：一些关于自己的人生感悟及“分手”告别语", title: "分手邂逅篇：一些关于自己的人生感悟及“分手”告别语", order: 26 },
      { slug: "qianduanzhiyeguihua", file: "前端职业规划", title: "前端职业规划", order: null },
      { slug: "qianduanzhiyeguihuagaoshoujinjie", file: "前端职业规划(高手进阶)", title: "前端职业规划(高手进阶)", order: null },
      { slug: "jianli", file: "简历", title: "简历", order: null },
    ],
  },
];

/** 按 id 查找分类 */
export function getCareerCategory(id: string): CareerCategory | undefined {
  return CAREER_CATEGORIES.find((c) => c.id === id);
}

/** 在指定分类下按 slug 查找文档 */
export function getCareerDoc(categoryId: string, slug: string): CareerDoc | undefined {
  const cat = getCareerCategory(categoryId);
  return cat?.docs.find((d) => d.slug === slug);
}
