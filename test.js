const { Repl } = require('.');
const repl = new Repl();
repl.open();

process.once('SIGINT', () => {
  repl.close();
  process.exit();
});
