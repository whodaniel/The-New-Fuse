const pkg = require('./packages/prompt-templating/dist/index.js');

console.log('Available exports:');
console.log(Object.keys(pkg));

console.log('\nDefault export:');
console.log(pkg.default);

console.log('\nModularPromptTemplatingSystem:');
console.log(pkg.ModularPromptTemplatingSystem);

console.log('\nPromptTemplateServiceImpl:');
console.log(pkg.PromptTemplateServiceImpl);

console.log('\nPromptTemplateNode:');
console.log(pkg.PromptTemplateNode);