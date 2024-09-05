import Editor from "./Editor";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import PlaygroundEditorTheme from "./themes/PlaygroundEditorTheme";
import PlaygroundNodes from "./nodes/PlaygroundNodes";
import { useState } from "react";
import {  ParagraphNode, TextNode } from "lexical";
import { ExtendedTextNode } from "./nodes/ExtendedTextNode";
import { ExtendedQuoteNode } from "./nodes/ExtendedQuoteNode";
import { QuoteNode } from '@lexical/rich-text';
import HTMLRawEditor from "./HTMLRawEditor";
import { ExtendedParagraphNode } from "./nodes/ExtendedParagraphNode";

function App() {
  const initialConfig = {
    editorState: null,
    namespace: "Playground",
    nodes: [
      ...PlaygroundNodes,
      {
        replace: TextNode,
        with: (node: TextNode) => new ExtendedTextNode(node.__text),
      },
      {
        replace: QuoteNode,
        with: (node: QuoteNode) => new ExtendedQuoteNode(),
      },
      {
        replace: ParagraphNode,
        with: (node: ParagraphNode) => {
          return new ExtendedParagraphNode();
        }
      }
    ],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };
  const [isSaving, setIsSaving] = useState(false);
  const [HTMLTextareaValue, setHTMLTextareaValue] = useState("");
  const [isRawMode, setIsRawMode] = useState(false);

  return (
    <div className="App">
      <textarea onChange={(e) => setHTMLTextareaValue(e.target.value)}>
        {HTMLTextareaValue}
      </textarea>
      <p></p>
      <label htmlFor="raw-mode">Raw Mode?</label>
      <input id="raw-mode" type="checkbox" onChange={(e) => setIsRawMode(e.target.checked)}  />
      {isRawMode ? <HTMLRawEditor /> : (
      <LexicalComposer initialConfig={initialConfig}>
      <button onClick={() => setIsSaving(true)}>Save</button>
      <div className="editor-shell">
        <Editor isSaving={isSaving} htmlTextareaValue={HTMLTextareaValue} />
      </div>
    </LexicalComposer>
      )} 

    </div>
  );
}

export default App;
