const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const Analysis = require('../models/Analysis'); // Assuming Analysis model exists

exports.uploadAndAnalyze = async (req, res) => {
  const file = req.file;
  let filePathToDelete = null; // Store path for cleanup in finally block

  // Check if file was provided by multer
  if (!file) {
    // Multer fileFilter or limits should ideally catch this first.
    return res.status(400).json({ error: 'Resume file required.' });
  }
  filePathToDelete = file.path; // Set path for potential deletion

  let resumeText = '';

  try {
    // Read file based on mimetype
    // NOTE: Ensure your Multer fileFilter is the primary defense against unsupported types.
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      resumeText = pdfData.text;
    } else if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const dataBuffer = fs.readFileSync(file.path);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      resumeText = result.value;
    } else {
      // This error should ideally be prevented by Multer's fileFilter.
      throw new Error('Unsupported file type processed by server.');
    }

    // --- Prepare Prompt for AI ---
    // Ensure the prompt structure matches the regex in the frontend formatAnalysis function
    const promptText = `
You are an expert career coach and recruiter.
Analyze the following resume and provide a detailed breakdown.

Please respond in this *exact structured format*:

Resume Score: [Score out of 100, e.g., 85/100]
Suggested Career Fields:
[1-3 suitable job roles or industries, can be list or paragraph]
Strengths:
- [Bullet point 1]
- [Bullet point 2]
- [etc.]
Weaknesses:
- [Bullet point 1]
- [Bullet point 2]
- [etc.]
Improvement Suggestions:
- [Bullet point 1]
- [Bullet point 2]
- [etc.]
Recommended Courses:
- [Suggest 2-3 online courses or certifications]
- [Include providers like Coursera, Udemy, LinkedIn Learning if possible]

---
Resume Content:
${resumeText}
---
`;
    // --- Call Gemini API ---
    // Ensure process.env.GEMINI_API_KEY is set.
    // NOTE: Verify the correct model name from Google's official documentation.
    // Example: 'gemini-1.5-flash-latest' or 'gemini-pro'.
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiRes = await axios.post(
      geminiApiUrl,
      {
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024, // Increased slightly for potentially more detailed responses
          // topP: 0.9, // Example of another parameter you might tune
          // topK: 40,  // Example
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // Extract analysis result from Gemini response
    const analysisResult = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisResult) {
      const geminiErrorReason = geminiRes.data.candidates?.[0]?.finishReason;
      const promptFeedback = geminiRes.data.promptFeedback;
      console.error(
        "Gemini API returned no analysis text. Status:", geminiRes.status,
        "Finish Reason:", geminiErrorReason,
        "Prompt Feedback:", promptFeedback,
        "Full Response Data:", JSON.stringify(geminiRes.data, null, 2) // Log full response for debugging
      );
      let errorMessage = 'AI analysis failed to generate content.';
      if (geminiErrorReason === 'SAFETY') {
        errorMessage = 'AI analysis blocked due to safety concerns with the prompt or content.';
      } else if (geminiErrorReason) {
        errorMessage = `AI analysis stopped: ${geminiErrorReason}.`;
      }
      throw new Error(errorMessage);
    }

    // --- Save analysis to DB ---
    const analysisDoc = new Analysis({
      userId: req.userId, // req.userId should be set by the auth middleware
      analysis: analysisResult,
      filename: file.originalname, // Save original filename for user reference
      // createdAt will be automatically added by Mongoose timestamps if enabled on schema
    });
    await analysisDoc.save();

    // --- Send Response ---
    res.json({ analysis: analysisResult, filename: file.originalname }); // Also return filename

  } catch (error) {
    // --- Error Handling ---
    console.error("Resume analysis process failed:", error.message);
    if (error.response?.data) { // Log Axios error data if available
        console.error("Axios error data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.stack) {
        console.error(error.stack);
    }


    if (error.message.startsWith('Unsupported file type')) {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX file.' });
    }
    if (error.message.startsWith('AI analysis')) { // Catches custom AI errors
      return res.status(500).json({ error: error.message });
    }
    // Generic server error
    res.status(500).json({ error: 'Failed to process resume due to a server error.' });
  } finally {
    // --- File Cleanup (Important: Delete the file after processing or on error) ---
    if (filePathToDelete && fs.existsSync(filePathToDelete)) {
      try {
        fs.unlinkSync(filePathToDelete);
        console.log(`Successfully deleted temporary file: ${filePathToDelete}`);
      } catch (unlinkError) {
        console.error(`Failed to delete temporary file ${filePathToDelete}:`, unlinkError);
      }
    }
  }
};

// --- Get User Analyses ---
exports.getUserAnalyses = async (req, res) => {
  try {
    // Find analyses for the authenticated user, sorted by creation date descending
    const analyses = await Analysis.find({ userId: req.userId })
                                   .sort({ createdAt: -1 })
                                   .lean(); // .lean() for performance on read-only
    res.json(analyses);
  } catch (e) {
    console.error("Failed to fetch user analyses:", e);
    res.status(500).json({ error: 'Failed to retrieve previous analyses.' });
  }
};

// --- Get User Analyses ---
exports.getUserAnalyses = async (req, res) => {
  try {
    // Find analyses for the authenticated user, sorted by creation date descending
    const analyses = await Analysis.find({ userId: req.userId }).sort({ createdAt: -1 }).lean(); // .lean() makes it faster if you don't need Mongoose methods
    res.json(analyses);
  } catch (e) {
    console.error("Failed to fetch user analyses:", e);
    res.status(500).json({ error: 'Failed to retrieve previous analyses.' });
  }
};

