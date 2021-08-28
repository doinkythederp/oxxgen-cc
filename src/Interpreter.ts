import * as Tree from "./Tree";

export enum Tokens {
  ESCAPE = "\\",

  TEMPLATE_STRING_START = "`",
  TEMPLATE_STRING_END = "`",
  SINGLE_QUOTE_STRING_START = "'",
  SINGLE_QUOTE_STRING_END = "'",
  DOUBLE_QUOTE_STRING_START = '"',
  DOUBLE_QUOTE_STRING_END = '"',

  TAG_START = "{",
  TAG_END = "}",
  COMMENT_TAG = "!",

  SEPERATOR = " ",
  NEWLINE = "\n",

  ASSIGNMENT_OPERATOR = "="
}

export interface InterpreterOptions {
  /** The full source code, used to help generate errors */
  fullSourceCode: string;
  /** The actual index, used to help generate errors */
  globalIndex: number;
}

export interface InterpreterState {
  /** The index of the interpreter */
  i: number;
  /** The interpreter has finished */
  finished?: boolean;
}

export class SyntaxError extends globalThis.SyntaxError {
  constructor(message: string, data: { index: number; sourceCode: string; }) {
    super(message);
    const trace = SyntaxError.createTrace(data.sourceCode, data.index);
    this.stack = `${this.name}: ${this.message}\n${trace}`;
  }

  private static createTrace(sourceCode: string, index: number) {
    let row = 0, col = 0, i = 0;
    let splitByNewlines = sourceCode.split('\n');
    let textColumn = splitByNewlines[0];

    for (const letter of sourceCode) {
      if (i === index) return SyntaxError.focusOnRow(textColumn, row);

      if (letter === '\n') {
        row = 0;
        col++;
        textColumn = splitByNewlines[col];
      }

      row++;
      i++;
    }

    throw new globalThis.SyntaxError('Invalid index')
  }

  private static focusOnRow(line: string, row: number) {
    let before = '', after = '', i = 0, hitRow = false;

    for (const letter of line) {
      if (row === i && !hitRow) hitRow = true;

      if (hitRow) after += letter;
      else before += letter;

      i++;
    }

    if (before.length > 18) before = '...' + before.substr(-15);
    if (after.length > 19) after = after.substr(0, 16) + '...';

    return before + after + '\n' + ' '.repeat(before.length) + '^';
  }
}

export class Interpreter<
  StateType extends InterpreterState = InterpreterState,
  NodeType extends Tree.BaseNode = Tree.BaseNode
> {
  constructor(initialState: StateType, node: NodeType) {
    initialState.finished = false;
    this.state = initialState;
    this.node = node;
  }

  /**
   * Adds a letter handler to the interpreter
   * @param handler The handler function - return `true` to stop calling handlers
   */
  use(handler: InterpreterLetterHandler<this, StateType, NodeType>): this {
    this.handlers.push(handler);
    return this;
  }

  /**
   * Adds an end handler to the interpreter, which is called when either `state.finished` is `true`, or there are no more letters
   * @param handler The handler function - return `true` to stop calling end handlers
   */
  end(handler: InterpreterEndHandler<this, StateType, NodeType>): this {
    this.endHandlers.unshift(handler);
    return this;
  }

  /**
   * Calls the handlers and returns the node
   * @param data The data containing the letters
   */
  run(data: string): NodeType {
    while (true) {
      if (!data[this.state.i]) break;
      if (this.state.finished) break;

      for (const handler of this.handlers) {
        let handlerHit =
          handler.call(this, data[this.state.i], this.state, this.node) ??
          false;
        if (handlerHit) break;
      }
    }

    for (const handler of this.endHandlers) {
      let handlerHit = handler.call(this, this.state, this.node) ?? false;
      if (handlerHit) break;
    }

    return this.node;
  }

  state: StateType;
  node: NodeType;

  protected handlers: InterpreterLetterHandler<this, StateType, NodeType>[] = [];
  protected endHandlers: InterpreterEndHandler<this, StateType, NodeType>[] = [];
}

type InterpreterLetterHandler<
  thisValue,
  StateType extends InterpreterState,
  NodeType extends Tree.BaseNode
> = (this: thisValue, current: string, state: StateType, node: NodeType) => boolean | void;
type InterpreterEndHandler<
  thisValue,
  StateType extends InterpreterState,
  NodeType extends Tree.BaseNode
> = (this: thisValue, state: StateType, node: NodeType) => boolean | void;
