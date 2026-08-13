const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (prompt) =>
  new Promise((resolve) => {
    const ac = new AbortController();
    let answered = false;

    const timer = setTimeout(() => {
      if (answered) return;
      answered = true;
      ac.abort();
      console.log('\n⏳ Stall timeout reached.');
      resolve('Continue.');
    }, 2000);

    rl.question(prompt, { signal: ac.signal }, (answer) => {
      if (answered) return;
      answered = true;
      clearTimeout(timer);
      resolve(answer);
    });
  });

ask('Prompt: ').then((res) => {
  console.log('Got:', res);
  rl.close();
});
