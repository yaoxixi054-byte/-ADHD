
import { GoogleGenAI } from "@google/genai";
import { AssessmentResults } from "./types";

export const generateSummary = async (results: AssessmentResults): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 提取 WFIRS-S 中的严重受损项
  const wfirsAnswers = results.answers['wfirs_s'] || {};
  const severeItems = Object.entries(wfirsAnswers)
    .filter(([_, val]) => val === 3)
    .length;

  const prompt = `
    你是一名顶级成人ADHD临床专家。请根据以下多量表自测结果，生成一份深度、科学且充满人文关怀的分析报告。
    
    用户信息：
    - 年龄: ${results.profile.age}，性别: ${results.profile.gender}
    
    量表原始数据：
    1. ASRS-5 (当前症状严重度): ${results.scores.asrs5} (截断值 14)。
    2. WFIRS-S (功能损害领域均分): ${JSON.stringify(results.domainMeans.wfirs_s)}。
    3. 特别注意：用户在 WFIRS-S 中有 ${severeItems} 个条目得分为满分(3分)，这代表严重功能瘫痪。
    4. BDEFS-SF (执行功能缺陷): ${results.scores.bdefs_sf}。
    5. AAMM (伪装/掩蔽分值): ${results.scores.aamm}。
    6. WURS-25 (童年溯源证据): ${results.scores.wurs25} (截断值 46)。

    分析与判读逻辑要求：
    - **发育连续性判定**：如果 WURS-25 高于 46，且 ASRS-5 也高，提示典型的神经发育性 ADHD；如果 ASRS-5 高但 WURS-25 低于 30，请警惕这可能是共病焦虑、抑郁或现代生活方式导致的“类似ADHD表现”，而非真正的神经发育障碍。
    - **功能损害解读**：重点分析均分超过 1.5 的领域。特别是对于得分为 3 的项目，请作为“靶点”进行危机提醒。
    - **掩蔽机制分析**：分析 AAMM 分值，指出用户是否正在通过透支精力的完美主义（伪装）来维持表面的功能。
    - **专家建议**：根据结果给出生活策略建议（如外部脚手架、环境支持），并根据发育史证据给出建议寻求专业面诊的紧迫程度。
    
    语气：专业严谨、逻辑清晰、富有同理心，避免数据堆砌。使用中文分段撰写。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "生成报告失败，请查阅量表原始分值。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 专家分析服务暂时不可用，建议截图分值并咨询临床专业人士。";
  }
};
