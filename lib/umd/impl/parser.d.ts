import { JSON5Path, JSON5Visitor, Location, Node, NodeType, ParseError, ParseOptions } from '../main';
declare namespace ParseOptions {
    const DEFAULT: {
        allowTrailingComma: boolean;
    };
}
/**
 * For a given offset, evaluate the location in the JSON document. Each segment in the location path is either a property name or an array index.
 */
export declare function getLocation(text: string, position: number): Location;
/**
 * Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
 * Therefore always check the errors list to find out if the input was valid.
 */
export declare function parse(text: string, errors?: ParseError[], options?: ParseOptions): any;
/**
 * Parses the given text and returns a tree representation the JSON content. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
 */
export declare function parseTree(text: string, errors?: ParseError[], options?: ParseOptions): Node;
/**
 * Finds the node at the given path in a JSON DOM.
 */
export declare function findNodeAtLocation(root: Node, path: JSON5Path): Node | undefined;
/**
 * Gets the JSON path of the given JSON DOM node
 */
export declare function getNodePath(node: Node): JSON5Path;
/**
 * Evaluates the JavaScript object of the given JSON DOM node
 */
export declare function getNodeValue(node: Node): any;
export declare function contains(node: Node, offset: number, includeRightBound?: boolean): boolean;
/**
 * Finds the most inner node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
 */
export declare function findNodeAtOffset(node: Node, offset: number, includeRightBound?: boolean): Node | undefined;
/**
 * Parses the given text and invokes the visitor functions for each object, array and literal reached.
 */
export declare function visit(text: string, visitor: JSON5Visitor, options?: ParseOptions): any;
/**
 * Takes JSON with JavaScript-style comments and remove
 * them. Optionally replaces every none-newline character
 * of comments with a replaceCharacter
 */
export declare function stripComments(text: string, replaceCh?: string): string;
export declare function getNodeType(value: any): NodeType;
export {};
