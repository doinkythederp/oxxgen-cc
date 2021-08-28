import { Interpreter, InterpreterOptions, InterpreterState, Tokens, SyntaxError } from "../Interpreter";
import * as Tree from "../Tree";
import { interpretTag } from "./Tag";

interface TemplateStringInterpreterState extends InterpreterState {
  /** Whether or not the string has been closed */
  isClosed: boolean;
  /** Whether or not the next character in the string is escaped */
  nextIsEscaped: boolean;
}

export function interpretTemplateString(
  data: string,
  options: InterpreterOptions,
  parent?: Tree.BaseNode | null
): Tree.TemplateStringNode {
  // Trim starting backtick
  if (parent) data = data.substr(1);

  const node = new Interpreter<TemplateStringInterpreterState, Tree.TemplateStringNode>(
    { i: 0, isClosed: false, nextIsEscaped: false },
    new Tree.TemplateStringNode(parent)
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
    // Handles tags and comment tags
    .use((current, state, node) => {
      if (current === Tokens.TAG_START && !state.nextIsEscaped) {

        const child = interpretTag(data.substr(state.i), {
          fullSourceCode: options.fullSourceCode,
          globalIndex: options.globalIndex + state.i + 1
        }, node);
        node.children.push(child);

        node.textLength += child.textLength;
        state.i += child.textLength;
        return true;
      }
    })
    // Handles end of the string
    .use((current, state, node) => {
      if (current === Tokens.TEMPLATE_STRING_END && node.parent && !state.nextIsEscaped) {
        state.isClosed = true;
        state.finished = true;

        state.i++;
        node.textLength++;
        return true;
      }
    })
    // Handles normal characters
    .use((current, state, node) => {
      let lastNode = node.children[node.children.length - 1];
      // Add a text literal if it isn't already there
      if (lastNode?.type !== Tree.NodeType.TEXT_LITERAL)
        node.children.push(lastNode = new Tree.TextLiteralNode(node));

      // Add the current letter
      lastNode.content += state.nextIsEscaped ? Tokens.ESCAPE + current : current;

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
