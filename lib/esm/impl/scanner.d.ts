import { JSON5Scanner } from '../main';
/**
 * Creates a JSON scanner on the given text.
 * If ignoreTrivia is set, whitespaces or comments are ignored.
 */
export declare function createScanner(text: string, ignoreTrivia?: boolean): JSON5Scanner;
