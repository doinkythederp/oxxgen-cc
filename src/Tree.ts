/**
 * Represents the type of a node in the syntax tree
 */
export enum NodeType {
  TEXT_LITERAL,

  TAG,
  COMMENT_TAG,
  VARIABLE_DECLARATION_TAG,

  SINGLE_QUOTE_STRING,
  DOUBLE_QUOTE_STRING,
  TEMPLATE_STRING,
}

/**
 * Represents a node in the syntax tree
 */
export abstract class BaseNode {
  constructor(parent?: BaseNode | null, data: Partial<BaseNode> = {}) {
    this.parent = parent ?? null;
    Object.assign(this, data);
  }

  abstract readonly type: NodeType;

  /**
   * The parent of the node in the syntax tree (`null` for the root node)
   */
  readonly parent: BaseNode | null;

  /**
   * The text length of the node in the source code
   */
  textLength: number = 0;
}

export interface TextNode {
  /** The text content of the node */
  content: string;
}

/**
 * A node representing partial text inside a template string
 */
export class TextLiteralNode extends BaseNode implements TextNode {
  constructor(parent?: BaseNode | null, data: Partial<TextLiteralNode> = {}) {
    super(parent, data);
    this.content = data.content ?? "";
  }

  readonly type = NodeType.TEXT_LITERAL;

  /**
   * The text content of the node
   */
  content: string;
}

/**
 * A node representing a tag
 */
export class TagNode extends BaseNode {
  constructor(parent?: BaseNode | null, data: Partial<TagNode> = {}) {
    super(parent, data);
    this.method = data.method ?? "";
    this.children = data.children ?? [];
  }

  readonly type = NodeType.TAG;

  /**
   * The method called by the tag
   */
  method: string;

  /**
   * The arguments provided to the tag
   */
  children: Array<BaseNode>;
}

/**
 * A node representing a comment
 */
export class CommentTagNode extends BaseNode {
  constructor(parent?: BaseNode | null, data: Partial<CommentTagNode> = {}) {
    super(parent, data);
    this.commentText = data.commentText ?? "";
  }

  readonly type = NodeType.COMMENT_TAG;

  /**
   * The text content of the comment
   */
  commentText: string;
}

/**
 * A node representing a string created with single quotes (`'...'`)
 */
export class SingleQuoteStringNode extends BaseNode implements TextNode {
  constructor(
    parent?: BaseNode | null,
    data: Partial<SingleQuoteStringNode> = {}
  ) {
    super(parent, data);
    this.content = data.content ?? "";
  }

  readonly type = NodeType.SINGLE_QUOTE_STRING;

  /**
   * The text content of the string
   */
  content: string;
}

/**
 * A node representing a string created with double quotes (`"..."`)
 */
export class DoubleQuoteStringNode extends BaseNode implements TextNode {
  constructor(
    parent?: BaseNode | null,
    data: Partial<DoubleQuoteStringNode> = {}
  ) {
    super(parent, data);
    this.content = data.content ?? "";
  }

  readonly type = NodeType.DOUBLE_QUOTE_STRING;

  /**
   * The text content of the string
   */
  content: string;
}

/**
 * A node representing a template string
 */
export class TemplateStringNode extends BaseNode {
  constructor(
    parent?: BaseNode | null,
    data: Partial<TemplateStringNode> = {}
  ) {
    super(parent, data);
    this.children = data.children ?? [];
  }

  readonly type = NodeType.TEMPLATE_STRING;

  /**
   * The content of the template string
   */
  children: Array<
    TextLiteralNode | TagNode | CommentTagNode | VariableDeclarationTagNode
  >;
}

/**
 * A node representing a variable declaration
 */
export class VariableDeclarationTagNode extends BaseNode {
  constructor(
    parent?: BaseNode | null,
    data: Partial<VariableDeclarationTagNode> = {}
  ) {
    super(parent, data);
    this.name = data.name ?? "";
    this.data = data.data ?? null;
  }

  readonly type = NodeType.VARIABLE_DECLARATION_TAG;

  /**
   * The name of the variable
   */
  name: string;

  /**
   * The content of the variable
   */
  data: BaseNode | null;
}
