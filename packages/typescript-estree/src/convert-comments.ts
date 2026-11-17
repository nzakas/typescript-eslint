import type * as ts from 'typescript';

import type { TSESTree } from './ts-estree';

import { convertTokensAndComments } from './node-utils';

/**
 * Convert all comments for the given AST.
 * @param ast the AST object
 * @returns the converted ESTreeComment
 * @private
 */
export function convertComments(ast: ts.SourceFile): TSESTree.Comment[] {
  return convertTokensAndComments(ast, false, true).comments;
}
