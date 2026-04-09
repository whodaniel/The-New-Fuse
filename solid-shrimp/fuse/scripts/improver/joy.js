// The "Joy and Value" script
const quotes = [
  'Creativity is intelligence having fun. — Albert Einstein',
  'The best way to predict the future is to create it. — Peter Drucker',
  'Code is poetry. — Anonymous',
  'Build what you love. — TNF',
  'Every expert was once a beginner. — Helen Hayes',
  'Simplicity is the ultimate sophistication. — Leonardo da Vinci',
  'Stay hungry, stay foolish. — Steve Jobs',
];

const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
console.log('\n🌟 TNF Joy & Value 🌟\n');
console.log(`"${randomQuote}"`);
console.log('\nKeep building amazing things!\n');
