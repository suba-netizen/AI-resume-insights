// controllers/coverLetterController.js
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const CoverLetter = require('../models/CoverLetter');

const GEMINI_API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

// --- HTTPS Agent ---
let customHttpsAgent;
if (process.env.NODE_EXTRA_CA_CERTS && fs.existsSync(process.env.NODE_EXTRA_CA_CERTS)) {
    try {
        customHttpsAgent = new https.Agent({ ca: fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS) });
        console.log(`CoverLetterController: Custom HTTPS agent configured with CA: ${process.env.NODE_EXTRA_CA_CERTS}`);
    } catch (e) {
        console.error(`CoverLetterController: Failed to configure CA for HTTPS agent: ${e.message}`);
        customHttpsAgent = new https.Agent(); // Fallback
    }
} else if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    console.warn('CoverLetterController: WARNING: NODE_TLS_REJECT_UNAUTHORIZED=0. SSL validation DISABLED.');
    customHttpsAgent = new https.Agent({ rejectUnauthorized: false });
} else {
    console.log('CoverLetterController: Using default HTTPS agent.');
    customHttpsAgent = new https.Agent();
}

async function callGeminiForCoverLetter(prompt) {
    console.log('[GEMINI CALL] Preparing to call Gemini API...');
    const geminiApiUrl = `${GEMINI_API_URL_BASE}/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const axiosConfig = { headers: { 'Content-Type': 'application/json' } };
    if (customHttpsAgent) { // Use custom agent if defined
        axiosConfig.httpsAgent = customHttpsAgent;
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error('[GEMINI CALL ERROR] GEMINI_API_KEY is not defined!');
        throw new Error('Server configuration error: Gemini API key is missing.');
    }

    try {
        const response = await axios.post(geminiApiUrl, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500, topP: 0.9 },
        }, axiosConfig);
        console.log('[GEMINI CALL] Successfully received response from Gemini.');
        return response.data;
    } catch (error) {
        console.error("[GEMINI CALL ERROR] Error calling Gemini API for Cover Letter:", error.message);
        if (error.response) {
            console.error("[GEMINI CALL ERROR] Gemini API Error Data:", JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error("[GEMINI CALL ERROR] No response received from Gemini:", error.request);
        } else {
            console.error("[GEMINI CALL ERROR] Error setting up Gemini request:", error.message);
        }
        let detailedErrorMessage = 'Failed to communicate with Gemini API for cover letter generation.';
        if (error.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' || (error.message && error.message.includes('self-signed certificate'))) {
            detailedErrorMessage = 'SSL certificate error with Gemini API. Check NODE_EXTRA_CA_CERTS or NODE_TLS_REJECT_UNAUTHORIZED settings.';
        } else if (error.isAxiosError && error.response?.data?.error) {
            detailedErrorMessage = `Gemini API Error: ${error.response.data.error.message} (Status: ${error.response.data.error.code})`;
        } else if (error.message) {
            detailedErrorMessage = error.message;
        }
        throw new Error(detailedErrorMessage); // Re-throw a new error with more context
    }
}


exports.generateCoverLetter = async (req, res) => {
    console.log('--- [CONTROLLER generateCoverLetter] Processing request ---');
    const {
        fullName, email, phone, linkedin, portfolio,
        companyName, jobTitle, jobDescription,
        keySkills, 
        // NEW fields from formData
        advertisementPlatform, 
        recipientName, 
        recipientTitle,
        companyAddress,
        quantifiableAchievements,
        specificCompanyInterest,
        // whyInterested, // Decide if you keep this or merge with specificCompanyInterest
        tone = 'professional and enthusiastic',
        saveLetter
    } = req.body;

    // Existing validation
    if (!fullName || !email || !companyName || !jobTitle || !keySkills) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    let prompt = `
Generate a compelling and professional cover letter for the following individual and job application.
The tone of the cover letter should be ${tone}.

Applicant Information:
- Full Name: ${fullName}
- Email: ${email}
- Phone: ${phone || 'Not specified'}
${linkedin ? `- LinkedIn: ${linkedin}` : ''}
${portfolio ? `- Portfolio/Website: ${portfolio}` : ''}

Target Job & Company:
- Company Name: ${companyName}
- Job Title: ${jobTitle}
${companyAddress ? `- Company Address: ${companyAddress}` : ''}
${recipientName ? `- Hiring Manager/Recipient Name: ${recipientName}` : ''}
${recipientTitle ? `- Recipient Title: ${recipientTitle}` : ''}
${advertisementPlatform ? `- Job Seen On: ${advertisementPlatform}` : ''}

Job Description (Crucial for tailoring - use keywords and requirements from this):
"""
${jobDescription || 'No job description provided. Focus on general fit for the role and company.'}
"""

Applicant's Strengths for This Role:
- Key Skills & Experiences:
  """
  ${Array.isArray(keySkills) ? keySkills.map(skill => `- ${skill.trim()}`).join('\n') : `- ${keySkills.trim()}`}
  """
${quantifiableAchievements ? `- Quantifiable Achievements to highlight:\n  """\n  ${quantifiableAchievements}\n  """\n` : ''}

Applicant's Motivation:
${specificCompanyInterest ? `- Specific Interest in ${companyName} / This Role:\n  """\n  ${specificCompanyInterest}\n  """\n` : 
(req.body.whyInterested ? `- General Interest:\n  """\n  ${req.body.whyInterested}\n  """\n` : '')}

Cover Letter Instructions:
1.  Format: Standard professional cover letter. Include sender's details (name, contact), date, recipient's details (name, title, company, address if known), salutation, body paragraphs, closing, and typed signature.
2.  Sender's Details: Place ${fullName}'s contact info appropriately (usually top left or right).
3.  Date: Include the current date.
4.  Recipient Details: Address it to ${recipientName || 'the Hiring Team'} at ${companyName}. Include ${recipientTitle || 'Relevant Department'} and ${companyAddress || 'Company Location'} if provided.
5.  Salutation: "Dear ${recipientName || 'Hiring Team'},".
6.  Introduction: State the position (${jobTitle}) being applied for and mention where it was seen (${advertisementPlatform || 'your careers page/general application'}). Express strong enthusiasm.
7.  Body Paragraphs (2-3, well-developed):
    - Directly connect the "Applicant's Strengths" (Key Skills, Experiences, Quantifiable Achievements) to the requirements outlined in the "Job Description". Use specific examples.
    - Elaborate on the "Applicant's Motivation" (Specific Interest) to show genuine fit and research.
    - Demonstrate how the applicant can contribute to ${companyName}.
8.  Conclusion: Reiterate strong interest in the ${jobTitle} role, express eagerness for an interview, and thank the recipient.
9.  Closing: "Sincerely," or a similar professional closing.
10. Signature: End with the applicant's full name: ${fullName}.
11. Tone & Language: Maintain a ${tone} tone. Ensure grammar and spelling are perfect.
12. Critical: Replace ALL bracketed placeholders in a typical cover letter template with the actual information provided above. If some information (like Recipient Title or Company Address) is not provided, omit that specific line gracefully rather than showing a placeholder.
13. Output ONLY the complete cover letter text. No extra commentary or notes before or after the letter.

Generate the cover letter now:
`;
   console.log('[CONTROLLER generateCoverLetter] Prompt constructed. Length:', prompt.length);

    try {
        const geminiResponse = await callGeminiForCoverLetter(prompt);
        console.log('[CONTROLLER generateCoverLetter] Gemini response received.');
        let generatedText = '';
        if (geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
            generatedText = geminiResponse.candidates[0].content.parts[0].text.trim();
            console.log('[CONTROLLER generateCoverLetter] Extracted text. Length:', generatedText.length);
        } else {
            const reason = geminiResponse?.candidates?.[0]?.finishReason || 'Unknown or unexpected response structure';
            const blockReason = geminiResponse?.promptFeedback?.blockReason;
            let errMessage = `AI failed to generate valid text. Reason: ${reason}.`;
            if (blockReason) errMessage += ` Block Reason: ${blockReason}.`;
            console.error('[CONTROLLER generateCoverLetter] Text extraction failed.', errMessage, 'Response:', JSON.stringify(geminiResponse, null, 2));
            return res.status(500).json({ error: errMessage });
        }
        if (!generatedText) {
            return res.status(500).json({ error: 'AI generated an empty cover letter.' });
        }
        let savedLetterId = null;
        if (saveLetter && req.userId) {
            try {
                const newCoverLetter = new CoverLetter({
                    userId: req.userId, companyName, jobTitle, generatedText, tone,
                    // Optionally save more formData fields here
                    advertisementPlatform: formData.advertisementPlatform,
                    recipientName: formData.recipientName,
                    specificCompanyInterest: formData.specificCompanyInterest,
                });
                const saved = await newCoverLetter.save();
                savedLetterId = saved._id;
                console.log("[CONTROLLER] Cover letter saved. ID:", savedLetterId);
            } catch (dbError) {
                console.error("[CONTROLLER] Database save error:", dbError.message);
            }
        }
        res.json({ coverLetter: generatedText, savedLetterId });
    } catch (error) {
        console.error("[CONTROLLER] Overall CATCH error:", error.message, error.stack);
        res.status(500).json({ error: error.message || 'Server error during generation.' });
    }
};

exports.getUserCoverLetters = async (req, res) => {
    console.log('--- [CONTROLLER getUserCoverLetters] Processing request for userId:', req.userId, '---');
    try {
        const letters = await CoverLetter.find({ userId: req.userId })
                                         .sort({ createdAt: -1 })
                                         .lean();
        console.log(`[CONTROLLER getUserCoverLetters] Found ${letters.length} letters for user.`);
        res.json(letters);
    } catch (error) {
        console.error("[CONTROLLER getUserCoverLetters] Failed to fetch cover letter history:", error.message, error.stack);
        res.status(500).json({ error: "Failed to retrieve cover letter history." });
    }
};