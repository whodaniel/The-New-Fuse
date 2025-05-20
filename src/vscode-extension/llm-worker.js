// llm-worker.js - Worker thread for handling LLM requests
let isNode = false;
try {
  // Check if we're in a Node.js environment
  isNode = typeof process !== 'undefined' && 
           typeof process.versions !== 'undefined' && 
           typeof process.versions.node !== 'undefined';
} catch (e) {
  // Not in Node.js
}

// Setup the appropriate message handling based on environment
if (isNode) {
  const { parentPort } = require('worker_threads');
  
  // Listen for messages from the main thread
  parentPort.on('message', async (data) => {
    try {
      const result = await processRequest(data);
      parentPort.postMessage(result);
    } catch (error) {
      parentPort.postMessage({
        type: data.type,
        error: error.message,
        provider: data.provider?.provider,
        model: data.provider?.modelName
      });
    }
  });
} else {
  // Browser web worker environment
  self.onmessage = async (event) => {
    try {
      const result = await processRequest(event.data);
      self.postMessage(result);
    } catch (error) {
      self.postMessage({
        type: event.data.type,
        error: error.message,
        provider: event.data.provider?.provider,
        model: event.data.provider?.modelName
      });
    }
  };
}

/**
 * Process an LLM request
 */
async function processRequest(data) {
  // Add support for different request types similar to Copilot
  switch (data.type) {
    case 'completion':
      return processCompletionRequest(data);
    case 'inlineCompletion':
      return processInlineCompletionRequest(data);
    case 'panelCompletion':
      return processPanelCompletionRequest(data);
    case 'codeExplanation':
      return processCodeExplanationRequest(data);
    case 'refactoring':
      return processRefactoringRequest(data);
    default:
      throw new Error(`Unknown request type: ${data.type}`);
  }
}

/**
 * Process a completion request
 */
async function processCompletionRequest(data) {
  const { provider, prompt, options, cacheKey } = data;
  const startTime = Date.now();
  
  try {
    // Based on provider type, call the appropriate API
    let response;
    
    switch (provider.provider) {
      case 'openai':
        response = await callOpenAI(provider, prompt, options);
        break;
      case 'anthropic':
        response = await callAnthropic(provider, prompt, options);
        break;
      case 'vscode':
        response = await callVSCodeCopilot(provider, prompt, options);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider.provider}`);
    }
    
    return {
      type: 'completion',
      response,
      provider: provider.provider,
      model: provider.modelName,
      promptLength: prompt.length,
      latency: Date.now() - startTime,
      cacheKey,
      options
    };
  } catch (error) {
    const errorResponse = {
      type: 'completion',
      error: error.message,
      provider: provider.provider,
      model: provider.modelName,
      promptLength: prompt.length,
      latency: Date.now() - startTime,
      cacheKey
    };
    
    return errorResponse;
  }
}

/**
 * Process an inline completion request (similar to Copilot's ghost text)
 */
async function processInlineCompletionRequest(data) {
  const { provider, document, position, context, options, cacheKey } = data;
  const startTime = Date.now();
  
  try {
    // Based on provider type, call the appropriate API
    let completions;
    
    switch (provider.provider) {
      case 'openai':
        completions = await callOpenAIInlineCompletion(provider, document, position, context, options);
        break;
      case 'anthropic':
        completions = await callAnthropicInlineCompletion(provider, document, position, context, options);
        break;
      case 'vscode':
        completions = await callVSCodeCopilotInlineCompletion(provider, document, position, context, options);
        break;
      default:
        throw new Error(`Unsupported provider for inline completion: ${provider.provider}`);
    }
    
    return {
      type: 'inlineCompletion',
      completions,
      provider: provider.provider,
      model: provider.modelName,
      latency: Date.now() - startTime,
      cacheKey
    };
  } catch (error) {
    return {
      type: 'inlineCompletion',
      error: error.message,
      provider: provider.provider,
      model: provider.modelName,
      latency: Date.now() - startTime,
      cacheKey
    };
  }
}

/**
 * Process a panel completion request (similar to Copilot's panel suggestions)
 */
async function processPanelCompletionRequest(data) {
  const { provider, document, position, context, options, cacheKey } = data;
  const startTime = Date.now();
  
  try {
    // Get multiple solutions to display in a panel
    let solutions;
    
    switch (provider.provider) {
      case 'openai':
        solutions = await callOpenAIPanelCompletion(provider, document, position, context, options);
        break;
      case 'anthropic':
        solutions = await callAnthropicPanelCompletion(provider, document, position, context, options);
        break;
      case 'vscode':
        solutions = await callVSCodeCopilotPanelCompletion(provider, document, position, context, options);
        break;
      default:
        throw new Error(`Unsupported provider for panel completion: ${provider.provider}`);
    }
    
    return {
      type: 'panelCompletion',
      solutions,
      provider: provider.provider,
      model: provider.modelName,
      latency: Date.now() - startTime,
      cacheKey
    };
  } catch (error) {
    return {
      type: 'panelCompletion',
      error: error.message,
      provider: provider.provider,
      model: provider.modelName,
      latency: Date.now() - startTime,
      cacheKey
    };
  }
}

/**
 * Process a code explanation request
 */
async function processCodeExplanationRequest(data) {
  const { provider, code, language, options, cacheKey } = data;
  const startTime = Date.now();
  
  try {
    let explanation;
    
    switch (provider.provider) {
      case 'openai':
        explanation = await callOpenAIExplanation(provider, code, language, options);
        break;
      case 'anthropic':
        explanation = await callAnthropicExplanation(provider, code, language, options);
        break;
      case 'vscode':
        explanation = await callVSCodeCopilotExplanation(provider, code, language, options);
        break;
      default:
        throw new Error(`Unsupported provider for code explanation: ${provider.provider}`);
    }
    
    return {
      type: 'codeExplanation',
      explanation,
      provider: provider.provider,
      model: provider.modelName,
      latency: Date.now() - startTime,
      cacheKey
    };
  } catch (error) {
    return {
      type: 'codeExplanation',
      error: error.message,
      provider: provider.provider,
      model: provider.modelName,
      latency: Date.now() - startTime,
      cacheKey
    };
  }
}

/**
 * Process a refactoring request
 */
async function processRefactoringRequest(data) {
  const { provider, code, language, instructions, options, cacheKey } = data;
  const startTime = Date.now();
  
  try {
    let refactored;
    
    switch (provider.provider) {
      case 'openai':
        refactored = await callOpenAIRefactoring(provider, code, language, instructions, options);
        break;
      case 'anthropic':
        refactored = await callAnthropicRefactoring(provider, code, language, instructions, options);
        break;
      case 'vscode':
        refactored = await callVSCodeCopilotRefactoring(provider, code, language, instructions, options);
        break;
      default:
        throw new Error(`Unsupported provider for refactoring: ${provider.provider}`);
    }
    
    return {
      type: 'refactoring',
      refactored,
      provider: provider.provider,
      model: provider.modelName,
      latency: Date.now() - startTime,
      cacheKey
    };
  } catch (error) {
    return {
      type: 'refactoring',
      error: error.message,
      provider: provider.provider,
      model: provider.modelName,
      latency: Date.now() - startTime,
      cacheKey
    };
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(provider, prompt, options) {
  // In a real implementation, this would call the OpenAI API
  // For now, it's a mock implementation
  await simulateAPILatency(800);

  return {
    text: `[Worker] OpenAI ${provider.modelName} response to: "${prompt.substring(0, 30)}..."`,
    provider: 'openai',
    model: provider.modelName
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(provider, prompt, options) {
  // In a real implementation, this would call the Anthropic API
  // For now, it's a mock implementation
  await simulateAPILatency(1000);

  return {
    text: `[Worker] Anthropic ${provider.modelName} response to: "${prompt.substring(0, 30)}..."`,
    provider: 'anthropic',
    model: provider.modelName
  };
}

/**
 * Call VSCode Copilot API (if available through the extension)
 */
async function callVSCodeCopilot(provider, prompt, options) {
  // This would attempt to use the installed Copilot extension if available
  await simulateAPILatency(600);
  
  return {
    text: `[Worker] VSCode Copilot ${provider.modelName || 'default'} response to: "${prompt.substring(0, 30)}..."`,
    provider: 'vscode',
    model: provider.modelName || 'copilot'
  };
}

/**
 * Call OpenAI for inline completions
 */
async function callOpenAIInlineCompletion(provider, document, position, context, options) {
  await simulateAPILatency(300);
  
  // Generate mock inline completions
  return [
    {
      text: 'console.log("OpenAI inline completion");',
      range: { startLine: position.line, startCharacter: position.character, endLine: position.line, endCharacter: position.character + 10 }
    }
  ];
}

/**
 * Call Anthropic for inline completions
 */
async function callAnthropicInlineCompletion(provider, document, position, context, options) {
  await simulateAPILatency(350);
  
  // Generate mock inline completions
  return [
    {
      text: 'console.log("Anthropic inline completion");',
      range: { startLine: position.line, startCharacter: position.character, endLine: position.line, endCharacter: position.character + 10 }
    }
  ];
}

/**
 * Call VSCode Copilot for inline completions
 */
async function callVSCodeCopilotInlineCompletion(provider, document, position, context, options) {
  await simulateAPILatency(250);
  
  // Generate mock inline completions (would use actual Copilot extension if available)
  return [
    {
      text: 'console.log("Copilot inline completion");',
      range: { startLine: position.line, startCharacter: position.character, endLine: position.line, endCharacter: position.character + 10 }
    }
  ];
}

/**
 * Call OpenAI for panel completions
 */
async function callOpenAIPanelCompletion(provider, document, position, context, options) {
  await simulateAPILatency(800);
  
  // Generate multiple mock solutions
  return [
    { 
      code: 'function example1() {\n  console.log("OpenAI example 1");\n  return true;\n}', 
      score: 0.95
    },
    { 
      code: 'function example2() {\n  console.log("OpenAI example 2");\n  return false;\n}',
      score: 0.85
    },
    { 
      code: 'async function example3() {\n  console.log("OpenAI example 3");\n  return Promise.resolve();\n}',
      score: 0.75
    }
  ];
}

/**
 * Call Anthropic for panel completions
 */
async function callAnthropicPanelCompletion(provider, document, position, context, options) {
  await simulateAPILatency(900);
  
  // Generate multiple mock solutions
  return [
    { 
      code: 'function example1() {\n  console.log("Anthropic example 1");\n  return true;\n}', 
      score: 0.92
    },
    { 
      code: 'function example2() {\n  console.log("Anthropic example 2");\n  return false;\n}',
      score: 0.82
    },
    { 
      code: 'async function example3() {\n  console.log("Anthropic example 3");\n  return Promise.resolve();\n}',
      score: 0.72
    }
  ];
}

/**
 * Call VSCode Copilot for panel completions
 */
async function callVSCodeCopilotPanelCompletion(provider, document, position, context, options) {
  await simulateAPILatency(700);
  
  // Generate multiple mock solutions (would use actual Copilot extension if available)
  return [
    { 
      code: 'function example1() {\n  console.log("Copilot example 1");\n  return true;\n}', 
      score: 0.98
    },
    { 
      code: 'function example2() {\n  console.log("Copilot example 2");\n  return false;\n}',
      score: 0.88
    },
    { 
      code: 'async function example3() {\n  console.log("Copilot example 3");\n  return Promise.resolve();\n}',
      score: 0.78
    }
  ];
}

/**
 * Call OpenAI for code explanation
 */
async function callOpenAIExplanation(provider, code, language, options) {
  await simulateAPILatency(1000);
  
  return {
    explanation: `This code is a ${language} function that does something interesting. It works by...`,
    sections: [
      { title: "Purpose", content: "This function serves to..." },
      { title: "Implementation", content: "The implementation uses..." },
      { title: "Tips", content: "Consider refactoring..." }
    ]
  };
}

/**
 * Call Anthropic for code explanation
 */
async function callAnthropicExplanation(provider, code, language, options) {
  await simulateAPILatency(1100);
  
  return {
    explanation: `This ${language} code implements a function that does something useful. The approach taken is...`,
    sections: [
      { title: "Overview", content: "This code is designed to..." },
      { title: "Key Points", content: "Notice how it handles..." },
      { title: "Improvements", content: "You might consider..." }
    ]
  };
}

/**
 * Call VSCode Copilot for code explanation
 */
async function callVSCodeCopilotExplanation(provider, code, language, options) {
  await simulateAPILatency(900);
  
  return {
    explanation: `This is a ${language} implementation that accomplishes a specific task. Let me break it down...`,
    sections: [
      { title: "Summary", content: "This code helps with..." },
      { title: "Details", content: "The interesting parts are..." },
      { title: "Suggestions", content: "You could improve this by..." }
    ]
  };
}

/**
 * Call OpenAI for code refactoring
 */
async function callOpenAIRefactoring(provider, code, language, instructions, options) {
  await simulateAPILatency(1200);
  
  return {
    code: `// Refactored with OpenAI based on: ${instructions.substring(0, 30)}...\n${code.replace('function', 'async function')}`,
    explanation: "I've made the function async to improve performance and readability."
  };
}

/**
 * Call Anthropic for code refactoring
 */
async function callAnthropicRefactoring(provider, code, language, instructions, options) {
  await simulateAPILatency(1300);
  
  return {
    code: `// Refactored with Anthropic based on: ${instructions.substring(0, 30)}...\n${code.replace('function', 'function* ')}`,
    explanation: "I've converted this to a generator function to enable better iteration."
  };
}

/**
 * Call VSCode Copilot for code refactoring
 */
async function callVSCodeCopilotRefactoring(provider, code, language, instructions, options) {
  await simulateAPILatency(1000);
  
  return {
    code: `// Refactored with Copilot based on: ${instructions.substring(0, 30)}...\n${code.replace('function', 'const myFunction = () =>')}`,
    explanation: "I've converted this to an arrow function for more modern syntax."
  };
}

/**
 * Simulate API latency for demonstration purposes
 */
function simulateAPILatency(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}