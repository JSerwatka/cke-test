
// HTML to Editor
export function preserveStyleTag(dom: Document): void {
    const styleTag = dom.querySelector('style');
    const editorElement = document.querySelector(".editor-shell");

    editorElement?.querySelectorAll('style').forEach(style => style.remove());

    if (styleTag && editorElement) {
        editorElement.appendChild(styleTag);
    }
}


// Editor to HTML
export function getStyleTagToString(): string {
    const styleTag = document.querySelector('.editor-shell > style');
    if (!styleTag) {
        return "";
    }

    const constent = styleTag.textContent;
    return `<style>${constent}</style>`;
}