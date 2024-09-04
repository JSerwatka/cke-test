import { QuoteNode } from '@lexical/rich-text';
import { EditorConfig, NodeKey } from 'lexical';

export class ExtendedQuoteNode extends QuoteNode {
    constructor(key?: NodeKey) {
        super(key);
    }

    static getType(): string {
        return 'extended-quote';
    }

    static clone(node: ExtendedQuoteNode): ExtendedQuoteNode {
        return new ExtendedQuoteNode(node.__key);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement('blockquote');
        element.style.margin = '0';
        element.style.marginLeft = '20px';
        element.style.marginBottom = '10px';
        element.style.fontSize = '15px';
        element.style.color = 'rgb(101, 103, 107)';
        element.style.borderLeftColor = 'rgb(206, 208, 212)';
        element.style.borderLeftWidth = '4px';
        element.style.borderLeftStyle = 'solid';
        element.style.paddingLeft = '16px';
        element.className = this.__className ?? null;
        return element;
    }
}