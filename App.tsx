
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
  Link as LinkIcon,
  QrCode,
  X,
  Smartphone,
  Printer,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar as ReRadar, ResponsiveContainer, Tooltip 
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
  const [showShareModal, setShowShareModal] = useState(false);

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
      if (summaryText.includes("分析服务暂时不可用")) setAiError(true);
      setSummary(summaryText);
    } catch (e) {
      setAiError(true);
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

  const handlePrint = () => {
    window.print();
  };

  const copyReportToClipboard = () => {
    const results = calculateFullResults();
    const reportText = `【ADHD 评估结果】ASRS-5: ${results.scores.asrs5}, WURS-25: ${results.scores.wurs25}, AAMM: ${results.scores.aamm}。建议参考完整 PDF 报告。`;
    navigator.clipboard.writeText(reportText);
    alert('摘要已复制');
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

  if (state === AppState.START) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-lg">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative">
              <button onClick={() => setShowShareModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
              <div className="text-center space-y-4">
                <div className="inline-flex p-4 bg-indigo-50 rounded-2xl text-indigo-600"><Smartphone size={32} /></div>
                <h3 className="text-2xl font-black">如何正确分享测试？</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  目前您看到的是临时预览地址。如需发给他人，请点击编辑器右上角的 <b>"Deploy"</b> 或 <b>"Publish"</b> 按钮，获得一个以 <code>.vercel.app</code> 结尾的正式链接。
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">当前预览地址二维码</p>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`} alt="QR" className="mx-auto w-32 h-32" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl w-full my-12 bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-12 text-center space-y-8">
            <div className="inline-flex p-5 bg-indigo-600 rounded-3xl text-white shadow-xl">
              <ShieldCheck size={48} />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">成人 ADHD 临床评估系统</h1>
              <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                专业级多量表评估工具。集成 ASRS-5, WURS-25, WFIRS-S 及 AAMM 掩蔽测量。
                支持离线临床判定，结果可直接导出为 PDF 医疗报告。
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setState(AppState.PROFILING)}
                className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                立即开始评估
              </button>
              <button 
                onClick={() => setShowShareModal(true)}
                className="px-8 py-5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl text-lg font-bold transition-all"
              >
                获取分享链接
              </button>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-center gap-8 text-slate-400 font-bold text-xs uppercase tracking-widest">
               <div className="flex items-center gap-2"><CheckCircle2 size={16} /> 隐私加密</div>
               <div className="flex items-center gap-2"><CheckCircle2 size={16} /> 临床证据等级: A</div>
               <div className="flex items-center gap-2"><CheckCircle2 size={16} /> 本地判定可用</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === AppState.PROFILING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 space-y-8 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><User size={28} /></div>
            <h2 className="text-3xl font-black">受测者档案</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">基本年龄</label>
              <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-lg" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">生理性别</label>
              <div className="grid grid-cols-2 gap-4">
                {[Gender.MALE, Gender.FEMALE].map(g => (
                  <button key={g} onClick={() => setProfile({...profile, gender: g})} className={`py-4 rounded-2xl font-bold text-lg border-2 transition-all ${profile.gender === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>
                    {g === Gender.MALE ? '男' : '女'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => setState(AppState.ASSESSMENT)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg">
            进入量表测试
          </button>
        </div>
      </div>
    );
  }

  if (state === AppState.ASSESSMENT) {
    const progress = ((currentScaleIdx + 1) / activeScales.length) * 100;
    return (
      <div className="min-h-screen bg-white pb-32">
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">{currentScaleIdx + 1}</div>
              <div>
                <h2 className="text-xl font-black">{currentScale.name}</h2>
                <div className="w-32 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all duration-500" style={{width: `${progress}%`}} />
                </div>
              </div>
            </div>
            <button onClick={() => currentScaleIdx > 0 && setCurrentScaleIdx(prev => prev - 1)} className="text-slate-400 hover:text-indigo-600 font-bold text-sm">上一步</button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} className="space-y-6">
              <div className="flex gap-4">
                <span className="text-indigo-600 font-black text-xl">{idx + 1}.</span>
                <h4 className="text-xl font-bold text-slate-800 leading-snug">{q.text}</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pl-8">
                {currentScale.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswerChange(currentScale.id, q.id, opt.value)}
                    className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${answers[currentScale.id]?.[q.id] === opt.value ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 inset-x-0 p-8 bg-white/95 border-t border-slate-100 backdrop-blur-md z-40">
          <div className="max-w-3xl mx-auto">
            <button 
              onClick={handleNext}
              disabled={!isCurrentScaleComplete}
              className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all ${isCurrentScaleComplete ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
            >
              {currentScaleIdx === activeScales.length - 1 ? '完成测试并分析' : '保存并进行下一组量表'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === AppState.RESULT) {
    const results = calculateFullResults();
    const isHighRisk = results.scores.asrs5 >= 14 && results.scores.wurs25 >= 46;

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-6 print:bg-white print:p-0">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 print:shadow-none print:border-none">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-4xl font-black text-slate-900">评估结论报告</h1>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Assessment Report • #{Math.floor(Math.random()*100000)}</p>
            </div>
            <div className="flex gap-3 print:hidden">
              <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
                <Printer size={18} /> 导出 PDF 报告
              </button>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">
                重新测试
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <Activity className="text-indigo-600" />
                  <h2 className="text-2xl font-black">专家判读结论</h2>
                </div>
                
                {/* 核心结论卡片 */}
                <div className={`p-8 rounded-[2rem] border-2 ${isHighRisk ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'} space-y-4`}>
                   <div className="flex items-center gap-3">
                      {isHighRisk ? <AlertCircle className="text-red-600" /> : <CheckCircle2 className="text-indigo-600" />}
                      <h3 className="text-2xl font-black text-slate-900">核心判定：{isHighRisk ? '临床高度疑似 ADHD' : '非典型 ADHD 倾向'}</h3>
                   </div>
                   <p className="text-slate-600 font-medium leading-relaxed">
                     {isHighRisk 
                       ? "您的 ASRS-5 与回溯性的 WURS-25 分值均已超过临床截断点，显示出极强的症状连续性（即症状起源于童年且延续至今）。这高度符合神经发育性 ADHD 的临床路径。" 
                       : "虽然您当前可能感到注意力或执行功能的挑战，但您的量表组合未显示出典型且连续的神经发育轨迹。建议排查环境压力、焦虑或抑郁导致的分心。"}
                   </p>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><Radar size={20} className="text-indigo-600" /> 现实生活功能受损图谱</h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={wfirsRadarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                        <PolarRadiusAxis angle={30} domain={[0, 3]} hide />
                        <ReRadar name="受损" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {wantsAi && (
                  <div className="pt-6 border-t border-slate-50 space-y-4">
                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><Sparkles size={20} className="text-indigo-600" /> AI 专家深度叙述</h4>
                    <div className="text-slate-600 leading-loose text-lg whitespace-pre-wrap font-medium">
                      {isAnalyzing ? "正在生成深度解读..." : summary || "AI 服务在当前网络环境下不可用，请参考右侧数据判读。"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl space-y-8">
                <h3 className="text-xl font-black flex items-center gap-2 border-b border-white/10 pb-6"><FileText size={20} /> 核心量表数据</h3>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ASRS-5 (现状)</span>
                      <span className="font-mono text-2xl font-black">{results.scores.asrs5} / 24</span>
                    </div>
                    <div className={`h-2 rounded-full ${results.scores.asrs5 >= 14 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${(results.scores.asrs5/24)*100}%`}} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">WURS-25 (史实)</span>
                      <span className="font-mono text-2xl font-black">{results.scores.wurs25} / 100</span>
                    </div>
                    <div className={`h-2 rounded-full ${results.scores.wurs25 >= 46 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{width: `${(results.scores.wurs25/100)*100}%`}} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">AAMM (掩蔽代价)</span>
                      <span className="font-mono text-2xl font-black">{results.scores.aamm}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold">高分代表您在通过高内耗的完美主义掩盖症状</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2"><ShieldAlert size={20} className="text-red-500" /> 后续行动指南</h3>
                <div className="text-sm text-slate-500 font-medium leading-relaxed space-y-4">
                  <p>1. <b>携带报告</b>：如果您打算寻求面诊，请打印本页，其包含的 ASRS 和 WURS 数据是临床医生诊断的核心依据。</p>
                  <p>2. <b>生活调整</b>：关注 WFIRS 剖面图中均分超过 1.5 的领域，这些是您目前功能断裂的“靶点”。</p>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-8 p-6">
        <div className="relative">
          <Loader2 size={100} className="text-indigo-600 animate-spin" strokeWidth={1} />
          <BrainCircuit size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">临床分析引擎正在运行...</h2>
      </div>
    );
  }

  return null;
};

export default App;
