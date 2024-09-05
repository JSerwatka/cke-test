// https://lexical.dev/docs/concepts/node-replacement

import { EditorConfig, ParagraphNode } from "lexical";

export class ExtendedParagraphNode extends ParagraphNode {
  static getType() {
    return "extended-paragraph";
  }

  static clone(node: ExtendedParagraphNode) {
    return new ExtendedParagraphNode(node.__key);
  }

  static importDOM() {
    return {
      p: (node: HTMLElement) => ({
        conversion: () => {
          const paragraphNode = new ExtendedParagraphNode();
          paragraphNode.__style = node.getAttribute("style") || "";
          return { node: paragraphNode };
        },
        priority: 1 as const,
      }),
    };
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);
    
    if (this.__style) {
      dom.setAttribute("style", this.__style);
    }

    return dom;
  }
}
