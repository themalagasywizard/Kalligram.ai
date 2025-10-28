// functions/generate-text.js
const fetch = require('node-fetch');
const config = require('./config');

// Note: Since we're now using localStorage for data storage (client-side only),
// this serverless function can no longer access project context from a database.
// The client will need to send all necessary context in the request body.

// Helper function to truncate text to a maximum length
const truncateText = (text, maxLength = 1000) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Helper function to summarize text (for previous chapter content)
const summarizeText = (text) => {
  if (!text) return '';
  const maxLength = 500;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Helper function to format project context from client-provided data
const formatProjectContext = (contextData) => {
  try {
    if (!contextData || !contextData.items) {
      return '';
    }
    
    const { characters = [], locations = [], events = [] } = contextData.items;
    
    // Format the context string
    let contextString = 'Project Context:\n\n';
    
    // Add characters
    contextString += 'Characters:\n';
    if (characters.length > 0) {
      characters.forEach(char => {
        contextString += `Character: ${char.name}\n`;
        if (char.role) contextString += `  Role: ${char.role}\n`;
        if (char.traits) contextString += `  Traits: ${truncateText(char.traits, 200)}\n`;
        if (char.backstory) contextString += `  Backstory: ${truncateText(char.backstory, 300)}\n`;
        contextString += '\n';
      });
    } else {
      contextString += 'No characters selected.\n\n';
    }
    
    // Add locations
    contextString += 'Locations:\n';
    if (locations.length > 0) {
      locations.forEach(loc => {
        contextString += `Location: ${loc.name}\n`;
        if (loc.type) contextString += `  Type: ${loc.type}\n`;
        if (loc.description) contextString += `  Description: ${truncateText(loc.description, 200)}\n`;
        if (loc.key_features) contextString += `  Key Features: ${truncateText(loc.key_features, 200)}\n`;
        contextString += '\n';
      });
    } else {
      contextString += 'No locations selected.\n\n';
    }
    
    // Add events
    contextString += 'Timeline Events:\n';
    if (events.length > 0) {
      events.forEach(event => {
        contextString += `Event: ${event.name}\n`;
        if (event.date_time) contextString += `  Time: ${event.date_time}\n`;
        if (event.description) contextString += `  Description: ${truncateText(event.description, 200)}\n`;
        contextString += '\n';
      });
    } else {
      contextString += 'No timeline events selected.\n';
    }
    
    return contextString;
  } catch (error) {
    console.error('Error in formatProjectContext:', error);
    return '';
  }
};

// Helper function to format previous chapters from client-provided data
const formatPreviousChapters = (chaptersData) => {
  try {
    if (!chaptersData || chaptersData.length === 0) {
      return 'No previous chapters found.';
    }
    
    let chaptersText = 'PREVIOUS CHAPTERS:\n\n';
    
    chaptersData.forEach((chapter, index) => {
      const chapterNum = chapter.order_index || (index + 1);
      chaptersText += `Chapter ${chapterNum}: ${chapter.title || 'Untitled'}\n`;
      // Show full content for the most recent chapter, summaries for others
      if (index === chaptersData.length - 1) {
        chaptersText += `${chapter.content}\n\n`;
      } else {
        chaptersText += `${summarizeText(chapter.content)}\n\n`;
      }
    });
    
    return chaptersText;
  } catch (error) {
    console.error('Error formatting previous chapters:', error);
    return '';
  }
};

// Helper function to validate API keys
const validateApiKeys = (modelName) => {
    console.log('Validating API keys for model:', modelName);
    console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('API')));
    
    const isDeepSeekModel = modelName.includes('deepseek');
    const isQwen3Model = modelName.includes('qwen3');
    
    // Check if we have any required API keys
    const hasDeepSeekKey = process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== '';
    const hasOpenRouterKey = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== '';
    
    console.log('API Key status:', { hasDeepSeekKey, hasOpenRouterKey, isDeepSeekModel, isQwen3Model });
    
    if (isDeepSeekModel && !hasDeepSeekKey) {
        throw new Error('DEEPSEEK_API_KEY is not configured. Please set this environment variable in Netlify.');
    }
    
    if (isQwen3Model && !hasOpenRouterKey) {
        throw new Error('OPENROUTER_API_KEY is not configured. Please set this environment variable in Netlify.');
    }
    
    // For other models, we need at least one API key
    if (!isDeepSeekModel && !isQwen3Model && !hasDeepSeekKey && !hasOpenRouterKey) {
        throw new Error('No API keys configured. Please set either DEEPSEEK_API_KEY or OPENROUTER_API_KEY in Netlify environment variables.');
    }
    
    console.log('API key validation successful');
};

// Helper function to get the OpenRouter model name
const getOpenRouterModelName = (modelName) => {
    const modelMap = {
        // Premium Models via OpenRouter
        'claude-opus': 'anthropic/claude-3-opus',
        'claude-sonnet': 'anthropic/claude-3-sonnet',
        // Free Models via OpenRouter
        'qwen3-235b': 'qwen/qwen3-235b-a22b'
    };
    return modelMap[modelName] || modelName;
};

// Helper function to convert words to tokens (approximate)
const wordsToTokens = (wordCount) => {
    // Optimized token calculation - 1 word ≈ 1.3 tokens on average
    // Use a more accurate conversion with reasonable buffer
    const tokensEstimate = Math.ceil(wordCount * 1.3);
    
    // Add buffer for system message and context (200-400 tokens typically)
    const bufferTokens = Math.min(400, Math.ceil(wordCount * 0.1));
    
    return tokensEstimate + bufferTokens;
};

// Helper function to ensure text ends with a complete sentence
const ensureCompleteSentence = (text) => {
    if (!text) return text;
    
    // Find the last occurrence of common sentence endings
    const endings = ['. ', '! ', '? ', '."', '!"', '?"', '.\n', '!\n', '?\n'];
    let lastEndIndex = -1;
    
    endings.forEach(ending => {
        const index = text.lastIndexOf(ending);
        if (index > lastEndIndex) {
            lastEndIndex = index + ending.length;
        }
    });
    
    // If we found a sentence ending, trim to that point
    if (lastEndIndex > -1) {
        return text.substring(0, lastEndIndex).trim();
    }
    
    // If no sentence ending found, return the original text
    return text.trim();
};

// Helper function to create a timeout promise
const timeoutPromise = (ms, message) => new Promise((_, reject) => 
    setTimeout(() => reject(new Error(message || 'Request timed out')), ms)
);

// Helper function to calculate dynamic timeout based on tokens and mode
const calculateTimeout = (maxTokens, mode, isDeepSeekModel) => {
    // REALITY CHECK: Despite netlify.toml saying 120s, we're getting killed at 30s
    // So let's work within realistic constraints
    const BASE_TIMEOUT = mode === 'chat' ? 8000 : 15000;   // 15 seconds base for generate mode
    const MAX_TIMEOUT = 25000;   // 25 seconds maximum (realistic Netlify limit)
    const MIN_TIMEOUT = mode === 'chat' ? 5000 : 8000;     // Minimum timeout
    const MS_PER_TOKEN = mode === 'chat' ? 4 : 6;          // More aggressive per-token time

    // Calculate timeout based on estimated words for better scaling
    const estimatedWords = maxTokens / 1.3; // More accurate conversion back to words
    
    // For very long requests, use maximum timeout
    if (estimatedWords > 1000) {
        return MAX_TIMEOUT; // 25 seconds for 1000+ word requests
    }
    
    if (isDeepSeekModel) {
        // DeepSeek is generally faster, so use more aggressive scaling
        const scaledTimeout = BASE_TIMEOUT + (maxTokens * (MS_PER_TOKEN * 0.8));
        return Math.min(MAX_TIMEOUT, Math.max(MIN_TIMEOUT, scaledTimeout));
    } else {
        // OpenRouter models - use longer timeouts for reliability
        const scaledTimeout = BASE_TIMEOUT + (maxTokens * MS_PER_TOKEN);
        return Math.min(MAX_TIMEOUT, Math.max(MIN_TIMEOUT, scaledTimeout));
    }
};

// Helper function to fetch with timeout and retry mechanism
const fetchWithTimeout = async (url, options, timeout) => {
    const MAX_RETRIES = 2;
    let lastError = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            // If this is a retry, log it and add a small delay to avoid rate limiting
            if (attempt > 0) {
                console.log(`Retry attempt ${attempt}/${MAX_RETRIES} for API request`);
                // Add a small delay before retrying (increasing with each attempt)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            
            const response = await Promise.race([
                fetch(url, { ...options, signal: controller.signal }),
                timeoutPromise(timeout, `Request timed out after ${timeout}ms`)
            ]);
            
            clearTimeout(timeoutId);
            
            // If the response is not ok but it's a 429 (rate limit) or a 5xx error,
            // these are retryable errors
            if (!response.ok && (response.status === 429 || response.status >= 500)) {
                throw new Error(`Server responded with status ${response.status}`);
            }
            
            return response;
        } catch (error) {
            lastError = error;
            const isRetryableError = 
                error.name === 'AbortError' || 
                error.message.includes('timed out') ||
                error.message.includes('status 429') ||
                error.message.includes('status 5');
                
            // If this is the last attempt or the error is not retryable, throw it
            if (attempt === MAX_RETRIES || !isRetryableError) {
                // Add context to the error message
                if (error.name === 'AbortError' || error.message.includes('timed out')) {
                    throw new Error(`Request to ${url.split('?')[0]} timed out after ${timeout}ms. Try reducing the length parameter or simplifying the prompt.`);
                }
                throw error;
            }
            
            // Otherwise, continue to the next retry attempt
            console.warn(`Request failed (${error.message}). Retrying...`);
        }
    }
};

// Create system message based on desired length, tone, and context data
const createSystemMessage = (mode, userName, desiredWords, tone, contextString, previousChapters, isDeepSeekModel = false) => {
    // Simplified system messages for better performance
    if (mode === 'chat') {
        return `You are an AI writing assistant helping ${userName} brainstorm and plan their creative writing project.

Focus on DISCUSSION and IDEAS rather than writing full content. Ask questions, suggest plot points, and help develop characters and settings.

${contextString ? `Context: ${contextString.substring(0, 1500)}` : ''}
${previousChapters ? `Previous: ${previousChapters.substring(0, 1000)}` : ''}

Keep responses under ${Math.min(desiredWords, 300)} words${tone ? ` in a ${tone} tone` : ''}.`;
    } else {
        // Optimized system message for generate mode
        const contextLength = desiredWords > 2000 ? 1500 : 1000; // More context for longer requests
        const previousLength = desiredWords > 2000 ? 2000 : 1500; // More previous content for longer requests
        
        return `You are an AI writing assistant. Write exactly ${desiredWords} words of engaging story content${tone ? ` in a ${tone} tone` : ''}.

TARGET: ${desiredWords} words (range: ${Math.floor(desiredWords * 0.9)}-${Math.ceil(desiredWords * 1.1)} words).

${contextString ? `Context: ${contextString.substring(0, contextLength)}` : ''}
${previousChapters ? `Continue from: ${previousChapters.substring(0, previousLength)}` : ''}

Write compelling narrative with dialogue, action, and description. Maintain consistent pacing throughout.`;
    }
};

// Export using the proper format for Netlify Functions
exports.handler = async (event) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }

    try {
        // Basic validation
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    error: 'Method not allowed. Please use POST.',
                    success: false
                })
            };
        }

        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing request body',
                    success: false
                })
            };
        }

        // Parse request
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        } catch (e) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid JSON in request body',
                    success: false
                })
            };
        }

        const { 
            prompt = '', 
            context = [], 
            mode = 'generate', // Default to generate mode
            tone = '', 
            length = '500',
            user_id = '',
            project_id = '',
            stream = false  // Add streaming support
        } = parsedBody;

        if (!prompt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Prompt is required',
                    success: false
                })
            };
        }
        
        // Log request details for debugging
        console.log('Request validation - user_id:', user_id, 'project_id:', project_id);
        console.log('Full request body:', { prompt, context, mode, tone, length, user_id, project_id });
        
        // Validate user_id and project_id (but allow empty values temporarily for debugging)
        if (!user_id || !project_id) {
            console.warn('Missing user_id or project_id, proceeding with defaults for debugging');
            // Use fallback values to prevent total failure during debugging
            const fallbackUserId = user_id || 'debug-user';
            const fallbackProjectId = project_id || 'debug-project';
            
            // Log this and continue instead of failing
            console.log(`Using fallback values: user_id=${fallbackUserId}, project_id=${fallbackProjectId}`);
            
            // For now, let's continue with fallback values instead of failing
            // TODO: Re-enable strict validation once user auth is confirmed working
        }

        const modelName = event.queryStringParameters?.model || config.DEFAULT_MODEL;
        
        // Validate API keys before making request
        console.log('Validating API keys for model:', modelName);
        try {
            validateApiKeys(modelName);
            console.log('API key validation passed');
        } catch (error) {
            console.error('API key validation failed:', error.message);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    error: `API configuration error: ${error.message}`,
                    success: false
                })
            };
        }
        
        // Format context data from client request
        let userName = 'User'; // Default value
        let contextString = '';
        let previousChapters = '';
        
        try {
            // Extract context and chapters from request body
            // The client should now send context and previousChapters data in the request
            if (parsedBody.contextData) {
                contextString = formatProjectContext(parsedBody.contextData);
                console.log('Formatted context from client data');
            }
            
            if (parsedBody.previousChapters) {
                previousChapters = formatPreviousChapters(parsedBody.previousChapters);
                console.log('Formatted previous chapters from client data');
            }
            
            // Log the context being fed to the AI
            console.log('========== CONTEXT BEING FED TO AI ==========');
            console.log('Mode:', mode);
            console.log('Context String:', contextString.substring(0, 500));
            console.log('Previous Chapters:', previousChapters.substring(0, 500));
            console.log('==========================================');
        } catch (contextError) {
            console.error('Error formatting context data:', contextError);
            // Don't fail the entire request, just log the error and proceed with defaults
        }

        const isDeepSeekModel = modelName.includes('deepseek');
        const isQwen3Model = modelName.includes('qwen3');

        // Convert desired word length to tokens and ensure minimum/maximum bounds based on mode
        // REALITY CHECK: With 25s timeout limit, we need to be more conservative
        const maxDesiredWords = mode === 'chat' ? 500 : 2000; // Reduced to 2000 words for generate mode
        const minDesiredWords = mode === 'chat' ? 50 : 100;   // Different minimums for each mode
        
        const desiredWords = Math.min(Math.max(parseInt(length) || (mode === 'chat' ? 200 : 500), minDesiredWords), maxDesiredWords);
        const maxTokens = wordsToTokens(desiredWords);
        const timeout = calculateTimeout(maxTokens, mode, isDeepSeekModel);
        
        // Log the calculated values for debugging
        console.log(`Request details: words=${desiredWords}, tokens=${maxTokens}, timeout=${timeout}ms, model=${modelName}`);
        
        // CRITICAL: Reduce timeout for DeepSeek to work within Netlify limits
        // Despite our 120s config, there seems to be a 30s hard limit
        const effectiveTimeout = Math.min(timeout, 25000); // Cap at 25 seconds for reliability
        console.log(`Effective timeout reduced to: ${effectiveTimeout}ms (from ${timeout}ms) to work within Netlify limits`);
        
        // Move the debugInfo creation here, after all variables are defined
        const debugInfo = {
            contextString,
            previousChapters,
            modelName,
            mode,
            requestedWords: desiredWords
            // Don't include actualWords and tokensUsed yet - they'll be added after generation
        };

        // Create system message based on desired length, tone, and context data
        const systemMessage = createSystemMessage(mode, userName, desiredWords, tone, contextString, previousChapters, isDeepSeekModel);

        // Adjust parameters based on mode
        const temperature = mode === 'chat' ? 0.9 : 0.8; // Higher temperature for chat mode to encourage more varied responses
        const presencePenalty = mode === 'chat' ? 0.8 : 0.5; // Higher presence penalty for chat to reduce repetition
        const frequencyPenalty = mode === 'chat' ? 0.7 : 0.5; // Higher frequency penalty for chat to reduce repetition

        // For very long requests, cap max_tokens to prevent API timeouts
        // With 25s timeout limit, we need to be more aggressive about token limits
        let effectiveMaxTokens = maxTokens;
        if (desiredWords > 2000) {
            effectiveMaxTokens = Math.min(maxTokens, 3000); // Stricter limit for 2000+ words
        } else if (desiredWords > 1000) {
            effectiveMaxTokens = Math.min(maxTokens, 2500); // Medium limit for 1000+ words
        }
        
        console.log(`Token adjustment: requested=${maxTokens}, effective=${effectiveMaxTokens} for ${desiredWords} words`);
        
        // Create request body with optimized settings for longer content
        const requestBody = isDeepSeekModel ? {
            model: modelName,
            messages: [
                {
                    role: "system",
                    content: systemMessage
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: Math.min(temperature, 0.7), // Lower temperature for more focused output
            top_p: 0.9, // Slightly lower for better coherence
            max_tokens: effectiveMaxTokens,
            stream: false, // Disable streaming for better reliability
            presence_penalty: presencePenalty,
            frequency_penalty: frequencyPenalty,
            stop: null  // Remove stop sequences that might truncate content
        } : {
            model: getOpenRouterModelName(modelName),
            messages: [
                {
                    role: "system",
                    content: systemMessage
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: Math.min(temperature, 0.7), // Lower temperature for more focused output
            top_p: 0.9, // Slightly lower for better coherence
            max_tokens: effectiveMaxTokens,
            stop: null  // Remove stop sequences that might truncate content
        };

        // Make API request
        const apiUrl = isDeepSeekModel 
            ? 'https://api.deepseek.com/v1/chat/completions'
            : 'https://openrouter.ai/api/v1/chat/completions';

        // Prepare headers based on the API being used
        const headers = {
            'Content-Type': 'application/json'
        };

        if (isDeepSeekModel) {
            headers['Authorization'] = `Bearer ${process.env.DEEPSEEK_API_KEY}`;
        } else {
            headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
            // Required OpenRouter headers
            headers['HTTP-Referer'] = process.env.SITE_URL || 'https://github.com/themalagasywizard/aiwritingtool';
            headers['X-Title'] = 'AIStoryCraft';
        }

        let response;
        let finalRequestBody = requestBody;
        
        try {
            console.log(`Making API request to ${apiUrl.split('?')[0]} with ${effectiveTimeout}ms timeout`);
            response = await fetchWithTimeout(
                apiUrl,
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(finalRequestBody)
                },
                effectiveTimeout  // Use the reduced timeout
            );
        } catch (error) {
            // If the request fails and it's a long request, try with reduced tokens
            if (desiredWords > 2000 && (error.message.includes('timed out') || error.message.includes('499'))) {
                console.log(`Long request failed, retrying with reduced tokens: ${desiredWords} words`);
                const reducedTokens = Math.floor(effectiveMaxTokens * 0.7); // Reduce by 30%
                
                finalRequestBody = isDeepSeekModel ? {
                    ...requestBody,
                    max_tokens: reducedTokens
                } : {
                    ...requestBody,
                    max_tokens: reducedTokens
                };
                
                // Try again with reduced tokens and still capped timeout
                const retryTimeout = Math.min(effectiveTimeout + 5000, 25000); // Add 5s but cap at 25s
                console.log(`Retrying with reduced tokens and ${retryTimeout}ms timeout`);
                response = await fetchWithTimeout(
                    apiUrl,
                    {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(finalRequestBody)
                    },
                    retryTimeout // Use capped retry timeout
                );
            } else {
                throw error; // Re-throw if not a long request or different error
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('API Response:', result); // Debug log

        // Extract text and usage info
        let generatedText = '';
        let usage = null;

        if (isDeepSeekModel && result.choices?.[0]?.message?.content) {
            generatedText = result.choices[0].message.content;
            usage = result.usage;
        } else if (!isDeepSeekModel) { // OpenRouter response handling
            if (!result.choices?.[0]?.message?.content) {
                console.error('Unexpected OpenRouter response format:', result);
                throw new Error('Invalid response format from OpenRouter API');
            }
            generatedText = result.choices[0].message.content;
            usage = {
                prompt_tokens: result.usage?.prompt_tokens || 0,
                completion_tokens: result.usage?.completion_tokens || 0,
                total_tokens: result.usage?.total_tokens || 0
            };
        } else {
            console.error('Unexpected API response:', result);
            throw new Error('Invalid response format from API');
        }

        // Ensure we have generated text
        if (!generatedText) {
            console.error('No text generated from API response:', result);
            throw new Error('No text was generated from the API response');
        }

        // Ensure the text ends with a complete sentence
        generatedText = ensureCompleteSentence(generatedText);

        // Count actual words
        const actualWords = generatedText.trim().split(/\s+/).length;

        // Add actualWords and tokensUsed to debugInfo
        debugInfo.actualWords = actualWords;
        debugInfo.tokensUsed = usage?.total_tokens || null;

        // Return success response with debug info
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                text: generatedText,
                model: modelName,
                userName: userName,
                mode: mode,
                contextProvided: !!contextString,
                previousChaptersProvided: !!previousChapters,
                usage: usage,
                requestedWords: desiredWords,
                actualWords: actualWords,
                actualTokens: usage?.total_tokens || null,
                debug: {
                    contextString,
                    previousChapters,
                    modelName,
                    mode,
                    requestedWords: desiredWords,
                    actualWords: actualWords,
                    tokensUsed: usage?.total_tokens || null,
                    rawResponse: process.env.NODE_ENV === 'development' ? result : null
                }
            })
        };

    } catch (error) {
        console.error('Error in generate-text:', error);
        
        // Provide more helpful error messages based on error type
        let errorMessage = error.message;
        let statusCode = 500;
        
        if (error.message.includes('timed out') || error.name === 'AbortError') {
            statusCode = 408; // Request Timeout
            errorMessage = `Request timed out after ${timeout/1000} seconds. For requests over 2000 words, try: 1. Use DeepSeek model (faster) 2. Reduce complexity in your prompt 3. Try generating in 2000-word chunks 4. Wait a moment and retry`;
        } else if (error.message.includes('API key')) {
            statusCode = 401; // Unauthorized
            errorMessage = 'API key error: ' + error.message;
        } else if (error.message.includes('status 429')) {
            statusCode = 429; // Too Many Requests
            errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
        } else if (error.message.includes('status 5')) {
            statusCode = 503; // Service Unavailable
            errorMessage = 'The AI service is currently unavailable. Please try again later.';
        }

        return {
            statusCode,
            headers,
            body: JSON.stringify({
                error: errorMessage,
                success: false,
                debug: {
                    error: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : null
                }
            })
        };
    }
}; 
