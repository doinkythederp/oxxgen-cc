import { ReadLine, createInterface } from 'readline';
import { interpretTemplateString } from './interpreters/TemplateString';
import { Runtime, ContextData } from './Runtime';

export interface ReplOptions {
  /** Defaults to `process.stdin` */
  input?: NodeJS.ReadStream;

  /** Defaults to `process.stdout` */
  output?: NodeJS.WriteStream;

  /** Defaults to `"> "` */
  prompt?: string;

  /** Defaults to an empty object */
  context?: ContextData;
}

export class Repl {
  constructor(options: ReplOptions = {}) {
    this.options = Object.assign({}, Repl.defaultOptions, options);
  }

  /** Opens the repl interface */
  open(): this {
    if (this.rl) return this;
    const rl = createInterface(this.options)
      .on('line', async (input) => {
        try {
          const compiled = interpretTemplateString(input, { fullSourceCode: input, globalIndex: 0 });
          const runtime = new Runtime(compiled, { context: this.options.context });
          console.log(runtime.start());
        } catch(err) {
          console.log(err?.stack ?? err);
        }

        rl.prompt();
      });
    rl.prompt();

    this.rl = rl;
    return this;
  }

  /** Closes the repl interface */
  close(): this {
    if (!this.rl) return this;
    this.rl.close();
    this.rl = null;
    return this;
  }

  static defaultOptions: Required<ReplOptions> = {
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    context: {}
  }

  rl: ReadLine | null = null;
  readonly options: Required<ReplOptions>;
}