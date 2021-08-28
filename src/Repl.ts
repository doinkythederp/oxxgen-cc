import { ReadLine, createInterface } from 'readline';
import { TypedEventEmitter } from './TypedEventEmitter';

export interface ReplOptions {
  /** Defaults to `process.stdin` */
  input?: NodeJS.ReadStream;

  /** Defaults to `process.stdout` */
  output?: NodeJS.WriteStream;

  /** Defaults to `"> "` */
  prompt?: string;
}

export interface ReplEvents {
  open: () => void;
  close: () => void;
  : () => void;
}

export class Repl extends TypedEventEmitter<ReplEvents> {
  constructor(options: ReplOptions = {}) {
    super();
    this.options = Object.assign({}, Repl.defaultOptions, options);
  }

  /** Opens the repl interface */
  open(): this {
    if (this.rl) return this;
    this.rl = createInterface(this.options)
      .on('line', (input) => {

      });
    this.rl.prompt();

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
    prompt: '> '
  }

  private rl: ReadLine | null = null;
  readonly options: Required<ReplOptions>;
}