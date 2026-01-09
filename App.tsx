
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
  RefreshCcw
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
      setSummary("AI 专家系统响应异常。您可以参考下方的临床原始数据进行初步判断。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const finalizeResults = () => {
    setState(AppState.ANALYZING);
    fetchAIAnalysis();
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

  const copyReportToClipboard = () => {
    const results = calculateFullResults();
    const reportText = `
【成人 ADHD 深度解析摘要】
编号: #${Math.floor(Math.random() * 89999 + 10000)}
年龄: ${profile.age} | 性别: ${profile.gender === Gender.MALE ? '男' : '女'}

核心数据:
- ASRS-5 (当前症状): ${results.scores.asrs5} / 24 ${results.scores.asrs5 >= 14 ? '(高风险)' : '(低风险)'}
- WURS-25 (童年溯源): ${results.scores.wurs25} / 100 ${results.scores.wurs25 >= 46 ? '(病史支持)' : '(低关联)'}
- AAMM (掩蔽代价): ${results.scores.aamm} 分

主要受损领域:
${Object.entries(results.domainMeans['wfirs_s'] || {})
  .filter(([_, val]) => val >= 1.5)
  .map(([name, val]) => `- ${name}: ${val.toFixed(2)} (显着)`)
  .join('\n')}

此摘要仅供参考，完整报告及 AI 分析建议访问原网站查看。
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: '我的 ADHD 评估报告',
        text: reportText,
        url: window.location.href
      }).catch(() => {
        navigator.clipboard.writeText(reportText);
        alert('报告摘要已复制到剪贴板！');
      });
    } else {
      navigator.clipboard.writeText(reportText);
      alert('报告摘要已复制到剪贴板！');
    }
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
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter">成人 ADHD 深度自测系统</h1>
              <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                本系统集成了 2024-2025 临床研究中最前沿的 ASRS-5、WFIRS-S 等权威量表。
                即便在无网络或 AI 离线状态下，您依然可以获得基于临床常模的数据解读。
              </p>
            </div>
            <button 
              onClick={() => setState(AppState.PROFILING)}
              className="w-full max-w-md py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xl font-black transition-all transform hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3 mx-auto"
            >
              启动临床级测评 <ChevronRight size={24} />
            </button>
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
            <h2 className="text-3xl font-black text-gray-900">建立受测者档案</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-widest">您的年龄</label>
              <input 
                type="number" required min="18" max="90" value={profile.age}
                onChange={(e) => setProfile(p => ({...p, age: parseInt(e.target.value)}))}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-lg transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-gray-700 uppercase tracking-widest">生理性别</label>
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
                <span className="font-black text-gray-800">当前是否为在校学生？</span>
                <p className="text-xs text-indigo-400 font-bold">针对“学校维度”的个性化测评</p>
              </div>
              <input 
                type="checkbox" checked={profile.isStudent}
                onChange={(e) => setProfile(p => ({...p, isStudent: e.target.checked}))}
                className="w-6 h-6 rounded-lg accent-indigo-600"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all">
            进入测评
          </button>
        </form>
      </div>
    );
  }

  if (state === AppState.ASSESSMENT) {
    const progress = ((currentScaleIdx + 1) / activeScales.length) * 100;
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
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
                   <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">进度 {Math.round(progress)}%</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block text-right">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">量表说明</p>
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
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100 p-8 z-40">
          <div className="max-w-4xl mx-auto flex justify-between gap-6">
            <button 
              onClick={() => currentScaleIdx > 0 ? setCurrentScaleIdx(prev => prev - 1) : setState(AppState.PROFILING)}
              className="px-10 py-4 text-gray-500 font-black hover:bg-gray-100 rounded-2xl transition-all flex items-center gap-2"
            >
              <ChevronLeft size={24} /> 上一步
            </button>
            <button 
              onClick={handleNext}
              disabled={!isCurrentScaleComplete}
              className={`px-16 py-4 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center gap-2 ${
                isCurrentScaleComplete 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
              }`}
            >
              {currentScaleIdx === activeScales.length - 1 ? '提交报告' : '下一步'} <ChevronRight size={24} />
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
                  <CheckCircle2 size={16} /> 交叉验证报告已就绪
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter">成人 ADHD 深度解析报告</h1>
                <div className="flex justify-center md:justify-start items-center gap-4 text-gray-400 font-bold">
                  <span>编号: {Math.floor(Math.random() * 89999 + 10000)}</span>
                  <span>•</span>
                  <span>{profile.age}岁</span>
                  <span>•</span>
                  <span className="text-indigo-500 font-black uppercase tracking-wider">{profile.gender === Gender.MALE ? '男性' : '女性'}</span>
                </div>
             </div>
             <div className="flex flex-wrap justify-center gap-3 relative z-10">
               <button onClick={copyReportToClipboard} className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2">
                 <Share2 size={18} /> 分享摘要
               </button>
               <button onClick={() => window.print()} className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2">
                 <Copy size={18} /> 打印PDF
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
                  <h2 className="text-2xl font-black text-gray-800">生活功能损害雷达图</h2>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={wfirsRadarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                      <PolarRadiusAxis angle={30} domain={[0, 3]} hide />
                      <ReRadar name="受损得分" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} dot />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-400 text-center font-bold italic">注：维度分 >= 1.5 为临床显着水平</p>
              </div>

              {redFlags.length > 0 && (
                <div className="bg-red-50 rounded-[2rem] p-8 border border-red-100 space-y-4">
                  <div className="flex items-center gap-3 text-red-600">
                    <ShieldAlert size={28} />
                    <h3 className="text-xl font-black">高风险临床关注点</h3>
                  </div>
                  <p className="text-sm text-red-800 font-medium leading-relaxed">以下具体项目得分最高（3分），代表症状已在该领域造成严重功能破坏，需优先干预：</p>
                  <ul className="grid grid-cols-1 gap-2">
                    {redFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700 font-bold">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 space-y-8">
                <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Activity size={28} /></div>
                    <h2 className="text-2xl font-black text-gray-800">AI 专家综合研判</h2>
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
                       <span className="text-xs font-black text-indigo-400">正在生成深度洞察...</span>
                    </div>
                  )}
                  <div className={`prose prose-indigo max-w-none text-gray-700 leading-loose text-lg whitespace-pre-wrap font-medium font-sans ${aiError ? 'text-gray-400' : ''}`}>
                    {summary || "正在加载深度分析报告..."}
                  </div>
                  {aiError && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl flex items-center gap-3 border border-indigo-100">
                       <AlertCircle className="text-indigo-500" size={20} />
                       <span className="text-xs font-bold text-indigo-800">AI 分析受网络限制暂时不可用。请重点参考下方【关键指标数据】中关于发育连续性和核心症状的自动判读。</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
                <h2 className="text-2xl font-black flex items-center gap-2 border-b border-white/10 pb-6 relative z-10">
                  <BarChart3 size={24} /> 关键指标数据
                </h2>
                <div className="space-y-6 relative z-10">
                  <div className="p-6 bg-white/10 rounded-3xl border border-white/20 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">ASRS-5 (核心症状度)</span>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black">{results.scores.asrs5 >= 14 ? '高风险' : '低风险'}</span>
                      <span className="font-mono font-bold text-indigo-100">{results.scores.asrs5} / 24</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                       <div className="bg-white h-full" style={{width: `${(results.scores.asrs5/24)*100}%`}} />
                    </div>
                  </div>
                  <div className="p-6 bg-white/10 rounded-3xl border border-white/20 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">WURS (儿童期病史)</span>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black">{results.scores.wurs25 >= 46 ? '病史明确' : '低支持度'}</span>
                      <span className="font-mono font-bold text-indigo-100">{results.scores.wurs25} / 100</span>
                    </div>
                  </div>
                  <div className="p-6 bg-white/10 rounded-3xl border border-white/20 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">AAMM (掩蔽消耗)</span>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black">{results.scores.aamm >= 20 ? '高内耗' : '正常代偿'}</span>
                      <span className="font-mono font-bold text-indigo-100">{results.scores.aamm} 分</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-6">
                 <div className="flex items-center gap-3 text-gray-800">
                    <Info size={28} className="text-indigo-600" />
                    <h3 className="text-xl font-black">自动判读说明</h3>
                 </div>
                 <div className="text-sm text-gray-500 font-bold leading-relaxed space-y-4">
                   <p>1. <strong>发育连续性</strong>: ADHD 诊断必须追溯至童年。若 WURS-25 分值较高，极大增加了神经发育性障碍的确定性。</p>
                   <p>2. <strong>高掩蔽风险</strong>: 若 AAMM 较高，说明您正在通过透支巨大的精力维持生活，这通常会导致焦虑或职业倦怠。</p>
                   <p>3. <strong>专业干预建议</strong>: 如果 ASRS-5 与 WURS-25 双高，建议优先寻求精神科面诊。</p>
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
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">整合临床决策矩阵逻辑...</h2>
          <div className="flex flex-col items-center gap-3 text-indigo-400 font-black uppercase tracking-widest text-[10px]">
            <span className="animate-pulse">评估童年病史一致性...</span>
            <span className="animate-pulse delay-75">计算 7 大损害领域权重...</span>
            <span className="animate-pulse delay-150">分析“掩蔽效应”潜在代价...</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
