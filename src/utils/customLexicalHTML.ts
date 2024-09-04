/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    DOMChildConversion,
    DOMConversion,
    DOMConversionFn,
    ElementFormatType,
    LexicalEditor,
    LexicalNode,
} from 'lexical';

import { isBlockDomNode } from '@lexical/utils';
import {
    $createLineBreakNode,
    $createParagraphNode,
    $isBlockElementNode,
    $isElementNode,
    $isRootOrShadowRoot,
    ArtificialNode__DO_NOT_USE,
    ElementNode,
    isHTMLElement,
    isInlineDomNode,
} from 'lexical';

/**
 * How you parse your html string to get a document is left up to you. In the browser you can use the native
 * DOMParser API to generate a document (see clipboard.ts), but to use in a headless environment you can use JSDom
 * or an equivalent library and pass in the document here.
 */
declare module 'lexical' {
    interface LexicalNode {
        __className: string;
    }
}

export function $generateNodesFromDOM(
    editor: LexicalEditor,
    dom: Document,
): Array<LexicalNode> {
    const elements = dom.body ? dom.body.childNodes : [];
    let lexicalNodes: Array<LexicalNode> = [];
    const allArtificialNodes: Array<ArtificialNode__DO_NOT_USE> = [];
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!IGNORE_TAGS.has(element.nodeName)) {
            const lexicalNode = $createNodesFromDOM(
                element,
                editor,
                allArtificialNodes,
                false,
            );
            if (lexicalNode !== null) {
                lexicalNodes = lexicalNodes.concat(lexicalNode);
            }
        }
    }
    $unwrapArtificalNodes(allArtificialNodes);

    return lexicalNodes;
}

function getConversionFunction(
    domNode: Node,
    editor: LexicalEditor,
): DOMConversionFn | null {
    const { nodeName } = domNode;

    const cachedConversions = editor._htmlConversions.get(nodeName.toLowerCase());

    let currentConversion: DOMConversion | null = null;

    if (cachedConversions !== undefined) {
        for (const cachedConversion of cachedConversions) {
            const domConversion = cachedConversion(domNode);
            if (
                domConversion !== null &&
                (currentConversion === null ||
                    (currentConversion.priority || 0) < (domConversion.priority || 0))
            ) {
                currentConversion = domConversion;
            }
        }
    }

    return currentConversion !== null ? currentConversion.conversion : null;
}

const IGNORE_TAGS = new Set(['STYLE', 'SCRIPT']);

function $createNodesFromDOM(
    node: Node,
    editor: LexicalEditor,
    allArtificialNodes: Array<ArtificialNode__DO_NOT_USE>,
    hasBlockAncestorLexicalNode: boolean,
    forChildMap: Map<string, DOMChildConversion> = new Map(),
    parentLexicalNode?: LexicalNode | null | undefined,
): Array<LexicalNode> {
    let lexicalNodes: Array<LexicalNode> = [];

    if (IGNORE_TAGS.has(node.nodeName)) {
        return lexicalNodes;
    }

    let currentLexicalNode = null;
    const transformFunction = getConversionFunction(node, editor);
    const transformOutput = transformFunction
        ? transformFunction(node as HTMLElement)
        : null;
    let postTransform = null;

    if (transformOutput !== null) {
        postTransform = transformOutput.after;
        const transformNodes = transformOutput.node;
        currentLexicalNode = Array.isArray(transformNodes)
            ? transformNodes[transformNodes.length - 1]
            : transformNodes;

        if (currentLexicalNode !== null) {
            for (const [, forChildFunction] of forChildMap) {
                currentLexicalNode = forChildFunction(
                    currentLexicalNode,
                    parentLexicalNode,
                );

                if (!currentLexicalNode) {
                    break;
                }
            }

            if (currentLexicalNode) {
                preserveClassNames(node, currentLexicalNode);

                lexicalNodes.push(
                    ...(Array.isArray(transformNodes)
                        ? transformNodes
                        : [currentLexicalNode]),
                );
            }
        }

        if (transformOutput.forChild != null) {
            forChildMap.set(node.nodeName, transformOutput.forChild);
        }
    }

    // If the DOM node doesn't have a transformer, we don't know what
    // to do with it but we still need to process any childNodes.
    const children = node.childNodes;
    let childLexicalNodes = [];

    const hasBlockAncestorLexicalNodeForChildren =
        currentLexicalNode != null && $isRootOrShadowRoot(currentLexicalNode)
            ? false
            : (currentLexicalNode != null &&
                $isBlockElementNode(currentLexicalNode)) ||
            hasBlockAncestorLexicalNode;

    for (let i = 0; i < children.length; i++) {
        childLexicalNodes.push(
            ...$createNodesFromDOM(
                children[i],
                editor,
                allArtificialNodes,
                hasBlockAncestorLexicalNodeForChildren,
                new Map(forChildMap),
                currentLexicalNode,
            ),
        );
    }

    if (postTransform != null) {
        childLexicalNodes = postTransform(childLexicalNodes);
    }

    if (isBlockDomNode(node)) {
        if (!hasBlockAncestorLexicalNodeForChildren) {
            childLexicalNodes = wrapContinuousInlines(
                node,
                childLexicalNodes,
                $createParagraphNode,
            );
        } else {
            childLexicalNodes = wrapContinuousInlines(node, childLexicalNodes, () => {
                const artificialNode = new ArtificialNode__DO_NOT_USE();
                allArtificialNodes.push(artificialNode);
                return artificialNode;
            });
        }
    }

    if (currentLexicalNode == null) {
        if (childLexicalNodes.length > 0) {
            // If it hasn't been converted to a LexicalNode, we hoist its children
            // up to the same level as it.
            lexicalNodes = lexicalNodes.concat(childLexicalNodes);
        } else {
            if (isBlockDomNode(node) && isDomNodeBetweenTwoInlineNodes(node)) {
                // Empty block dom node that hasnt been converted, we replace it with a linebreak if its between inline nodes
                lexicalNodes = lexicalNodes.concat($createLineBreakNode());
            }
        }
    } else {
        if ($isElementNode(currentLexicalNode)) {
            // If the current node is a ElementNode after conversion,
            // we can append all the children to it.
            currentLexicalNode.append(...childLexicalNodes);
        }
    }

    return lexicalNodes;
}

function wrapContinuousInlines(
    domNode: Node,
    nodes: Array<LexicalNode>,
    createWrapperFn: () => ElementNode,
): Array<LexicalNode> {
    const textAlign = (domNode as HTMLElement).style
        .textAlign as ElementFormatType;
    const out: Array<LexicalNode> = [];
    let continuousInlines: Array<LexicalNode> = [];
    // wrap contiguous inline child nodes in para
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if ($isBlockElementNode(node)) {
            if (textAlign && !node.getFormat()) {
                node.setFormat(textAlign);
            }
            out.push(node);
        } else {
            continuousInlines.push(node);
            if (
                i === nodes.length - 1 ||
                (i < nodes.length - 1 && $isBlockElementNode(nodes[i + 1]))
            ) {
                const wrapper = createWrapperFn();
                wrapper.setFormat(textAlign);
                wrapper.append(...continuousInlines);
                out.push(wrapper);
                continuousInlines = [];
            }
        }
    }
    return out;
}

function $unwrapArtificalNodes(
    allArtificialNodes: Array<ArtificialNode__DO_NOT_USE>,
) {
    for (const node of allArtificialNodes) {
        if (node.getNextSibling() instanceof ArtificialNode__DO_NOT_USE) {
            node.insertAfter($createLineBreakNode());
        }
    }
    // Replace artificial node with it's children
    for (const node of allArtificialNodes) {
        const children = node.getChildren();
        for (const child of children) {
            node.insertBefore(child);
        }
        node.remove();
    }
}

function isDomNodeBetweenTwoInlineNodes(node: Node): boolean {
    if (node.nextSibling == null || node.previousSibling == null) {
        return false;
    }
    return (
        isInlineDomNode(node.nextSibling) && isInlineDomNode(node.previousSibling)
    );
}

function preserveClassNames(domNode: any, lexicalNode: LexicalNode) {
    const domClass = domNode.className || domNode.parentElement.className;
    if (domClass) {
        const writableLexicalNode = lexicalNode.getWritable();
        writableLexicalNode.__className = domClass;
    }
}

export function getClassNames(lexicalNode: LexicalNode): string {
    if ($isElementNode(lexicalNode)) {
        return lexicalNode.__className || '';
    }
    return '';
}
