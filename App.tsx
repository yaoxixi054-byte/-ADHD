
import React, { useState, useCallback, useMemo } from 'react';
import { 
  Gender, 
  UserProfile, 
  AppState, 
  AssessmentResults 
} from './types';
import { SCALES, REFERENCES } from './constants';
import { generateSummary } from './geminiService';
import { 
  User, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  AlertCircle, 
  BrainCircuit,
  Loader2,
  CheckCircle2,
  BarChart3,
  BookOpen,
  Info,
  Radar,
  ShieldAlert,
  Share2,
  Copy,
  RefreshCcw,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar as ReRadar 
} from 'recharts';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.START);
  const [profile, setProfile] = useState<UserProfile>({ age: 25, gender: Gender.MALE, isStudent: false });
  const [currentScaleIdx, setCurrentScaleIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<number, number>>>({});
  const [summary, setSummary] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<boolean>(false);
  const [wantsAi, setWantsAi] = useState<boolean>(true);

  const activeScales = useMemo(() => SCALES, []);
  const currentScale = activeScales[currentScaleIdx];

  const currentQuestions = useMemo(() => {
    return currentScale.questions.filter(q => {
      if (currentScale.id === 'wfirs_s' && q.domain === '学校' && !profile.isStudent) return false;
      return true;
    });
  }, [currentScale, profile.isStudent]);

  const handleAnswerChange = (scaleId: string, qId: number, val: number) => {
    setAnswers(prev => ({
      ...prev,
      [scaleId]: { ...(prev[scaleId] || {}), [qId]: val }
    }));
  };

  const isCurrentScaleComplete = useMemo(() => {
    const scaleAnswers = answers[currentScale.id] || {};
    return currentQuestions.every(q => scaleAnswers[q.id] !== undefined);
  }, [answers, currentScale.id, currentQuestions]);

  const calculateFullResults = useCallback((): AssessmentResults => {
    const scores: Record<string, number> = {};
    const domainMeans: Record<string, Record<string, number>> = {};

    activeScales.forEach(scale => {
      const scaleAnswers = answers[scale.id] || {};
      const validAnswers = (Object.values(scaleAnswers) as number[]).filter(v => v !== -1);
      
      if (scale.scoringType === 'mean') {
        const sum = validAnswers.reduce((a, b) => a + b, 0);
        scores[scale.id] = validAnswers.length > 0 ? sum / validAnswers.length : 0;
        
        const domains: Record<string, { sum: number; count: number }> = {};
        scale.questions.forEach(q => {
          const val = scaleAnswers[q.id];
          if (q.domain && val !== undefined && val !== -1) {
            if (!domains[q.domain]) domains[q.domain] = { sum: 0, count: 0 };
            domains[q.domain].sum += val;
            domains[q.domain].count += 1;
          }
        });
        domainMeans[scale.id] = {};
        Object.entries(domains).forEach(([d, stats]) => {
          domainMeans[scale.id][d] = stats.count > 0 ? stats.sum / stats.count : 0;
        });
      } else {
        scores[scale.id] = validAnswers.reduce((a, b) => a + b, 0);
      }
    });

    return { profile, scores, domainMeans, answers };
  }, [activeScales, answers, profile]);

  const fetchAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiError(false);
    const results = calculateFullResults();
    try {
      const summaryText = await generateSummary(results);
      if (summaryText.includes("分析服务暂时不可用")) {
        setAiError(true);
      }
      setSummary(summaryText);
    } catch (e) {
      setAiError(true);
      setSummary("AI 专家系统响应异常。请参考下方的临床原始数据判读。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const finalizeResults = () => {
    if (wantsAi) {
      setState(AppState.ANALYZING);
      fetchAIAnalysis();
    }
    setState(AppState.RESULT);
  };

  const handleNext = () => {
    if (currentScaleIdx < activeScales.length - 1) {
      setCurrentScaleIdx(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      finalizeResults();
    }
  };

  const copyAppUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('测试网站链接已复制！您可以直接发给朋友或在社交媒体分享。');
  };

  const copyReportToClipboard = () => {
    const results = calculateFullResults();
    const reportText = `
【成人 ADHD 深度解析摘要】
测试编号: #${Math.floor(Math.random() * 89999 + 10000)}
年龄: ${profile.age} | 性别: ${profile.gender === Gender.MALE ? '男' : '女'}

核心临床数据:
- ASRS-5 (核心症状): ${results.scores.asrs5} / 24 ${results.scores.asrs5 >= 14 ? '(高风险)' : '(低风险)'}
- WURS-25 (童年溯源): ${results.scores.wurs25} / 100 ${results.scores.wurs25 >= 46 ? '(病史明确)' : '(关联度低)'}
- AAMM (掩蔽消耗): ${results.scores.aamm} 分

功能受损(均分>1.5):
${Object.entries(results.domainMeans['wfirs_s'] || {})
  .filter(([_, val]) => (val as number) >= 1.5)
  .map(([name, val]) => `- ${name}: ${(val as number).toFixed(2)}`)
  .join('\n')}

测试网址: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(reportText);
    alert('报告摘要已复制！');
  };

  const wfirsRadarData = useMemo(() => {
    if (state !== AppState.RESULT) return [];
    const results = calculateFullResults();
    const means = results.domainMeans['wfirs_s'] || {};
    return Object.entries(means).map(([name, value]) => ({ 
      name, 
      value: parseFloat((value as number).toFixed(2)), 
      full: 3 
    }));
  }, [state, calculateFullResults]);

  const redFlags = useMemo(() => {
    if (state !== AppState.RESULT) return [];
    const wfirsAnswers = answers['wfirs_s'] || {};
    const scale = SCALES.find(s => s.id === 'wfirs_s');
    return scale?.questions
      .filter(q => wfirsAnswers[q.id] === 3)
      .map(q => q.text) || [];
  }, [state, answers]);

  if (state === AppState.START) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-slate-50 p-6">
        <div className="max-w-4xl w-full my-12 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-12 text-center space-y-8 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="inline-flex p-5 bg-indigo-600 rounded-3xl text-white shadow-2xl">
              <BrainCircuit size={56} />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter">成人 ADHD 深度评估系统</h1>
              <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                集成 ASRS-5、WFIRS-S、BDEFS-SF 等六大临床金标准。
                点击下方按钮即可开始测试，无需安装，支持生成 AI 专家报告。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => setState(AppState.PROFILING)}
                className="w-full sm:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xl font-black transition-all transform hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3"
              >
                立即开始测试 <ChevronRight size={24} />
              </button>
              <button 
                onClick={copyAppUrl}
                className="w-full sm:w-auto px-8 py-5 bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2"
              >
                <LinkIcon size={20} /> 分享测试链接
              </button>
            </div>
          </div>

          <div className="px-12 py-10 bg-slate-50 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-6 text-gray-600 font-bold text-lg">
              <BookOpen size={22} className="text-indigo-600" />
              <span>学术标准与参考文献</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px] text-gray-400 leading-relaxed">
              {REFERENCES.map((ref, idx) => (
                <div key={idx} className="flex gap-3 bg-white p-4 rounded-xl border border-gray-200/50">
                  <span className="font-black text-indigo-300">[{idx+1}]</span>
                  <span><strong className="text-gray-600">{ref.name}</strong>: {ref.source}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === AppState.PROFILING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <form 
          onSubmit={(e) => { e.preventDefault(); setState(AppState.ASSESSMENT); }} 
          className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl p-10 space-y-8 border border-gray-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><User size={28} /></div>
            <h2 className="text-3xl font-black text-gray-900">填写个人背景</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-widest">年龄</label>
              <input 
                type="number" required min="18" max="90" value={profile.age}
                onChange={(e) => setProfile(p => ({...p, age: parseInt(e.target.value)}))}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-lg transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-widest">性别</label>
              <div className="grid grid-cols-2 gap-4">
                {[Gender.MALE, Gender.FEMALE].map(g => (
                  <button
                    key={g} type="button"
                    onClick={() => setProfile(p => ({...p, gender: g}))}
                    className={`py-4 rounded-2xl border-2 font-black text-lg transition-all ${
                      profile.gender === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-400 border-gray-100'
                    }`}
                  >
                    {g === Gender.MALE ? '男' : '女'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <div className="space-y-1">
                <span className="font-black text-gray-800">当前是在校学生吗？</span>
                <p className="text-xs text-indigo-400 font-bold">是：则开启学业生活受损评估</p>
              </div>
              <input 
                type="checkbox" checked={profile.isStudent}
                onChange={(e) => setProfile(p => ({...p, isStudent: e.target.checked}))}
                className="w-6 h-6 rounded-lg accent-indigo-600"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all">
            建立档案并进入测试
          </button>
        </form>
      </div>
    );
  }

  if (state === AppState.ASSESSMENT) {
    const progress = ((currentScaleIdx + 1) / activeScales.length) * 100;
    const isLastScale = currentScaleIdx === activeScales.length - 1;

    return (
      <div className="min-h-screen bg-slate-50 pb-40">
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 p-6 shadow-sm">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                {currentScaleIdx + 1}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">{currentScale.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-40 bg-gray-100 h-2 rounded-full overflow-hidden">
                     <div className="bg-indigo-600 h-full transition-all duration-700 ease-out" style={{width: `${progress}%`}} />
                   </div>
                   <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block text-right">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">量表阶段</p>
               <p className="text-xs font-bold text-gray-600 max-w-[200px]">{currentScale.description}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow space-y-6">
              <div className="flex gap-5">
                <span className="text-indigo-200 font-black text-3xl leading-none">{idx + 1}</span>
                <div className="space-y-1">
                  {q.domain && <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-black rounded-md mb-2">{q.domain} 领域</span>}
                  <h4 className="text-xl font-bold text-gray-800 leading-snug">{q.text}</h4>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pl-12">
                {currentScale.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswerChange(currentScale.id, q.id, opt.value)}
                    className={`flex-1 min-w-[120px] py-4 px-3 text-sm font-black rounded-2xl border-2 transition-all ${
                      answers[currentScale.id]?.[q.id] === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105'
                      : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200 hover:text-indigo-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {isLastScale && isCurrentScaleComplete && (
            <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"><Sparkles size={24} /></div>
                  <h3 className="text-xl font-black text-indigo-900">测评已完成！请选择报告生成方式：</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setWantsAi(true)}
                    className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-2 ${wantsAi ? 'bg-white border-indigo-600 shadow-xl' : 'bg-white/50 border-white hover:border-indigo-200'}`}
                  >
                    <div className="flex justify-between items-center">
                       <span className="font-black text-indigo-900">AI 专家深度解读</span>
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${wantsAi ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                          {wantsAi && <CheckCircle2 size={16} className="text-white" />}
                       </div>
                    </div>
                    <p className="text-sm text-indigo-600 font-bold">基于前沿 AI 逻辑生成多量表交叉分析（需要互联网访问）。</p>
                  </button>
                  <button 
                    onClick={() => setWantsAi(false)}
                    className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-2 ${!wantsAi ? 'bg-white border-indigo-600 shadow-xl' : 'bg-white/50 border-white hover:border-indigo-200'}`}
                  >
                    <div className="flex justify-between items-center">
                       <span className="font-black text-gray-700">仅查看临床得分数据</span>
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${!wantsAi ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                          {!wantsAi && <CheckCircle2 size={16} className="text-white" />}
                       </div>
                    </div>
                    <p className="text-sm text-gray-400 font-bold">离线模式，仅基于分值提供硬性临床判定，不调用外部 AI。</p>
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 p-8 z-40">
          <div className="max-w-4xl mx-auto flex justify-between gap-6">
            <button 
              onClick={() => currentScaleIdx > 0 ? setCurrentScaleIdx(prev => prev - 1) : setState(AppState.PROFILING)}
              className="px-8 py-4 text-gray-500 font-black hover:bg-gray-100 rounded-2xl transition-all flex items-center gap-2"
            >
              <ChevronLeft size={24} /> 上一步
            </button>
            <button 
              onClick={handleNext}
              disabled={!isCurrentScaleComplete}
              className={`px-12 py-4 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center gap-2 ${
                isCurrentScaleComplete 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
              }`}
            >
              {isLastScale ? '查看报告' : '下一步'} <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === AppState.RESULT) {
    const results = calculateFullResults();

    return (
      <div className="min-h-screen bg-slate-50 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
             <div className="space-y-4 relative z-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black tracking-widest">
                  <CheckCircle2 size={16} /> 评估报告已生成
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter">成人 ADHD 深度解析报告</h1>
                <div className="flex justify-center md:justify-start items-center gap-4 text-gray-400 font-bold">
                  <span>编号: {Math.floor(Math.random() * 89999 + 10000)}</span>
                  <span>•</span>
                  <span>{profile.age}岁</span>
                  <span>•</span>
                  <span className="text-indigo-500 font-black tracking-widest">{profile.gender === Gender.MALE ? '男性' : '女性'}</span>
                </div>
             </div>
             <div className="flex flex-wrap justify-center gap-3 relative z-10">
               <button onClick={copyReportToClipboard} className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2">
                 <Share2 size={18} /> 分享摘要
               </button>
               <button onClick={copyAppUrl} className="px-6 py-4 bg-white border border-indigo-100 text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center gap-2">
                 <LinkIcon size={18} /> 分享测试
               </button>
               <button onClick={() => window.location.reload()} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-2xl hover:bg-indigo-700 transition-all">
                 重新测评
               </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                  <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Radar size={28} /></div>
                  <h2 className="text-2xl font-black text-gray-800">生活功能受损剖面</h2>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={wfirsRadarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                      <PolarRadiusAxis angle={30} domain={[0, 3]} hide />
                      <ReRadar name="得分" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} dot />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-400 text-center font-bold italic">均分 ≥ 1.5 提示功能损害显著</p>
              </div>

              {wantsAi ? (
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Activity size={28} /></div>
                      <h2 className="text-2xl font-black text-gray-800">AI 专家综合分析报告</h2>
                    </div>
                    {aiError && (
                      <button onClick={fetchAIAnalysis} className="flex items-center gap-1 text-xs font-black text-indigo-500 hover:text-indigo-700">
                        <RefreshCcw size={14} /> 重试分析
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4 rounded-2xl">
                         <Loader2 size={40} className="text-indigo-600 animate-spin" />
                         <span className="text-xs font-black text-indigo-400">正在通过多量表矩阵生成洞察...</span>
                      </div>
                    )}
                    <div className={`prose prose-indigo max-w-none text-gray-700 leading-loose text-lg whitespace-pre-wrap font-medium font-sans ${aiError ? 'text-gray-400 opacity-50' : ''}`}>
                      {summary || (isAnalyzing ? "" : "正在排队处理分析请求...")}
                    </div>
                    {aiError && (
                      <div className="mt-4 p-5 bg-amber-50 rounded-2xl flex items-center gap-4 border border-amber-100">
                         <AlertCircle className="text-amber-500 shrink-0" size={24} />
                         <span className="text-sm font-bold text-amber-800 leading-relaxed">AI 分析因网络环境不可用。请重点参考右侧【关键数据判读】。您可以截图分值咨询医生。</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 rounded-[2.5rem] p-10 border border-slate-200 space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-slate-400 shadow-sm"><Info size={24} /></div>
                      <h2 className="text-2xl font-black text-slate-700">本地判读模式已开启</h2>
                   </div>
                   <p className="text-gray-500 font-bold leading-relaxed">
                     您选择了离线/简易模式。系统已跳过 AI 专家逻辑生成，直接提供基于临床截断值的核心数据。
                     这些分值同样具有很高的临床参考价值。
                   </p>
                   <button 
                    onClick={() => { setWantsAi(true); fetchAIAnalysis(); }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                   >
                     <Sparkles size={16} /> 补充生成 AI 专家报告
                   </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
                <h2 className="text-2xl font-black flex items-center gap-2 border-b border-white/10 pb-6 relative z-10">
                  <BarChart3 size={24} /> 核心临床判定
                </h2>
                <div className="space-y-6 relative z-10">
                  <div className="p-6 bg-white/10 rounded-3xl border border-white/20 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">ASRS-5 (症状强度)</span>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black">{results.scores.asrs5 >= 14 ? '临床高疑似' : '非典型'}</span>
                      <span className="font-mono font-bold text-indigo-100">{results.scores.asrs5} / 24</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                       <div className="bg-white h-full transition-all duration-1000" style={{width: `${(results.scores.asrs5/24)*100}%`}} />
                    </div>
                  </div>
                  <div className="p-6 bg-white/10 rounded-3xl border border-white/20 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">WURS (童年病史)</span>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black">{results.scores.wurs25 >= 46 ? '病史明确' : '低连续性'}</span>
                      <span className="font-mono font-bold text-indigo-100">{results.scores.wurs25} / 100</span>
                    </div>
                  </div>
                  <div className="p-6 bg-white/10 rounded-3xl border border-white/20 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">AAMM (内耗代价)</span>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black">{results.scores.aamm >= 20 ? '高内耗' : '健康'}</span>
                      <span className="font-mono font-bold text-indigo-100">{results.scores.aamm} 分</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-6">
                 <div className="flex items-center gap-3 text-gray-800">
                    <ShieldAlert size={28} className="text-red-500" />
                    <h3 className="text-xl font-black">专家判读指南</h3>
                 </div>
                 <div className="text-sm text-gray-500 font-bold leading-relaxed space-y-4">
                   <p className="border-l-4 border-indigo-500 pl-3"><strong>1. ASRS ≥ 14</strong>: 提示您当前的 ADHD 核心症状已经达到临床诊断的阈值。</p>
                   <p className="border-l-4 border-indigo-500 pl-3"><strong>2. WURS ≥ 46</strong>: 极大地支持了这些症状来源于神经发育（童年起病），而非后天环境压力导致。</p>
                   <p className="border-l-4 border-indigo-500 pl-3"><strong>3. 特别建议</strong>: 若以上两项均高，建议您携带本页面截图，前往正规三甲医院精神科进行 DIVA-5 结构化面谈。</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === AppState.ANALYZING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 space-y-10">
        <div className="relative">
          <Loader2 size={120} className="text-indigo-600 animate-spin" strokeWidth={1} />
          <BrainCircuit size={56} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">AI 专家正在分析您的数据...</h2>
          <p className="text-indigo-400 font-bold">这可能需要 5-10 秒，正在进行跨量表一致性核验</p>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
