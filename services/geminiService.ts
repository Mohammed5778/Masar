import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfileData, AssessmentQuestion, UserAnswer, Certificate, Project, SocialLink, HolisticAnalysisResult, JobPosting, AISuggestion } from '../types';

// IMPORTANT: This service assumes that the API_KEY is set in the environment variables.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API key for GoogleGenAI is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });


export const generateLandingTeaser = async (userInput: string): Promise<string> => {
    if (!API_KEY) {
        throw new Error("ميزة الذكاء الاصطناعي غير متاحة حالياً.");
    }

    const prompt = `
        A user is on the Masar landing page. They typed the following into a text box describing what they are looking for.
        User input: "${userInput}"

        Your task is to act as a persuasive assistant for Masar, a talent marketplace.
        - Your response must be in Arabic.
        - It should be short, exciting, and encouraging (2-3 sentences).
        - It should directly address the user's input and highlight how Masar is the perfect solution for them.
        - It must end with a strong, clear call to action to sign up. Example: "سجل الآن لاستكشاف الفرص!" or "أنشئ حسابك وابدأ البحث عن المواهب اليوم!".
        - Do not use markdown or any special formatting. Just return plain text.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error in generateLandingTeaser:", error);
        throw new Error("فشل في إنشاء رد ذكي. يرجى المحاولة مرة أخرى.");
    }
};


export const parseCvText = async (cvText: string): Promise<Partial<UserProfileData>> => {
  if (!API_KEY) {
    throw new Error("ميزة تحليل الذكاء الاصطناعي غير متاحة. مفتاح الـ API غير موجود.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `قم بتحليل نص السيرة الذاتية التالي باللغة العربية واستخرج المعلومات المهنية للشخص. نص السيرة الذاتية: "${cvText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            full_name: { 
              type: Type.STRING, 
              description: "الاسم الكامل للشخص." 
            },
            title: { 
              type: Type.STRING, 
              description: "المسمى الوظيفي الأحدث أو الأساسي للشخص."
            },
            summary: { 
              type: Type.STRING, 
              description: "ملخص مهني موجز عن الشخص."
            },
            experience_years: { 
              type: Type.NUMBER, 
              description: "إجمالي سنوات الخبرة المهنية كرقم."
            },
            skills: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "قائمة بالمهارات التقنية والشخصية الرئيسية."
            }
          },
          required: ["full_name", "title", "skills"]
        },
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error parsing CV with Gemini:", error);
    throw new Error("فشل تحليل السيرة الذاتية. يرجى المحاولة مرة أخرى أو إدخال البيانات يدويًا.");
  }
};


export const parseCvPdf = async (pdfFile: File): Promise<Partial<UserProfileData>> => {
  if (!API_KEY) {
    throw new Error("ميزة تحليل الذكاء الاصطناعي غير متاحة. مفتاح الـ API غير موجود.");
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  try {
    const base64EncodedString = await fileToBase64(pdfFile);
    
    const filePart = {
      inlineData: {
        mimeType: pdfFile.type,
        data: base64EncodedString,
      },
    };
    
    const textPart = {
        text: `قم بتحليل ملف السيرة الذاتية المرفق (PDF) باللغة العربية واستخرج المعلومات المهنية للشخص.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [filePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            full_name: { type: Type.STRING, description: "الاسم الكامل للشخص." },
            title: { type: Type.STRING, description: "المسمى الوظيفي الأحدث أو الأساسي للشخص." },
            summary: { type: Type.STRING, description: "ملخص مهني موجز عن الشخص." },
            experience_years: { type: Type.NUMBER, description: "إجمالي سنوات الخبرة المهنية كرقم." },
            skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة بالمهارات التقنية والشخصية الرئيسية." }
          },
          required: ["full_name", "title", "skills"]
        },
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error parsing PDF CV with Gemini:", error);
    throw new Error("فشل تحليل ملف الـ PDF. قد يكون الملف محمياً أو غير قابل للقراءة. جرب ملفاً آخر أو أدخل البيانات يدوياً.");
  }
};


export const generateAssessment = async (profile: UserProfileData): Promise<AssessmentQuestion[]> => {
    if (!API_KEY) throw new Error("AI Assessment feature is disabled. API key not configured.");

    const prompt = `
        بصفتك خبير توظيف تقني، قم بإنشاء تقييم قصير ومخصص للمرشح التالي بناءً على ملفه الشخصي وهدفه الوظيفي.
        
        **ملف المرشح:**
        - **المسمى الوظيفي الحالي:** ${profile.title}
        - **المهارات:** ${profile.skills.join(', ')}
        - **ملخص:** ${profile.summary}
        - **الهدف الوظيفي:** ${profile.job_goal}

        **متطلبات التقييم:**
        1.  يجب أن يكون باللغة العربية.
        2.  أنشئ 5 أسئلة:
            - 3 أسئلة متعددة الخيارات (multiple_choice) لاختبار المعرفة التقنية الصلبة المتعلقة بالهدف الوظيفي والمهارات المذكورة.
            - 2 سؤال نصي مفتوح (text) لتقييم المهارات الناعمة (مثل حل المشكلات، التواصل) في سياق مهني.
        3.  يجب أن تكون خيارات الأسئلة متعددة الخيارات (4 خيارات) واضحة وموجزة، مع خيار واحد صحيح فقط.
        4.  يجب أن تكون الأسئلة متنوعة وتغطي جوانب مختلفة من الدور المطلوب.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['multiple_choice', 'text'] },
                            options: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: 'A list of 4 options for multiple_choice questions.'
                            }
                        },
                        required: ["question", "type"]
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating assessment:", error);
        throw new Error("فشل إنشاء التقييم. يرجى المحاولة مرة أخرى.");
    }
}


export const evaluateAssessment = async (questions: AssessmentQuestion[], answers: UserAnswer[]): Promise<{ score: number; passed: boolean; }> => {
    if (!API_KEY) throw new Error("AI Evaluation feature is disabled. API key not configured.");
    
    const passThreshold = 70; // Score to pass is 70%

    const prompt = `
        بصفتك مقيّم توظيف خبير، قم بتقييم إجابات المرشح التالية.
        
        **الأسئلة والإجابات:**
        ${questions.map((q, index) => `
        سؤال ${index + 1} (${q.type}): ${q.question}
        ${q.options ? `خيارات: ${q.options.join(' | ')}` : ''}
        إجابة المرشح: ${answers.find(a => a.question === q.question)?.answer}
        `).join('\n')}

        **مهمتك:**
        1.  قم بتقييم كل إجابة بدقة.
        2.  للأسئلة متعددة الخيارات، حدد ما إذا كانت الإجابة صحيحة أم لا.
        3.  للأسئلة النصية، قم بتقييم جودة الإجابة ومنطقها ووضوحها بناءً على معايير احترافية.
        4.  احسب درجة مئوية إجمالية (من 0 إلى 100) بناءً على أداء المرشح في جميع الأسئلة.
        5.  **تنبيه مهم:** كن حذرًا من الإجابات التي تبدو عامة جدًا، أو قصيرة جدًا، أو التي قد تكون منسوخة من مصدر خارجي. قم بتخفيض الدرجة إذا كانت الإجابة تفتقر إلى الأصالة أو التفصيل.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: {
                            type: Type.INTEGER,
                            description: "الدرجة الإجمالية من 0 إلى 100."
                        }
                    },
                    required: ["score"]
                }
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        return {
            score: result.score,
            passed: result.score >= passThreshold,
        };

    } catch (error) {
        console.error("Error evaluating assessment:", error);
        throw new Error("فشل تقييم الإجابات. يرجى المحاولة مرة أخرى.");
    }
}

export const generateHolisticProfileAnalysis = async (
    profile: UserProfileData,
    certificates: Certificate[],
    projects: Project[],
    links: SocialLink[]
): Promise<HolisticAnalysisResult> => {
    if (!API_KEY) throw new Error("AI Analysis feature is disabled. API key not configured.");

    const prompt = `
        بصفتك خبير توظيف أول ومستشار مهني، قم بتقديم تحليل شامل وعميق للملف الشخصي التالي.
        المرشح يستهدف وظيفة: **${profile.job_goal || profile.title}**.

        **بيانات المرشح الكاملة:**
        - **الملف الشخصي:** ${JSON.stringify(profile, null, 2)}
        - **الشهادات:** ${JSON.stringify(certificates, null, 2)}
        - **المشاريع:** ${JSON.stringify(projects, null, 2)}
        - **الروابط الاحترافية:** ${JSON.stringify(links, null, 2)}

        **مهمتك:**
        قم بإنشاء تحليل منظم بصيغة JSON. يجب أن يحتوي الكائن الناتج على الحقول التالية فقط:
        1.  **completeness_score (integer):** درجة من 0 إلى 100 تعبر عن مدى اكتمال الملف الشخصي (هل كل الحقول المهمة مملوءة؟ هل هناك صورة؟ مشاريع؟).
        2.  **consistency_score (integer):** درجة من 0 إلى 100 تقيس مدى الاتساق بين المهارات المذكورة، والمشاريع المنفذة، والشهادات المحصل عليها. هل المشاريع تعكس حقًا المهارات؟
        3.  **goal_clarity_score (integer):** درجة من 0 إلى 100 لمدى وضوح الهدف الوظيفي وتوافقه مع بقية الملف الشخصي.
        4.  **recruiter_summary (string):** ملخص من 2-3 جمل باللغة العربية، مكتوب بأسلوب احترافي وموجه مباشرة لمدير التوظيف، يبرز القيمة الفريدة للمرشح.
        5.  **key_strengths (array of strings):** قائمة تحتوي على ثلاث نقاط قوة رئيسية بالضبط، كل نقطة في جملة قصيرة وواضحة باللغة العربية.

        كن موضوعيًا، محترفًا، وقدم رؤى حقيقية تتجاوز مجرد سرد المعلومات.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        completeness_score: { type: Type.INTEGER },
                        consistency_score: { type: Type.INTEGER },
                        goal_clarity_score: { type: Type.INTEGER },
                        recruiter_summary: { type: Type.STRING },
                        key_strengths: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["completeness_score", "consistency_score", "goal_clarity_score", "recruiter_summary", "key_strengths"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating holistic analysis:", error);
        throw new Error("فشل إنشاء التحليل المتقدم للملف الشخصي.");
    }
};


export const suggestCandidatesForRecruiter = async (jobs: JobPosting[], candidates: UserProfileData[]): Promise<AISuggestion[]> => {
    if (!API_KEY) throw new Error("ميزة اقتراح المرشحين غير متاحة.");
    if (jobs.length === 0) return []; // No jobs to match against
    if (candidates.length === 0) return []; // No candidates to suggest

    const prompt = `
        بصفتك مساعد توظيف خبير يعمل في منصة "مسار"، مهمتك هي مساعدة الشركات على إيجاد أفضل المواهب.
        
        **معلومات الشركة:**
        - هذه الشركة لديها الوظائف التالية معلنة على المنصة: ${JSON.stringify(jobs.map(j => ({title: j.title, required_skills: j.required_skills})))}

        **قائمة المرشحين المتاحين:**
        - هذه هي قائمة المرشحين المعتمدين في المنصة: ${JSON.stringify(candidates.map(c => ({id: c.id, title: c.title, skills: c.skills, experience_years: c.experience_years})))}

        **مهمتك:**
        1.  حلل الوظائف المطلوبة من الشركة، وركز على المهارات والمسميات الوظيفية.
        2.  قارنها بقائمة المرشحين المتاحين.
        3.  اختر أفضل 3 مرشحين **بالضبط** من القائمة الذين يعتبرون الأكثر ملاءمة لوظائف الشركة بشكل عام.
        4.  لكل مرشح مقترح، قدم سبباً موجزاً ومقنعاً (باللغة العربية) لاقتراحك في جملة واحدة.
        5.  لا تقترح مرشحين غير موجودين في القائمة المقدمة.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            description: "قائمة بأفضل 3 مرشحين مقترحين.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    candidate_id: {
                                        type: Type.STRING,
                                        description: "معرف المرشح (ID) من قائمة المرشحين."
                                    },
                                    justification: {
                                        type: Type.STRING,
                                        description: "سبب مقنع وموجز باللغة العربية لاختيار هذا المرشح."
                                    }
                                },
                                required: ["candidate_id", "justification"]
                            }
                        }
                    },
                    required: ["suggestions"]
                }
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.suggestions || [];
    } catch (error) {
        console.error("Error suggesting candidates for recruiter:", error);
        throw new Error("فشل في توليد اقتراحات المرشحين.");
    }
};