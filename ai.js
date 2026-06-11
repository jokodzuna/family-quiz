// AI Question Generation Module
// Gemini API integration for question generation

/**
 * Generate questions using Gemini API
 */
async function generateQuestions(theme, quantity, mode) {
    try {
        const prompt = buildPrompt(theme, quantity, mode);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error response:', errorText);
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Gemini API response:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            throw new Error('Invalid API response structure');
        }
        
        const text = data.candidates[0].content.parts[0].text;
        
        // Strip any markdown code fences
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const questions = JSON.parse(cleanText);
        return questions;
    } catch (error) {
        console.error('Error generating questions:', error);
        throw error;
    }
}

/**
 * Build the prompt for Gemini API
 */
function buildPrompt(theme, quantity, mode) {
    let prompt = `Generate ${quantity} quiz questions about "${theme}". `;
    
    if (mode === 'multipleChoice') {
        prompt += `For each question, provide the correct answer and 3 wrong answers. `;
        prompt += `Return ONLY a raw JSON array with no preamble and no markdown fences. `;
        prompt += `Each object must have this exact structure:
{
  "question": "What colour is the sky?",
  "answer": "Blue",
  "wrong": ["Red", "Green", "Yellow"],
  "image": null
}
Keep answers short and unambiguous - one word or a short phrase only.`;
    } else {
        prompt += `For each question, provide only the correct answer. `;
        prompt += `Return ONLY a raw JSON array with no preamble and no markdown fences. `;
        prompt += `Each object must have this exact structure:
{
  "question": "What colour is the sky?",
  "answer": "Blue",
  "image": null
}
Keep answers short and unambiguous - one word or a short phrase only for reliable fuzzy matching.`;
    }
    
    return prompt;
}

/**
 * Parse uploaded JSON file
 */
function parseUploadedJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const questions = JSON.parse(e.target.result);
                resolve(questions);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Fuzzy matching for type answer mode
 */
function fuzzyMatch(input, correct) {
    // Case insensitive
    const inputLower = input.toLowerCase().trim();
    const correctLower = correct.toLowerCase().trim();
    
    // Strip leading articles
    const articles = ['a', 'an', 'the'];
    let inputClean = inputLower;
    let correctClean = correctLower;
    
    articles.forEach(article => {
        if (inputClean.startsWith(article + ' ')) {
            inputClean = inputClean.substring(article.length + 1);
        }
        if (correctClean.startsWith(article + ' ')) {
            correctClean = correctClean.substring(article.length + 1);
        }
    });
    
    // Exact match
    if (inputClean === correctClean) {
        return true;
    }
    
    // Levenshtein distance
    const distance = levenshteinDistance(inputClean, correctClean);
    const maxLength = Math.max(inputClean.length, correctClean.length);
    
    // Tolerance: 1 error for up to 5 chars, 2 for 6-10, 3 for 11+
    let tolerance;
    if (maxLength <= 5) {
        tolerance = 1;
    } else if (maxLength <= 10) {
        tolerance = 2;
    } else {
        tolerance = 3;
    }
    
    return distance <= tolerance;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1]
                );
            }
        }
    }
    
    return dp[m][n];
}
