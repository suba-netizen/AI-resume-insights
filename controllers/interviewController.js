// controllers/interviewController.js
const axios = require('axios');
const https = require('https'); // For custom HTTPS agent
const fs = require('fs');    // For reading CA certificate file

const GEMINI_API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

// --- Initialize Custom HTTPS Agent ---
let customHttpsAgent;

// Check if NODE_EXTRA_CA_CERTS is set and the file exists
if (process.env.NODE_EXTRA_CA_CERTS) {
    if (fs.existsSync(process.env.NODE_EXTRA_CA_CERTS)) {
        try {
            const caCert = fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS);
            customHttpsAgent = new https.Agent({
                ca: caCert,
                // keepAlive: true, // Optional: for performance with many requests
            });
            console.log(`Custom HTTPS agent configured with CA certificate from: ${process.env.NODE_EXTRA_CA_CERTS}`);
        } catch (e) {
            console.error(`Failed to read or configure CA certificate (${process.env.NODE_EXTRA_CA_CERTS}) for HTTPS agent: ${e.message}`);
            // Fallback to a default agent or let Axios handle it if no custom agent is set
            customHttpsAgent = new https.Agent(); // Default agent
        }
    } else {
        console.warn(`NODE_EXTRA_CA_CERTS is set, but file not found: ${process.env.NODE_EXTRA_CA_CERTS}. Using default HTTPS agent.`);
        customHttpsAgent = new https.Agent(); // Default agent
    }
} else if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    // --- DANGER ZONE: Only for temporary local debugging if CA cert is unavailable ---
    // --- DO NOT USE IN PRODUCTION ---
    console.warn('WARNING: NODE_TLS_REJECT_UNAUTHORIZED is set to 0. SSL/TLS certificate validation is DISABLED. This is insecure.');
    customHttpsAgent = new https.Agent({
        rejectUnauthorized: false
    });
} else {
    // No custom CA and no explicit disabling of SSL checks, use a default agent
    // Axios will use its default behavior which might still fail if the system CAs are the issue.
    // If you still have issues, and it's not a corporate proxy, ensure your OS CA store is up to date.
    console.log("Using default HTTPS agent (no custom CA or NODE_TLS_REJECT_UNAUTHORIZED=0 specified).");
    customHttpsAgent = new https.Agent(); // Standard agent, relies on system's CA store
}


// Helper function to call Gemini
async function callGemini(prompt, maxTokensParam = 800, temperatureParam = 0.7) {
    const geminiApiUrl = `${GEMINI_API_URL_BASE}/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    try {
        const axiosConfig = {
            headers: { 'Content-Type': 'application/json' },
        };
        // Only add httpsAgent if it's been specifically configured (either with CA or to rejectUnauthorized: false)
        if (customHttpsAgent) {
            axiosConfig.httpsAgent = customHttpsAgent;
        }

        const response = await axios.post(
            geminiApiUrl,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: temperatureParam,
                    maxOutputTokens: maxTokensParam,
                    topP: 0.9,
                    topK: 40,
                },
            },
            axiosConfig // Pass the config object here
        );
        return response.data;
    } catch (error) {
        console.error("Error calling Gemini API:", error.message);
        if (error.response) {
            console.error("Gemini API Error Data (response):", JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error("Gemini API Error (request): No response received. Is the API URL correct and reachable?", error.request);
        } else {
            console.error("Gemini API Error (setup):", error.message);
        }

        // Provide a more specific error message if possible
        let detailedErrorMessage = 'Failed to communicate with Gemini API.';
        if (error.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' || error.message.includes('self-signed certificate')) {
            detailedErrorMessage = 'SSL certificate error communicating with Gemini API. If behind a corporate proxy, ensure NODE_EXTRA_CA_CERTS is correctly set to your proxy\'s CA certificate. For local debugging ONLY, you can try setting NODE_TLS_REJECT_UNAUTHORIZED=0 (this is insecure).';
        } else if (error.isAxiosError && error.response && error.response.data && error.response.data.error) {
            detailedErrorMessage = `Gemini API Error: ${error.response.data.error.message} (Status: ${error.response.data.error.code})`;
        } else if (error.message) {
            detailedErrorMessage = error.message;
        }
        throw new Error(detailedErrorMessage);
    }
}

exports.generateInterviewQuestions = async (req, res) => {
    const { role, numQuestions = 5, difficulty = "moderate" } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required.' });

    const promptText = `
You are an expert HR interviewer and career coach specializing in the role of a "${role}".
Your task is to generate ${numQuestions} diverse interview questions tailored for a candidate applying for the role of "${role}" at a ${difficulty} difficulty level.
The questions should cover a mix of types, including Behavioral, Situational/Hypothetical, Technical (if applicable), Problem-Solving/Analytical, and Role-Specific Knowledge/Experience.
Ensure variety and avoid overly generic questions.
Please provide ONLY the list of questions, each on a new line. Do not include any introductory text, numbering, or bullet points.

Role: "${role}"
Difficulty: "${difficulty}"
Number of Questions: ${numQuestions}
---
Generate Questions:`;

    try {
        const calculatedMaxTokens = 800 + (parseInt(numQuestions, 10) * 60);
        const geminiResponseData = await callGemini(promptText, calculatedMaxTokens);

        const rawQuestionsText = geminiResponseData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawQuestionsText) {
            const geminiErrorReason = geminiResponseData.candidates?.[0]?.finishReason;
            const promptFeedback = geminiResponseData.promptFeedback;
            console.error(
                "Gemini API returned no questions text.",
                "Finish Reason:", geminiErrorReason,
                "Prompt Feedback:", JSON.stringify(promptFeedback, null, 2),
                "Full Response Data:", JSON.stringify(geminiResponseData, null, 2)
            );
            let errorMessage = 'AI failed to generate interview questions.';
            if (geminiErrorReason) errorMessage += ` Reason: ${geminiErrorReason}.`;
            return res.status(500).json({ error: errorMessage });
        }
        const questions = rawQuestionsText.split('\n').map(q => q.trim().replace(/^[-\*]\s*/, '')).filter(q => q.length > 5);
        res.json({ role, questions, difficulty });
    } catch (error) {
        console.error("Interview question generation process failed:", error.message);
        res.status(500).json({ error: error.message || 'Server error during question generation.' });
    }
};

exports.analyzeAnswerAndConversation = async (req, res) => {
    const { question, userAnswerText } = req.body;
    if (!userAnswerText || !question) {
        return res.status(400).json({ error: "Question and user's answer text are required." });
    }

    let feedback = { contentAnalysis: null, englishImprovement: null };

    try {
        const contentAnalysisPrompt = `
You are an expert interview coach.
A candidate was asked the following interview question:
"${question}"

The candidate provided this answer:
"${userAnswerText}"

Analyze the candidate's answer based on relevance, clarity, depth (STAR method if applicable), structure, and professionalism.
Provide an overall rating for THIS SPECIFIC ANSWER on a scale of 1-10 (1=Poor, 10=Excellent).
Respond in a structured JSON format (ensure valid JSON, no extra text outside JSON):
{
  "answerRating": "Your rating (e.g., 7/10)",
  "overallSummary": "Your brief overall assessment of this answer.",
  "relevance": "High/Medium/Low - brief explanation.",
  "clarityConciseness": "High/Medium/Low - brief explanation.",
  "depthDetail": "Sufficient/Needs More/Too much - brief explanation.",
  "structureOrganization": "Good/Fair/Needs Improvement - brief explanation.",
  "feedbackPoints": [
    "Actionable feedback point 1 for this answer.",
    "Actionable feedback point 2 for this answer."
  ]
}`;
        const geminiContentResponse = await callGemini(contentAnalysisPrompt, 1024, 0.6);
        const rawContentFeedback = geminiContentResponse.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawContentFeedback) {
            try {
                let cleanJsonString = rawContentFeedback.trim().match(/\{[\s\S]*\}/);
                if (!cleanJsonString) throw new Error("No JSON object found in AI response for content.");
                feedback.contentAnalysis = JSON.parse(cleanJsonString[0]);
            } catch (parseError) {
                console.warn("Could not parse content feedback as JSON:", parseError.message, "Raw:", rawContentFeedback);
                feedback.contentAnalysis = { answerRating: "N/A", overallSummary: "AI output for content was not valid JSON.", feedbackPoints: [rawContentFeedback.trim()] };
            }
        } else {
            const reason = geminiContentResponse.candidates?.[0]?.finishReason;
            feedback.contentAnalysis = { answerRating: "N/A", overallSummary: `AI could not generate content feedback. Reason: ${reason || 'Unknown'}.`, feedbackPoints: [] };
        }

        const languageImprovementPrompt = `
You are an English language coach. Analyze ONLY the language in the following text for grammar, vocabulary, and fluency.
Provide 2-3 actionable suggestions.
Text: "${userAnswerText}"
Respond in a structured JSON format (ensure valid JSON, no extra text outside JSON):
{
  "grammarObservations": ["Suggestion 1.", "Suggestion 2."],
  "vocabularySuggestions": ["Suggestion 1.", "Suggestion 2."],
  "fluencyNotes": "General notes on fluency."
}`;
        const geminiLanguageResponse = await callGemini(languageImprovementPrompt, 800, 0.5);
        const rawLanguageFeedback = geminiLanguageResponse.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawLanguageFeedback) {
            try {
                let cleanJsonString = rawLanguageFeedback.trim().match(/\{[\s\S]*\}/);
                if (!cleanJsonString) throw new Error("No JSON object found in AI response for language.");
                feedback.englishImprovement = JSON.parse(cleanJsonString[0]);
            } catch (parseError) {
                console.warn("Could not parse language feedback as JSON:", parseError.message, "Raw:", rawLanguageFeedback);
                feedback.englishImprovement = { grammarObservations: ["AI output for language was not valid JSON."], vocabularySuggestions: [], fluencyNotes: rawLanguageFeedback.trim() };
            }
        } else {
            const reason = geminiLanguageResponse.candidates?.[0]?.finishReason;
            feedback.englishImprovement = { grammarObservations: [`AI could not generate language feedback. Reason: ${reason || 'Unknown'}.`], vocabularySuggestions: [], fluencyNotes: "" };
        }

        res.json({ message: "Analysis complete.", question, userAnswerText, feedback });

    } catch (error) {
        console.error("Answer/Conversation analysis process failed:", error.message);
        res.status(500).json({ error: error.message || 'Server error during answer analysis.' });
    }
};