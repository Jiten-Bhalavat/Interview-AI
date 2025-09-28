// Transcript interface
export interface TranscriptEntry {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
}

// Analysis result interface
export interface InterviewAnalysis {
  overallScore: number;
  technicalKnowledge: {
    score: number;
    breakdown: {
      accuracy: number;
      depth: number;
      terminology: number;
      bestPractices: number;
    };
    feedback: string;
  };
  communicationSkills: {
    score: number;
    breakdown: {
      clarity: number;
      structure: number;
      listening: number;
      conciseness: number;
    };
    feedback: string;
  };
  problemSolving: {
    score: number;
    breakdown: {
      logicalThinking: number;
      problemBreakdown: number;
      edgeCases: number;
      alternatives: number;
    };
    feedback: string;
  };
  professionalPresentation: {
    score: number;
    breakdown: {
      confidence: number;
      demeanor: number;
      difficultQuestions: number;
      presence: number;
    };
    feedback: string;
  };
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  detailedFeedback: string;
}

// Initialize OpenAI client only when needed
let openaiClient: any = null;

const getOpenAIClient = async () => {
  if (!openaiClient) {
    try {
      const { default: OpenAI } = await import('openai');
      openaiClient = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('OpenAI client initialization failed');
    }
  }
  return openaiClient;
};

// Speech-to-text using Whisper
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const openai = await getOpenAIClient();

    const response = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
    });

    return response.text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    // Fallback: return placeholder instead of throwing
    return 'Speech transcription temporarily unavailable';
  }
}

// Analyze interview transcript using GPT-4o-mini
export async function analyzeInterview(transcript: TranscriptEntry[]): Promise<InterviewAnalysis> {
  try {
    const openai = await getOpenAIClient();

    // Format transcript for analysis
    const formattedTranscript = transcript
      .map(entry => `${entry.speaker === 'user' ? 'Candidate' : 'Interviewer'}: ${entry.message}`)
      .join('\n\n');

    const analysisPrompt = `
You are an expert technical interviewer analyzing a candidate's interview performance.
Evaluate this interview transcript using the detailed rubric below and provide a comprehensive analysis.

DETAILED RUBRIC (100 points total):

**TECHNICAL KNOWLEDGE (25 points):**
- Technical accuracy and correctness (8 points)
- Depth of understanding and knowledge (8 points)
- Appropriate use of technical terminology (5 points)
- Knowledge of best practices and standards (4 points)

**COMMUNICATION SKILLS (25 points):**
- Clarity of explanations and articulation (8 points)
- Structured and logical thinking process (7 points)
- Active listening and question comprehension (5 points)
- Conciseness without losing important details (5 points)

**PROBLEM-SOLVING APPROACH (25 points):**
- Logical and systematic thinking process (8 points)
- Ability to break down complex problems (7 points)
- Consideration of edge cases and constraints (5 points)
- Discussion of alternative solutions (5 points)

**PROFESSIONAL PRESENTATION (25 points):**
- Confidence and self-assurance (8 points)
- Professional demeanor and communication style (7 points)
- Handling of difficult or challenging questions (5 points)
- Overall interview presence and engagement (5 points)

**INTERVIEW TRANSCRIPT:**
${formattedTranscript}

**ANALYSIS REQUIREMENTS:**
Please provide a detailed JSON response with the following structure:
{
  "overallScore": number (0-100),
  "technicalKnowledge": {
    "score": number (0-25),
    "breakdown": {
      "accuracy": number (0-8),
      "depth": number (0-8),
      "terminology": number (0-5),
      "bestPractices": number (0-4)
    },
    "feedback": "detailed feedback string"
  },
  "communicationSkills": {
    "score": number (0-25),
    "breakdown": {
      "clarity": number (0-8),
      "structure": number (0-7),
      "listening": number (0-5),
      "conciseness": number (0-5)
    },
    "feedback": "detailed feedback string"
  },
  "problemSolving": {
    "score": number (0-25),
    "breakdown": {
      "logicalThinking": number (0-8),
      "problemBreakdown": number (0-7),
      "edgeCases": number (0-5),
      "alternatives": number (0-5)
    },
    "feedback": "detailed feedback string"
  },
  "professionalPresentation": {
    "score": number (0-25),
    "breakdown": {
      "confidence": number (0-8),
      "demeanor": number (0-7),
      "difficultQuestions": number (0-5),
      "presence": number (0-5)
    },
    "feedback": "detailed feedback string"
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "detailedFeedback": "comprehensive overall feedback with specific examples from the interview"
}

**SCORING GUIDELINES:**
- 90-100: Exceptional performance, ready for senior roles
- 80-89: Strong performance, minor areas for improvement
- 70-79: Good performance, some notable areas to work on
- 60-69: Average performance, several areas need improvement
- Below 60: Needs significant improvement before being interview-ready

Please be specific in your feedback, citing exact examples from the transcript where possible. Focus on actionable advice that will help the candidate improve their interview performance.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer and career coach. Provide detailed, constructive feedback to help candidates improve their interview skills.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error('No analysis received from OpenAI');
    }

    const analysis: InterviewAnalysis = JSON.parse(analysisText);
    return analysis;
  } catch (error) {
    console.error('Interview analysis error:', error);

    // Return a fallback analysis instead of throwing
    return {
      overallScore: 70,
      technicalKnowledge: {
        score: 18,
        breakdown: { accuracy: 6, depth: 6, terminology: 3, bestPractices: 3 },
        feedback: "Analysis temporarily unavailable. Manual review recommended."
      },
      communicationSkills: {
        score: 17,
        breakdown: { clarity: 6, structure: 5, listening: 3, conciseness: 3 },
        feedback: "Analysis temporarily unavailable. Manual review recommended."
      },
      problemSolving: {
        score: 17,
        breakdown: { logicalThinking: 6, problemBreakdown: 5, edgeCases: 3, alternatives: 3 },
        feedback: "Analysis temporarily unavailable. Manual review recommended."
      },
      professionalPresentation: {
        score: 18,
        breakdown: { confidence: 6, demeanor: 5, difficultQuestions: 3, presence: 4 },
        feedback: "Analysis temporarily unavailable. Manual review recommended."
      },
      strengths: ["Interview completed successfully", "Engaged with the process"],
      areasForImprovement: ["Full analysis pending", "Try again later"],
      recommendations: ["Review transcript manually", "Practice more sessions"],
      detailedFeedback: "Interview analysis service is temporarily unavailable. Your conversation has been recorded and you can review the transcript. Please try the analysis feature again later or contact support for manual review."
    };
  }
}