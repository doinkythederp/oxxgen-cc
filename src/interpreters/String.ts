import { Interpreter, InterpreterOptions, InterpreterState, Tokens, SyntaxError } from "../Interpreter";
import * as Tree from "../Tree";

interface StringInterpreterState extends InterpreterState {
  /** Whether or not the string has been closed */
  isClosed: boolean;
  /** Whether or not the next character in the string is escaped */
  nextIsEscaped: boolean;
}

export function interpretString(
  data: string,
  options: InterpreterOptions,
  parent: Tree.BaseNode | null
): Tree.SingleQuoteStringNode | Tree.DoubleQuoteStringNode {
  const NodeClass = data[0] === Tokens.SINGLE_QUOTE_STRING_START ? Tree.SingleQuoteStringNode : Tree.DoubleQuoteStringNode;

  // Trim starting quote
  data = data.substr(1);

  const node = new Interpreter<StringInterpreterState, Tree.SingleQuoteStringNode | Tree.DoubleQuoteStringNode>(
    { i: 0, isClosed: false, nextIsEscaped: false },
    new NodeClass(parent)
  )
    // Handles backslash escapes
    .use((current, state, node) => {
      state.nextIsEscaped = false;
      if (current === Tokens.ESCAPE) {
        state.nextIsEscaped = true;

        node.textLength++;
        state.i++;
        return true;
      }
    })
    // Handles end of the string
    .use((current, state, node) => {
      if (current === (node.type === Tree.NodeType.SINGLE_QUOTE_STRING ? Tokens.SINGLE_QUOTE_STRING_END : Tokens.DOUBLE_QUOTE_STRING_END) && node.parent && !state.nextIsEscaped) {
        state.isClosed = true;
        state.finished = true;

        state.i++;
        node.textLength++;
        return true;
      }
    })
    // Handles normal characters
    .use((current, state, node) => {
      // Add the current letter
      node.content += state.nextIsEscaped ? Tokens.ESCAPE + current : current;

      state.i++;
      node.textLength++;
      return true;
    })
    .end((state, node) => {
      if (!state.isClosed && node.parent) throw new SyntaxError('Unexpected end of input', {
        index: options.globalIndex + state.i - 1,
        sourceCode: options.fullSourceCode
      });
    })
    .run(data);

  // account for start backtick
  if (parent) node.textLength++;
  return node;
}
