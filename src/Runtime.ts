import * as Tree from './Tree';

type Node = Tree.TextLiteralNode | Tree.SingleQuoteStringNode | Tree.DoubleQuoteStringNode | Tree.CommentTagNode | Tree.TemplateStringNode | Tree.VariableDeclarationTagNode | Tree.TagNode;
export type TagHandler = (context: Context, ...args: string[]) => string;
export type Context = Map<string, TagHandler>;
export type ContextData = { [tagName: string]: TagHandler };

export interface RuntimeOptions {
  /** Tag methods to include */
  context?: ContextData;

  /** Maximum execution time before cancelling */
  timeout?: number;
}

export namespace BuiltInTags {
  /** Joins strings together with the specified seperator */
  export function join(_context: Context, seperator?: string, ...args: string[]): string {
    if (!seperator) throw new TypeError('Must provide a seperator');
    return args.join(seperator);
  }
  
  /** Returns a random argument */
  export function random(_context: Context, ...args: string[]): string {
    if (!args.length) throw new TypeError('Must provide arguments to choose from');
    return args[Math.floor(Math.random() * args.length)];
  }
  
  /** Returns a random number */
  export function randomNumber(_context: Context, from?: string, to?: string): string {
    if (from !== undefined && to === undefined) throw new TypeError('If a "from" argument is provided, a "to" one must be as well.');

    let [fromNum, toNum] = (from !== undefined && to !== undefined) ? [parseFloat(from), parseFloat(to)] : [0, 99];
    if (fromNum > toNum) throw new RangeError('"to" argument cannot be larger than "from" argument')

    return (fromNum + Math.floor(Math.random() * (toNum - fromNum))).toString();
  }
}

export class Runtime {
  constructor(public readonly tree: Node, options: RuntimeOptions = {}) {
    if (!options.context) options.context = {};
    this.timeout = options.timeout ?? Infinity;

    this.context = new Map(Object.entries(Object.assign(options.context, BuiltInTags)));
  }

  start() {
    let cancelDate = Date.now() + this.timeout;

    return this.runNode(this.tree, cancelDate);
  }

  protected runNode(node: Node, cancelDate: number): string {
    this.checkCancelNeeded(cancelDate);
    switch (node.type) {
      case Tree.NodeType.VARIABLE_DECLARATION_TAG:
        this.context.set(node.name, this.createContextMethod(node.data as Node, cancelDate));
      case Tree.NodeType.COMMENT_TAG:
        return '';

      case Tree.NodeType.DOUBLE_QUOTE_STRING:
      case Tree.NodeType.SINGLE_QUOTE_STRING:
      case Tree.NodeType.TEXT_LITERAL:
        return node.content;

      case Tree.NodeType.TEMPLATE_STRING:
        return node.children.map((node) => this.runNode(node, cancelDate)).join('');
    
      case Tree.NodeType.TAG:
        let method = this.context.get(node.method);
        if (!method) throw new ReferenceError(node.method + ' is not defined');
        let result = String(method(this.context, ...node.children.map((node) => this.runNode(node as Node, cancelDate))));
        this.checkCancelNeeded(cancelDate);
        return result;

      default:
        throw new TypeError('Unknown node type!')
    }
  }

  protected createContextMethod(node: Node, cancelDate: number) {
    let data = this.runNode(node, cancelDate);
    return () => data;
  }

  private checkCancelNeeded(date: number) {
    if (Date.now() > date) throw new Error('Script execution timed out after ' + this.timeout + 'ms');
  }

  context: Context = new Map();
  timeout: number;
}