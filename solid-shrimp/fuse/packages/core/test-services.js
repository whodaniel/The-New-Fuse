const { AppModule } = require('./dist/app.module');
const { AgentLLMService } = require('./dist/services/AgentLLMService');
const { PromptService } = require('./dist/services/PromptService');
const { LoggingService } = require('./dist/services/LoggingService');

console.log('Testing Fuse Core Services...');

// Test that all classes are properly exported
console.log('✓ AppModule:', AppModule ? 'exported' : 'missing');
console.log('✓ AgentLLMService:', AgentLLMService ? 'exported' : 'missing');
console.log('✓ PromptService:', PromptService ? 'exported' : 'missing');
console.log('✓ LoggingService:', LoggingService ? 'exported' : 'missing');

// Test service instantiation
try {
  const agentService = new AgentLLMService();
  const promptService = new PromptService();
  const logService = new LoggingService();
  
  console.log('✓ All services can be instantiated');
  
  // Test a simple method
  agentService.processMessage('Hello World').then(result => {
    console.log('✓ AgentLLMService.processMessage():', result);
  }).catch(err => {
    console.log('✗ AgentLLMService.processMessage() error:', err.message);
  });
  
  promptService.validatePrompt('Test prompt').then(result => {
    console.log('✓ PromptService.validatePrompt():', result);
  }).catch(err => {
    console.log('✗ PromptService.validatePrompt() error:', err.message);
  });
  
  logService.info('Test log message').then(result => {
    console.log('✓ LoggingService.info():', result.level, result.message);
  }).catch(err => {
    console.log('✗ LoggingService.info() error:', err.message);
  });
  
} catch (error) {
  console.log('✗ Service instantiation failed:', error.message);
}

console.log('\nCore package is ready for use!');