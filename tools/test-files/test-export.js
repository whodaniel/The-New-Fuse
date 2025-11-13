// Test file to verify exports from prompt-templating package
const exports = require('./packages/prompt-templating/dist/index.js');

console.log('Available exports:', Object.keys(exports));
console.log('PromptTemplateServiceImpl:', exports.PromptTemplateServiceImpl);
console.log('ModularPromptTemplatingSystem:', exports.ModularPromptTemplatingSystem);
console.log('PromptTemplateNode:', exports.PromptTemplateNode);