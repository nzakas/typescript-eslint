import * as ts from 'typescript';

import type { TSESTree } from './ts-estree';

import { getModifiers } from './getModifiers';
import { xhtmlEntities } from './jsx/xhtml-entities';
import * as tsEstree from './ts-estree';
import { typescriptVersionIsAtLeast } from './version-check';

// Read once: the compiled re-exports are getters, and these are used for every token.
import AST_NODE_TYPES = tsEstree.AST_NODE_TYPES;
import AST_TOKEN_TYPES = tsEstree.AST_TOKEN_TYPES;

const isAtLeast50 = typescriptVersionIsAtLeast['5.0'];

const SyntaxKind = ts.SyntaxKind;

type LogicalOperatorKind =
  | ts.SyntaxKind.AmpersandAmpersandToken
  | ts.SyntaxKind.BarBarToken
  | ts.SyntaxKind.QuestionQuestionToken;
const LOGICAL_OPERATORS: ReadonlySet<LogicalOperatorKind> = new Set([
  SyntaxKind.AmpersandAmpersandToken,
  SyntaxKind.BarBarToken,
  SyntaxKind.QuestionQuestionToken,
]);

interface TokenToText
  extends TSESTree.PunctuatorTokenToText, TSESTree.BinaryOperatorToText {
  [SyntaxKind.ImportKeyword]: 'import';
  [SyntaxKind.KeyOfKeyword]: 'keyof';
  [SyntaxKind.NewKeyword]: 'new';
  [SyntaxKind.ReadonlyKeyword]: 'readonly';
  [SyntaxKind.UniqueKeyword]: 'unique';
}

type AssignmentOperatorKind = keyof TSESTree.AssignmentOperatorToText;
const ASSIGNMENT_OPERATORS: ReadonlySet<AssignmentOperatorKind> = new Set([
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
]);

type BinaryOperatorKind = keyof TSESTree.BinaryOperatorToText;
const BINARY_OPERATORS: ReadonlySet<BinaryOperatorKind> = new Set([
  SyntaxKind.AmpersandAmpersandToken,
  SyntaxKind.AmpersandToken,
  SyntaxKind.AsteriskAsteriskToken,
  SyntaxKind.AsteriskToken,
  SyntaxKind.BarBarToken,
  SyntaxKind.BarToken,
  SyntaxKind.CaretToken,
  SyntaxKind.EqualsEqualsEqualsToken,
  SyntaxKind.EqualsEqualsToken,
  SyntaxKind.ExclamationEqualsEqualsToken,
  SyntaxKind.ExclamationEqualsToken,
  SyntaxKind.GreaterThanEqualsToken,
  SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
  SyntaxKind.GreaterThanGreaterThanToken,
  SyntaxKind.GreaterThanToken,
  SyntaxKind.InKeyword,
  SyntaxKind.InstanceOfKeyword,
  SyntaxKind.LessThanEqualsToken,
  SyntaxKind.LessThanLessThanToken,
  SyntaxKind.LessThanToken,
  SyntaxKind.MinusToken,
  SyntaxKind.PercentToken,
  SyntaxKind.PlusToken,
  SyntaxKind.SlashToken,
]);

type DeclarationKind = TSESTree.VariableDeclaration['kind'];

/**
 * Returns true if the given ts.Token is the assignment operator
 */
function isAssignmentOperator(
  operator: ts.BinaryOperatorToken,
): operator is ts.Token<AssignmentOperatorKind> {
  return (ASSIGNMENT_OPERATORS as ReadonlySet<ts.SyntaxKind>).has(
    operator.kind,
  );
}

/**
 * Returns true if the given ts.Token is a logical operator
 */
export function isLogicalOperator(
  operator: ts.BinaryOperatorToken,
): operator is ts.Token<LogicalOperatorKind> {
  return (LOGICAL_OPERATORS as ReadonlySet<ts.SyntaxKind>).has(operator.kind);
}

export function isESTreeBinaryOperator(
  operator: ts.BinaryOperatorToken,
): operator is ts.Token<BinaryOperatorKind> {
  return (BINARY_OPERATORS as ReadonlySet<ts.SyntaxKind>).has(operator.kind);
}

type TokenForTokenKind<T extends ts.SyntaxKind> = T extends keyof TokenToText
  ? TokenToText[T]
  : string | undefined;
/**
 * Returns the string form of the given TSToken SyntaxKind
 */
export function getTextForTokenKind<T extends ts.SyntaxKind>(
  kind: T,
): TokenForTokenKind<T> {
  return ts.tokenToString(kind) as T extends keyof TokenToText
    ? TokenToText[T]
    : string | undefined;
}

/**
 * Returns true if the given ts.Node is a valid ESTree class member
 */
export function isESTreeClassMember(node: ts.Node): boolean {
  return node.kind !== SyntaxKind.SemicolonClassElement;
}

/**
 * Checks if a ts.Node has a modifier
 */
export function hasModifier(
  modifierKind: ts.KeywordSyntaxKind,
  node: ts.Node,
): boolean {
  const modifiers = getModifiers(node);
  return modifiers?.some(modifier => modifier.kind === modifierKind) === true;
}

/**
 * Get last last modifier in ast
 * @returns returns last modifier if present or null
 */
export function getLastModifier(node: ts.Node): ts.Modifier | null {
  const modifiers = getModifiers(node);
  if (modifiers == null) {
    return null;
  }
  return modifiers[modifiers.length - 1] ?? null;
}

/**
 * Returns true if the given ts.Token is a comma
 */
export function isComma(
  token: ts.Node,
): token is ts.Token<ts.SyntaxKind.CommaToken> {
  return token.kind === SyntaxKind.CommaToken;
}

/**
 * Returns true if the given ts.Node is a comment
 */
export function isComment(node: ts.Node): boolean {
  return (
    node.kind === SyntaxKind.SingleLineCommentTrivia ||
    node.kind === SyntaxKind.MultiLineCommentTrivia
  );
}

/**
 * Returns the binary expression type of the given ts.Token
 */
export function getBinaryExpressionType(operator: ts.BinaryOperatorToken):
  | {
      operator: TokenForTokenKind<AssignmentOperatorKind>;
      type: AST_NODE_TYPES.AssignmentExpression;
    }
  | {
      operator: TokenForTokenKind<BinaryOperatorKind>;
      type: AST_NODE_TYPES.BinaryExpression;
    }
  | {
      operator: TokenForTokenKind<LogicalOperatorKind>;
      type: AST_NODE_TYPES.LogicalExpression;
    } {
  if (isAssignmentOperator(operator)) {
    return {
      type: AST_NODE_TYPES.AssignmentExpression,
      operator: getTextForTokenKind(operator.kind),
    };
  }

  if (isLogicalOperator(operator)) {
    return {
      type: AST_NODE_TYPES.LogicalExpression,
      operator: getTextForTokenKind(operator.kind),
    };
  }

  if (isESTreeBinaryOperator(operator)) {
    return {
      type: AST_NODE_TYPES.BinaryExpression,
      operator: getTextForTokenKind(operator.kind),
    };
  }

  throw new Error(
    `Unexpected binary operator ${ts.tokenToString(operator.kind)}`,
  );
}

/**
 * Returns line and column data for the given positions
 */
export function getLineAndCharacterFor(
  pos: number,
  ast: ts.SourceFile,
): TSESTree.Position {
  const lineStarts = ast.getLineStarts();
  const line = findLine(lineStarts, pos, 0);
  return {
    column: pos - lineStarts[line],
    line: line + 1,
  };
}

/**
 * Returns the index of the line containing `pos`: the last line that starts
 * at or before `pos`. `from` is a line known to start at or before `pos`;
 * the search gallops forward from it, so lookups close to `from` are cheap.
 */
function findLine(
  lineStarts: readonly number[],
  pos: number,
  from: number,
): number {
  const count = lineStarts.length;
  let low = from;
  let step = 1;
  let high = low + step;
  while (high < count && lineStarts[high] <= pos) {
    low = high;
    step *= 2;
    high = low + step;
  }
  if (high > count) {
    high = count;
  }
  // lineStarts[low] <= pos, and lineStarts[high] > pos (or high === count)
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (lineStarts[middle] <= pos) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return low;
}

/**
 * Returns line and column data for the given start and end positions.
 * @param lineHint a line index to start looking for `start` from; ignored
 * if that line starts after `start`
 */
function getLocForPositions(
  start: number,
  end: number,
  lineStarts: readonly number[],
  lineHint = 0,
): TSESTree.SourceLocation {
  const startLine = findLine(
    lineStarts,
    start,
    lineStarts[lineHint] <= start ? lineHint : 0,
  );
  const endLine = findLine(lineStarts, end, end >= start ? startLine : 0);
  return {
    end: { column: end - lineStarts[endLine], line: endLine + 1 },
    start: { column: start - lineStarts[startLine], line: startLine + 1 },
  };
}

/**
 * Returns line and column data for the given start and end positions,
 * for the given AST
 */
export function getLocFor(
  range: TSESTree.Range,
  ast: ts.SourceFile,
): TSESTree.SourceLocation {
  return getLocForPositions(range[0], range[1], ast.getLineStarts());
}

/**
 * Check whatever node can contain directive
 */
export function canContainDirective(
  node:
    ts.Block | ts.ClassStaticBlockDeclaration | ts.ModuleBlock | ts.SourceFile,
): boolean {
  if (node.kind === ts.SyntaxKind.Block) {
    switch (node.parent.kind) {
      case ts.SyntaxKind.Constructor:
      case ts.SyntaxKind.GetAccessor:
      case ts.SyntaxKind.SetAccessor:
      case ts.SyntaxKind.ArrowFunction:
      case ts.SyntaxKind.FunctionExpression:
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.MethodDeclaration:
        return true;
      default:
        return false;
    }
  }
  return true;
}

/**
 * Returns range for the given ts.Node
 */
export function getRange(
  node: Pick<ts.Node, 'getEnd' | 'getStart'>,
  ast: ts.SourceFile,
): [number, number] {
  return [node.getStart(ast), node.getEnd()];
}

/**
 * Returns true if a given ts.Node is a JSX token
 */
export function isJSXToken(node: ts.Node): boolean {
  return (
    node.kind >= SyntaxKind.JsxElement && node.kind <= SyntaxKind.JsxAttribute
  );
}

/**
 * Returns the declaration kind of the given ts.Node
 */
export function getDeclarationKind(
  node: ts.VariableDeclarationList,
): DeclarationKind {
  if (node.flags & ts.NodeFlags.Let) {
    return 'let';
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  if ((node.flags & ts.NodeFlags.AwaitUsing) === ts.NodeFlags.AwaitUsing) {
    return 'await using';
  }
  if (node.flags & ts.NodeFlags.Const) {
    return 'const';
  }
  if (node.flags & ts.NodeFlags.Using) {
    return 'using';
  }
  return 'var';
}

/**
 * Gets a ts.Node's accessibility level
 */
export function getTSNodeAccessibility(
  node: ts.Node,
): 'private' | 'protected' | 'public' | undefined {
  const modifiers = getModifiers(node);
  if (modifiers == null) {
    return undefined;
  }
  for (const modifier of modifiers) {
    switch (modifier.kind) {
      case SyntaxKind.PublicKeyword:
        return 'public';
      case SyntaxKind.ProtectedKeyword:
        return 'protected';
      case SyntaxKind.PrivateKeyword:
        return 'private';
      default:
        break;
    }
  }
  return undefined;
}

/**
 * Finds the next token based on the previous one and its parent
 * Had to copy this from TS instead of using TS's version because theirs doesn't pass the ast to getChildren
 */
export function findNextToken(
  previousToken: ts.TextRange,
  parent: ts.Node,
  ast: ts.SourceFile,
): ts.Node | undefined {
  return find(parent);

  function find(n: ts.Node): ts.Node | undefined {
    if (ts.isToken(n) && n.pos === previousToken.end) {
      // this is token that starts at the end of previous token - return it
      return n;
    }
    return firstDefined(n.getChildren(ast), (child: ts.Node) => {
      const shouldDiveInChildNode =
        // previous token is enclosed somewhere in the child
        (child.pos <= previousToken.pos && child.end > previousToken.end) ||
        // previous token ends exactly at the beginning of child
        child.pos === previousToken.end;
      return shouldDiveInChildNode && nodeHasTokens(child, ast)
        ? find(child)
        : undefined;
    });
  }
}

/**
 * Find the first matching ancestor based on the given predicate function.
 * @param node The current ts.Node
 * @param predicate The predicate function to apply to each checked ancestor
 * @returns a matching parent ts.Node
 */
export function findFirstMatchingAncestor(
  node: ts.Node,
  predicate: (node: ts.Node) => boolean,
): ts.Node | undefined {
  let current = node as ts.Node | undefined;
  while (current) {
    if (predicate(current)) {
      return current;
    }
    current = current.parent;
  }
  return undefined;
}

/**
 * Returns true if a given ts.Node has a JSX token within its hierarchy
 */
export function hasJSXAncestor(node: ts.Node): boolean {
  return !!findFirstMatchingAncestor(node, isJSXToken);
}

/**
 * Unescape the text content of string literals, e.g. &amp; -> &
 * @param text The escaped string literal text.
 * @returns The unescaped string literal text.
 */
export function unescapeStringLiteralText(text: string): string {
  return text.replaceAll(/&(?:#\d+|#x[\da-fA-F]+|[0-9a-zA-Z]+);/g, entity => {
    const item = entity.slice(1, -1);
    if (item[0] === '#') {
      const codePoint =
        item[1] === 'x'
          ? parseInt(item.slice(2), 16)
          : parseInt(item.slice(1), 10);
      return codePoint > 0x10ffff // RangeError: Invalid code point
        ? entity
        : String.fromCodePoint(codePoint);
    }
    return xhtmlEntities[item] || entity;
  });
}

/**
 * Returns true if a given ts.Node is a computed property
 */
export function isComputedProperty(
  node: ts.Node,
): node is ts.ComputedPropertyName {
  return node.kind === SyntaxKind.ComputedPropertyName;
}

/**
 * Returns true if a given ts.Node is optional (has QuestionToken)
 * @param node ts.Node to be checked
 */
export function isOptional(node: {
  questionToken?: ts.QuestionToken;
}): boolean {
  return !!node.questionToken;
}

/**
 * Returns true if the node is an optional chain node
 */
export function isChainExpression(
  node: TSESTree.Node,
): node is TSESTree.ChainExpression {
  return node.type === AST_NODE_TYPES.ChainExpression;
}

/**
 * Returns true of the child of property access expression is an optional chain
 */
export function isChildUnwrappableOptionalChain(
  node:
    | ts.CallExpression
    | ts.ElementAccessExpression
    | ts.NonNullExpression
    | ts.PropertyAccessExpression,
  child: TSESTree.Node,
): boolean {
  return (
    isChainExpression(child) &&
    // (x?.y).z is semantically different, and as such .z is no longer optional
    node.expression.kind !== ts.SyntaxKind.ParenthesizedExpression
  );
}

/**
 * Returns the type of a given ts.Token
 */
export function getTokenType(
  token: ts.Identifier | ts.Token<ts.SyntaxKind>,
): Exclude<AST_TOKEN_TYPES, AST_TOKEN_TYPES.Block | AST_TOKEN_TYPES.Line> {
  return getTokenTypeForKind(token.kind, token.parent);
}

/**
 * Returns the type of a token of the given kind with the given parent
 */
function getTokenTypeForKind(
  kind: ts.SyntaxKind,
  parent: ts.Node,
): Exclude<AST_TOKEN_TYPES, AST_TOKEN_TYPES.Block | AST_TOKEN_TYPES.Line> {
  if (
    kind >= SyntaxKind.FirstPunctuation &&
    kind <= SyntaxKind.LastPunctuation
  ) {
    return AST_TOKEN_TYPES.Punctuator;
  }

  if (kind === SyntaxKind.NullKeyword) {
    return AST_TOKEN_TYPES.Null;
  }

  if (
    kind >= SyntaxKind.FirstKeyword &&
    kind <= SyntaxKind.LastFutureReservedWord
  ) {
    if (kind === SyntaxKind.FalseKeyword || kind === SyntaxKind.TrueKeyword) {
      return AST_TOKEN_TYPES.Boolean;
    }

    return AST_TOKEN_TYPES.Keyword;
  }

  if (
    kind >= SyntaxKind.NoSubstitutionTemplateLiteral &&
    kind <= SyntaxKind.TemplateTail
  ) {
    return AST_TOKEN_TYPES.Template;
  }

  switch (kind) {
    case SyntaxKind.NumericLiteral:
    case SyntaxKind.BigIntLiteral:
      return AST_TOKEN_TYPES.Numeric;

    case SyntaxKind.PrivateIdentifier:
      return AST_TOKEN_TYPES.PrivateIdentifier;

    case SyntaxKind.JsxText:
      return AST_TOKEN_TYPES.JSXText;

    case SyntaxKind.StringLiteral:
      // A TypeScript-StringLiteral token with a TypeScript-JsxAttribute or TypeScript-JsxElement parent,
      // must actually be an ESTree-JSXText token
      if (
        parent.kind === SyntaxKind.JsxAttribute ||
        parent.kind === SyntaxKind.JsxElement
      ) {
        return AST_TOKEN_TYPES.JSXText;
      }

      return AST_TOKEN_TYPES.String;

    case SyntaxKind.RegularExpressionLiteral:
      return AST_TOKEN_TYPES.RegularExpression;

    case SyntaxKind.Identifier:
    case SyntaxKind.ConstructorKeyword:
    case SyntaxKind.GetKeyword:
    case SyntaxKind.SetKeyword:

    // intentional fallthrough
    default:
  }

  // Some JSX tokens have to be determined based on their parent
  if (kind === SyntaxKind.Identifier) {
    if (isJSXToken(parent)) {
      return AST_TOKEN_TYPES.JSXIdentifier;
    }

    if (
      parent.kind === SyntaxKind.PropertyAccessExpression &&
      hasJSXAncestor(parent)
    ) {
      return AST_TOKEN_TYPES.JSXIdentifier;
    }
  }

  return AST_TOKEN_TYPES.Identifier;
}

/**
 * Extends and formats a given ts.Token, for a given AST
 */
export function convertToken(
  token: ts.Token<ts.TokenSyntaxKind>,
  ast: ts.SourceFile,
): TSESTree.Token {
  const start =
    token.kind === SyntaxKind.JsxText
      ? token.getFullStart()
      : token.getStart(ast);
  return createToken(
    getTokenType(token),
    start,
    token.getEnd(),
    ast.text,
    ast.getLineStarts(),
  );
}

/**
 * Creates an ESTree token of the given type for a range of the source text.
 * @param lineHint a line index to start looking for the token's line from
 */
function createToken(
  tokenType: Exclude<
    AST_TOKEN_TYPES,
    AST_TOKEN_TYPES.Block | AST_TOKEN_TYPES.Line
  >,
  start: number,
  end: number,
  text: string,
  lineStarts: readonly number[],
  lineHint?: number,
): TSESTree.Token {
  const value = text.slice(start, end);
  const range: TSESTree.Range = [start, end];
  const loc = getLocForPositions(start, end, lineStarts, lineHint);

  if (tokenType === AST_TOKEN_TYPES.RegularExpression) {
    return {
      type: tokenType,
      loc,
      range,
      regex: {
        flags: value.slice(value.lastIndexOf('/') + 1),
        pattern: value.slice(1, value.lastIndexOf('/')),
      },
      value,
    };
  }

  if (tokenType === AST_TOKEN_TYPES.PrivateIdentifier) {
    return {
      type: tokenType,
      loc,
      range,
      value: value.slice(1),
    };
  }

  // @ts-expect-error TS is complaining about `value` not being the correct
  // type but it is
  return {
    type: tokenType,
    loc,
    range,
    value,
  };
}

/**
 * Converts all tokens for the given AST
 * @param ast the AST object
 * @returns the converted Tokens
 */
export function convertTokens(ast: ts.SourceFile): TSESTree.Token[] {
  return convertTokensAndComments(ast, true, false).tokens;
}

// `import * as ts` reads every member through a getter, so the functions
// called for every token are read once here.
const forEachLeadingCommentRange = ts.forEachLeadingCommentRange;
const forEachTrailingCommentRange = ts.forEachTrailingCommentRange;
const isJSDocCommentContainingNode = ts.isJSDocCommentContainingNode;

let sharedScanner: ts.Scanner | undefined;

/**
 * Returns a scanner over the given text, used to find the tokens that
 * TypeScript doesn't create nodes for.
 */
function getScanner(text: string): ts.Scanner {
  sharedScanner ??= ts.createScanner(
    ts.ScriptTarget.Latest,
    /* skipTrivia */ true,
  );
  sharedScanner.setText(text);
  return sharedScanner;
}

/**
 * Moves a scanner to a position. `resetTokenState` replaced `setTextPos` in
 * TypeScript 5.1.
 */
function moveScanner(scanner: ts.Scanner, pos: number): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- missing in typescript<5.1
  if (scanner.resetTokenState) {
    scanner.resetTokenState(pos);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- fallback for typescript<5.1
    scanner.setTextPos(pos);
  }
}

/**
 * Returns the start of the token a scanner last scanned. `getTokenStart`
 * replaced `getTokenPos` in TypeScript 5.1.
 */
function getScannedTokenStart(scanner: ts.Scanner): number {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- missing in typescript<5.1
  return scanner.getTokenStart
    ? scanner.getTokenStart()
    : // eslint-disable-next-line @typescript-eslint/no-deprecated -- fallback for typescript<5.1
      scanner.getTokenPos();
}

/**
 * Returns the end of the token a scanner last scanned. `getTokenEnd`
 * replaced `getTextPos` in TypeScript 5.1.
 */
function getScannedTokenEnd(scanner: ts.Scanner): number {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- missing in typescript<5.1
  return scanner.getTokenEnd
    ? scanner.getTokenEnd()
    : // eslint-disable-next-line @typescript-eslint/no-deprecated -- fallback for typescript<5.1
      scanner.getTextPos();
}

/**
 * Returns the start of the first token at or after `pos`, skipping trivia.
 * This is where a token whose full start is `pos` starts.
 */
export function getTokenStartAfter(pos: number, ast: ts.SourceFile): number {
  const scanner = getScanner(ast.text);
  moveScanner(scanner, pos);
  scanner.scan();
  const start = getScannedTokenStart(scanner);
  scanner.setText(undefined);
  return start;
}

/**
 * Returns the end of the first token at or after `pos`, skipping trivia.
 */
export function getTokenEndAfter(pos: number, ast: ts.SourceFile): number {
  const scanner = getScanner(ast.text);
  moveScanner(scanner, pos);
  scanner.scan();
  const end = getScannedTokenEnd(scanner);
  scanner.setText(undefined);
  return end;
}

/**
 * Returns false when the text at `pos` certainly doesn't start with trivia
 * that contains a comment. Only the most common whitespace is skipped;
 * anything unusual counts as a possible comment, so that TypeScript decides.
 */
function mayStartWithComment(text: string, pos: number): boolean {
  for (; ; pos++) {
    const ch = text.charCodeAt(pos);
    // space, line feed, tab, carriage return
    if (ch === 32 || ch === 10 || ch === 9 || ch === 13) {
      continue;
    }
    // "/", "#" (shebang), vertical tab, form feed, non-ASCII whitespace
    return ch === 47 || ch === 35 || ch === 11 || ch === 12 || ch > 127;
  }
}

function isJsxElementOrFragment(node: ts.Node): boolean {
  return (
    node.kind === SyntaxKind.JsxElement || node.kind === SyntaxKind.JsxFragment
  );
}

/**
 * In a JSX file, returns whether a token can be followed by trivia rather
 * than by JSX text. Does the same check as `iterateComments` in
 * `ts-api-utils`.
 */
function canHaveTrailingTrivia(
  kind: ts.SyntaxKind,
  end: number,
  parent: ts.Node,
): boolean {
  switch (kind) {
    case SyntaxKind.CloseBraceToken:
      return (
        parent.kind !== SyntaxKind.JsxExpression ||
        !isJsxElementOrFragment(parent.parent)
      );
    case SyntaxKind.GreaterThanToken:
      switch (parent.kind) {
        case SyntaxKind.JsxClosingElement:
        case SyntaxKind.JsxClosingFragment:
          return !isJsxElementOrFragment(parent.parent.parent);
        case SyntaxKind.JsxOpeningElement:
          return end !== parent.end;
        case SyntaxKind.JsxOpeningFragment:
          return false;
        case SyntaxKind.JsxSelfClosingElement:
          return end !== parent.end || !isJsxElementOrFragment(parent.parent);
      }
  }
  return true;
}

/**
 * Converts the tokens and/or the comments of the given AST in one pass.
 *
 * TypeScript only creates nodes for some tokens. `node.getChildren()` fills in
 * the rest by scanning the text between child nodes, and creates and caches a
 * node object for each one. This does the same scan, but uses the scanned
 * positions directly instead of creating nodes.
 * @param ast the AST object
 * @param includeTokens whether to convert tokens
 * @param includeComments whether to convert comments
 * @returns the converted tokens and comments
 */
export function convertTokensAndComments(
  ast: ts.SourceFile,
  includeTokens: boolean,
  includeComments: boolean,
): { comments: TSESTree.Comment[]; tokens: TSESTree.Token[] } {
  const tokens: TSESTree.Token[] = [];
  const comments: TSESTree.Comment[] = [];
  const text = ast.text;
  const lineStarts = ast.getLineStarts();
  const scanner = getScanner(text);
  const notJsx = ast.languageVariant !== ts.LanguageVariant.JSX;
  // line of the last converted token; tokens are visited in source order
  let lineHint = 0;
  // the node whose children are being visited, and how far into it we are
  let currentParent: ts.Node = ast;
  let currentPos = 0;
  // tokens inside JSDoc comments are only visited to look for comments
  let emitTokens = includeTokens;

  function addToken(kind: ts.SyntaxKind, token: TSESTree.Token): void {
    // TypeScript drops first half of a `<<` in some cases.
    // Gating on `kind` (a cheap check) keeps the rest of the check,
    // which has to look at the text, off the hot path.
    if (kind === SyntaxKind.LessThanToken) {
      addMissingLessThanToken(tokens, token, ast);
    }

    lineHint = token.loc.start.line - 1;
    tokens.push(token);
  }

  function addComment(pos: number, end: number, kind: ts.CommentKind): void {
    const isLine = kind === SyntaxKind.SingleLineCommentTrivia;
    comments.push({
      type: isLine ? AST_TOKEN_TYPES.Line : AST_TOKEN_TYPES.Block,
      loc: getLocForPositions(pos, end, lineStarts),
      range: [pos, end],
      value: text.slice(pos + 2, isLine ? end : end - 2),
    });
  }

  /**
   * Adds the comments before and after a token, like `iterateComments` in
   * `ts-api-utils` does for each token.
   */
  function addCommentsAround(
    kind: ts.SyntaxKind,
    pos: number,
    end: number,
    parent: ts.Node,
  ): void {
    if (pos === end) {
      return;
    }
    if (kind !== SyntaxKind.JsxText && mayStartWithComment(text, pos)) {
      forEachLeadingCommentRange(
        text,
        // skip shebang at position 0
        pos === 0 ? (ts.getShebang(text) ?? '').length : pos,
        addComment,
      );
    }
    if (
      mayStartWithComment(text, end) &&
      (notJsx || canHaveTrailingTrivia(kind, end, parent))
    ) {
      forEachTrailingCommentRange(text, end, addComment);
    }
  }

  /**
   * Visits the tokens between two children of `parent`, which have no nodes.
   */
  function visitGap(pos: number, end: number, parent: ts.Node): void {
    if (pos >= end) {
      return;
    }
    moveScanner(scanner, pos);
    while (pos < end) {
      const kind = scanner.scan();
      const tokenEnd = getScannedTokenEnd(scanner);
      if (tokenEnd <= end) {
        if (kind === SyntaxKind.Identifier) {
          // `getChildren()` fails in the same way
          throw new Error(
            `Did not expect ${SyntaxKind[parent.kind]} to have an Identifier in its trivia`,
          );
        }
        if (emitTokens && kind !== SyntaxKind.EndOfFileToken) {
          addToken(
            kind,
            createToken(
              getTokenTypeForKind(kind, parent),
              getScannedTokenStart(scanner),
              tokenEnd,
              text,
              lineStarts,
              lineHint,
            ),
          );
        }
        if (includeComments) {
          addCommentsAround(kind, pos, tokenEnd, parent);
        }
      }
      pos = tokenEnd;
      if (kind === SyntaxKind.EndOfFileToken) {
        break;
      }
    }
  }

  function visitChild(child: ts.Node): void {
    const parent = currentParent;
    visitGap(currentPos, child.pos, parent);
    walk(child);
    currentParent = parent;
    currentPos = child.end;
  }

  function visitChildren(children: ts.NodeArray<ts.Node>): void {
    const parent = currentParent;
    visitGap(currentPos, children.pos, parent);
    let pos = children.pos;
    for (const child of children) {
      visitGap(pos, child.pos, parent);
      walk(child);
      pos = child.end;
    }
    visitGap(pos, children.end, parent);
    currentParent = parent;
    currentPos = children.end;
  }

  function walk(node: ts.Node): void {
    const kind = node.kind;
    if (kind >= SyntaxKind.FirstToken && kind <= SyntaxKind.LastToken) {
      if (emitTokens && kind !== SyntaxKind.EndOfFileToken) {
        addToken(
          kind,
          createToken(
            getTokenTypeForKind(kind, node.parent),
            kind === SyntaxKind.JsxText ? node.pos : node.getStart(ast),
            node.end,
            text,
            lineStarts,
            lineHint,
          ),
        );
      }
      if (includeComments) {
        addCommentsAround(kind, node.pos, node.end, node.parent);
      }
      return;
    }

    if (isJSDocCommentContainingNode(node)) {
      // these nodes have no tokens between their children
      node.forEachChild(walk);
      return;
    }

    // JSDoc comments come first. TypeScript generates tokens for the types in
    // them, which should not be added to the resulting tokens list.
    const jsDoc = (node as { jsDoc?: ts.JSDoc[] } & ts.Node).jsDoc;
    if (includeComments && jsDoc) {
      const previousEmitTokens = emitTokens;
      emitTokens = false;
      jsDoc.forEach(walk);
      emitTokens = previousEmitTokens;
    }

    currentParent = node;
    currentPos = node.pos;
    node.forEachChild(visitChild, visitChildren);
    visitGap(currentPos, node.end, node);
  }

  try {
    walk(ast);
  } finally {
    scanner.setText(undefined);
  }

  return { comments, tokens };
}

/**
 * The tokens TypeScript's parser did not keep as children of a node (`<` and
 * `>` of a type argument list, for instance) are recovered by re-scanning the
 * source text in the gaps between the children it did keep, and any token that
 * runs past the end of the gap being filled is discarded. `getChildren()` does
 * this, and `convertTokensAndComments()` does the same.
 *
 * Its scanner produces `<<` as a single token, which the parser splits back
 * apart when the second `<` opens a type parameter list, as in
 * `ReturnType<<T>(x: T) => number>`. The re-scan is not aware of that split,
 * so the `<<` it scans overruns the gap left by the first `<`, and that token
 * is dropped entirely.
 *
 * Text skipped in front of a token can otherwise only be trivia, and no trivia
 * can end in a `<`: line comments, shebangs and conflict markers all run to the
 * end of a line, and block comments all end in `*` + `/`. So a `<` sitting
 * directly in front of a token, with anything at all skipped before it,
 * is unambiguously a token TypeScript lost.
 *
 * Only ever called for a `<` token — see the caller.
 */
function addMissingLessThanToken(
  result: TSESTree.Token[],
  token: TSESTree.Token,
  ast: ts.SourceFile,
): void {
  if (result.length === 0) {
    return;
  }

  const currentTokenStart = token.range[0];
  const previousTokenEnd = result[result.length - 1].range[1];

  if (
    currentTokenStart > previousTokenEnd &&
    ast.text[currentTokenStart - 1] === '<'
  ) {
    const range: TSESTree.Range = [currentTokenStart - 1, currentTokenStart];
    result.push({
      type: AST_TOKEN_TYPES.Punctuator,
      loc: getLocFor(range, ast),
      range,
      value: '<',
    });
  }
}

export class TSError extends Error {
  override name = 'TSError';

  constructor(
    message: string,
    public readonly fileName: string,
    public readonly location: {
      end: {
        column: number;
        line: number;
        offset: number;
      };
      start: {
        column: number;
        line: number;
        offset: number;
      };
    },
  ) {
    super(message);
  }

  // For old version of ESLint https://github.com/typescript-eslint/typescript-eslint/pull/6556#discussion_r1123237311
  get index(): number {
    return this.location.start.offset;
  }

  // https://github.com/eslint/eslint/blob/b09a512107249a4eb19ef5a37b0bd672266eafdb/lib/linter/linter.js#L853
  get lineNumber(): number {
    return this.location.start.line;
  }

  // https://github.com/eslint/eslint/blob/b09a512107249a4eb19ef5a37b0bd672266eafdb/lib/linter/linter.js#L854
  get column(): number {
    return this.location.start.column;
  }
}

export function createError(node: ts.Node, message: string): TSError;
export function createError(
  node: number | ts.Node | TSESTree.Range,
  message: string,
  sourceFile: ts.SourceFile,
): TSError;
export function createError(
  node: number | ts.Node | TSESTree.Range,
  message: string,
  sourceFile?: ts.SourceFile,
): TSError {
  let startIndex;
  let endIndex;
  if (Array.isArray(node)) {
    [startIndex, endIndex] = node;
  } else if (typeof node === 'number') {
    startIndex = endIndex = node;
  } else {
    sourceFile ??= node.getSourceFile();
    startIndex = node.getStart(sourceFile);
    endIndex = node.getEnd();
  }

  if (!sourceFile) {
    throw new Error('`sourceFile` is required.');
  }

  const [start, end] = [startIndex, endIndex].map(offset => {
    const { character: column, line } =
      sourceFile.getLineAndCharacterOfPosition(offset);
    return { column, line: line + 1, offset };
  });

  return new TSError(message, sourceFile.fileName, { end, start });
}

export function nodeHasTokens(n: ts.Node, ast: ts.SourceFile): boolean {
  // If we have a token or node that has a non-zero width, it must have tokens.
  // Note: getWidth() does not take trivia into account.
  return n.kind === SyntaxKind.EndOfFileToken
    ? !!(n as ts.JSDocContainer).jsDoc
    : n.getWidth(ast) !== 0;
}

/**
 * Like `forEach`, but suitable for use with numbers and strings (which may be falsy).
 */
export function firstDefined<T, U>(
  array: readonly T[] | undefined,
  callback: (element: T, index: number) => U | undefined,
): U | undefined {
  // eslint-disable-next-line @typescript-eslint/internal/eqeq-nullish
  if (array === undefined) {
    return undefined;
  }

  for (let i = 0; i < array.length; i++) {
    const result = callback(array[i], i);
    // eslint-disable-next-line @typescript-eslint/internal/eqeq-nullish
    if (result !== undefined) {
      return result;
    }
  }
  return undefined;
}

export function identifierIsThisKeyword(id: ts.Identifier): boolean {
  return (
    (isAtLeast50
      ? ts.identifierToKeywordKind(id)
      : // @ts-expect-error -- intentional fallback for older TS versions <=4.9
        id.originalKeywordKind) === SyntaxKind.ThisKeyword
  );
}

export function isThisIdentifier(
  node: ts.Node | undefined,
): node is ts.Identifier {
  return (
    !!node &&
    node.kind === SyntaxKind.Identifier &&
    identifierIsThisKeyword(node as ts.Identifier)
  );
}

export function isThisInTypeQuery(node: ts.Node): boolean {
  if (!isThisIdentifier(node)) {
    return false;
  }

  while (ts.isQualifiedName(node.parent) && node.parent.left === node) {
    node = node.parent;
  }

  return node.parent.kind === SyntaxKind.TypeQuery;
}

export function isValidAssignmentTarget(node: ts.Node): boolean {
  switch (node.kind) {
    case SyntaxKind.Identifier:
      return true;
    case SyntaxKind.PropertyAccessExpression:
    case SyntaxKind.ElementAccessExpression:
      if (node.flags & ts.NodeFlags.OptionalChain) {
        return false;
      }
      return true;
    case SyntaxKind.ParenthesizedExpression:
    case SyntaxKind.TypeAssertionExpression:
    case SyntaxKind.AsExpression:
    case SyntaxKind.SatisfiesExpression:
    case SyntaxKind.ExpressionWithTypeArguments:
    case SyntaxKind.NonNullExpression:
      return isValidAssignmentTarget(
        (
          node as
            | ts.AssertionExpression
            | ts.ExpressionWithTypeArguments
            | ts.NonNullExpression
            | ts.ParenthesizedExpression
            | ts.SatisfiesExpression
        ).expression,
      );
    default:
      return false;
  }
}

export function getNamespaceModifiers(
  node: ts.ModuleDeclaration,
): ts.Modifier[] | undefined {
  // For following nested namespaces, use modifiers given to the topmost namespace
  //   export declare namespace foo.bar.baz {}
  let modifiers = getModifiers(node);
  let moduleDeclaration = node;
  while (
    (!modifiers || modifiers.length === 0) &&
    ts.isModuleDeclaration(moduleDeclaration.parent)
  ) {
    const parentModifiers = getModifiers(moduleDeclaration.parent);
    if (parentModifiers?.length) {
      modifiers = parentModifiers;
    }
    moduleDeclaration = moduleDeclaration.parent;
  }
  return modifiers;
}

// `ts.declarationNameToString`
export function declarationNameToString(node: ts.Node): string {
  const text = node.getSourceFile().text.slice(node.pos, node.end).trimStart();
  return text || '(Missing)';
}

function isPropertyAccessEntityNameExpression(
  node: ts.Node,
): node is ts.PropertyAccessEntityNameExpression {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.name) &&
    isEntityNameExpression(node.expression)
  );
}

export function isEntityNameExpression(
  node: ts.Node,
): node is ts.EntityNameExpression {
  return (
    node.kind === SyntaxKind.Identifier ||
    isPropertyAccessEntityNameExpression(node)
  );
}
