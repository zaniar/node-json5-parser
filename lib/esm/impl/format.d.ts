import { Range, FormattingOptions, Edit } from '../main';
export declare function format(documentText: string, range: Range | undefined, options: FormattingOptions): Edit[];
export declare function isEOL(text: string, offset: number): boolean;
