// https://lexical.dev/docs/concepts/node-replacement

import { EditorConfig, ParagraphNode } from "lexical";

export class ExtendedParagraphNode extends ParagraphNode {
  static getType() {
    return "extended-paragraph";
  }

  static clone(node: ExtendedParagraphNode) {
    return new ExtendedParagraphNode(node.__key);
  }

  createDOM(config: EditorConfig) {
    const dom = super.createDOM(config);

    if (this.__className) {
      dom.className = this.__className;
    }

    return dom;
  }
}
