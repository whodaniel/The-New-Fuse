console.log('Running with execPath:', process.execPath);
const electron = require('electron');
console.log('Type of electron module:', typeof electron);
console.log('Electron module content:', electron);
if (typeof electron === 'string') {
  console.log('It is a string! This means we are running in Node, not Electron.');
} else {
  console.log('It is an object (hopefully). app is:', electron.app);
}
