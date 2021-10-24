import { Command } from 'commander';
import { Repl } from './Repl';
import { interpretTemplateString } from './interpreters/TemplateString';
import { Runtime } from './Runtime';
import { readFile } from 'fs/promises';

const program = new Command('occ')
  .argument('[file]', 'Runs the template in the specified file')
  .option('-e, --eval <code>', 'Runs the template passed to the option')
  .action(async (fileName: string | undefined, options: Record<string, string | undefined>) => {
    if (fileName) {
      try {
        const file = await readFile(fileName, 'utf8');
        process.stdout.write(runTemplate(file));
      } catch(err: any) {
        console.error(err?.stack ?? err);
      }
    } else if (options.eval) {
      try {
        console.log(runTemplate(options.eval));
      } catch(err: any) {
        console.error(err?.stack ?? err);
      }
    } else {
      const repl = new Repl();
      process.once('SIGINT', () => {
        repl.close();
        process.exit();
      });

      repl.open();
    }
  });

program.parse(process.argv);

function runTemplate(code: string): string {
  const compiled = interpretTemplateString(code, { fullSourceCode: code, globalIndex: 0 });
  const runtime = new Runtime(compiled);
  return runtime.start();
}
