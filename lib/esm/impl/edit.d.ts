import { Edit, FormattingOptions, JSON5Path } from '../main';
export declare function removeProperty(text: string, path: JSON5Path, formattingOptions: FormattingOptions): Edit[];
export declare function setProperty(text: string, originalPath: JSON5Path, value: any, formattingOptions: FormattingOptions, getInsertionIndex?: (properties: string[]) => number, isArrayInsertion?: boolean): Edit[];
export declare function applyEdit(text: string, edit: Edit): string;
export declare function isWS(text: string, offset: number): boolean;
