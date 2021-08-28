import { Interpreter, InterpreterState, Tokens, InterpreterOptions, SyntaxError } from '../Interpreter';
import * as Tree from '../Tree';
import { interpretTemplateString } from './TemplateString';
import { interpretString } from './String';

interface TagInterpreterState extends InterpreterState {
  /** Whether or not the tag has been closed */
  isClosed: boolean;
  /** The argument currently being interpreted */
  argState: number;
}

/**
 * Interprets tags, comment tags, and variable declaration tags
 */
export function interpretTag(
  data: string,
  options: InterpreterOptions = { fullSourceCode: data, globalIndex: 0 },
  parent?: Tree.BaseNode | null
): Tree.TagNode | Tree.CommentTagNode | Tree.VariableDeclarationTagNode {
  // Trim starting curly bracket
  if (parent) data = data.substr(1);

  const node = new Interpreter<
    TagInterpreterState,
    Tree.TagNode | Tree.CommentTagNode | Tree.VariableDeclarationTagNode
  >({ i: 0, isClosed: false, argState: 0 }, new Tree.TagNode(parent))
    // Handles end of the tag
    .use((current, state, node) => {
      if (current === Tokens.TAG_END && node.parent) {
        if (node.type === Tree.NodeType.TAG && !node.method)
          throw new SyntaxError('Expression expected', {
            index: options.globalIndex + state.i,
            sourceCode: options.fullSourceCode
          });
        state.isClosed = true;
        state.finished = true;

        state.i++;
        node.textLength++;
        return true;
      }
    })
    // Handles comment tags
    .use(function (current, state, node) {
      // If the current is the comment marker and it is the first letter
      if (current === Tokens.COMMENT_TAG && state.i === 0) {
        this.node = new Tree.CommentTagNode(node.parent, {
          textLength: node.textLength
        });

        state.i++;
        this.node.textLength++;
        return true;
      }
      // If it is a comment tag
      if (node.type === Tree.NodeType.COMMENT_TAG) {
        node.commentText += current;

        state.i++;
        node.textLength++;
        return true;
      }
    })
    // Handles converting to variable declaration
    .use(function (current, state, node) {
      // If the node is not a tag, or the letter is not an "="
      if (
        node.type !== Tree.NodeType.TAG ||
        current !== Tokens.ASSIGNMENT_OPERATOR
      )
        return;

      // If we've already started parsing args
      if (node.children.length) throw new SyntaxError('Unexpected token', {
        index: options.globalIndex + state.i,
        sourceCode: options.fullSourceCode
      });

        this.node = new Tree.VariableDeclarationTagNode(node.parent, {
          name: node.method,
          textLength: node.textLength
        });

        state.argState = 1;
        this.node.textLength++;
        state.i++;
        return true;
    })
    // Handles tag methods
    .use((current, state, node) => {
      // Only apply to basic tags
      if (node.type !== Tree.NodeType.TAG) return;

      // If we are parsing the method
      if (state.argState === 0) {
        // If the current is a space or newline, and a method has been set
        if (
          (current === Tokens.SEPERATOR || current === Tokens.NEWLINE)
        ) {
          if (node.method)
            state.argState++;

          node.textLength++;
          state.i++;
          return true;
        }

        // If the current is not a space or newline
        if (current !== Tokens.SEPERATOR && current !== Tokens.NEWLINE) {
          // If it doesn't match the method name regex
          if (!/[\$_A-Za-z]/.test(current))
            throw new SyntaxError('Invalid method or variable name', {
              index: options.globalIndex + state.i,
              sourceCode: options.fullSourceCode
            });

          node.method += current;

          node.textLength++;
          state.i++;
          return true;
        }
      }
    })
    // Handles seperating args
    .use(function (current, state, node) {
      // If we are not parsing the method/variable name
      if (state.argState > 0) {
        // If the current is a space or newline
        if (current === Tokens.SEPERATOR || current === Tokens.NEWLINE) {
          if (
            node.type === Tree.NodeType.TAG &&
            node.children[state.argState - 1]
          )
            state.argState++;

          node.textLength++;
          state.i++;
          return true;
        }
      }
    })
    // Handles variable declarations and args
    .use((current, state, node) => {
      // Only allow variable declarations and basic tags
      if (node.type === Tree.NodeType.COMMENT_TAG) return;

      // If the current is not a space or newline
      if (current !== Tokens.SEPERATOR && current !== Tokens.NEWLINE) {
        // Only allows 1 arg if it is a variable declaration
        if (
          node.type === Tree.NodeType.VARIABLE_DECLARATION_TAG &&
          state.argState > 1
        )
          throw new SyntaxError('Unexpected token', {
            index: options.globalIndex + state.i,
            sourceCode: options.fullSourceCode
          });

        let interpret: (
          data: string,
          options: InterpreterOptions,
          parent: Tree.BaseNode | null
        ) => Tree.BaseNode;

        switch (current) {
          case Tokens.TAG_START:
            interpret = interpretTag;
            break;

          case Tokens.TEMPLATE_STRING_START:
            interpret = interpretTemplateString;
            break;

          case Tokens.SINGLE_QUOTE_STRING_START:
            interpret = interpretString;
            break;

          case Tokens.DOUBLE_QUOTE_STRING_START:
            interpret = interpretString;
            break;

          default:
            throw new SyntaxError(
              'Invalid token - expected a tag, string, or template string', {
                index: options.globalIndex + state.i,
                sourceCode: options.fullSourceCode
              });
        }

        const child = interpret(data.substr(state.i), {
          fullSourceCode: options.fullSourceCode,
          globalIndex: options.globalIndex + state.i + 1
        }, node);
        if (node.type === Tree.NodeType.VARIABLE_DECLARATION_TAG)
          node.data = child;
        else node.children.push(child);

        node.textLength += child.textLength;
        state.i += child.textLength;
        return true;
      }
    })
    .end((state, node) => {
      if (
        (!state.isClosed && node.parent) ||
        (node.type === Tree.NodeType.VARIABLE_DECLARATION_TAG && !node.data)
      )
        throw new SyntaxError('Unexpected end of input', {
          index: options.globalIndex + state.i - 1,
          sourceCode: options.fullSourceCode
        });
    })
    .run(data);

  if (parent) node.textLength++;
  return node;
}
