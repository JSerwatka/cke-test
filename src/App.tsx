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
  const [exportHTML, setExportHTML] = useState("");
  const HTMLTextareaValue = "<p>Please edit me</p>" 
  const [isRawMode, setIsRawMode] = useState(false);

  return (
    <div className="App">
      <div style={{"backgroundColor": "rgb(239 204 141)", "padding": "10px", "border": "1px solid black"}}>
        <label htmlFor="raw-mode">Raw Mode?</label>
        <input id="raw-mode" type="checkbox" onChange={(e) => setIsRawMode(e.target.checked)}  />
      </div>
      {isRawMode ? <HTMLRawEditor setExportHTML={setExportHTML} isSaving={isSaving} setIsSaving={setIsSaving} /> : (
      <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-shell">
        <Editor isSaving={isSaving} setIsSaving={setIsSaving} setExportHTML={setExportHTML} htmlTextareaValue={HTMLTextareaValue} />
      </div>
    </LexicalComposer>
      )} 
      <div>
        <button onClick={() => setIsSaving(true)}>Export</button>
        {exportHTML && (
              <div style={{"backgroundColor": "rgb(193 231 198)", "border": "1px solid black", "marginTop": "20px"}}>
                <div style={{"marginBottom": "15px", "fontSize": "18px", backgroundColor: "white", "padding": "10px"}}>Exported HTML</div>
                <div style={{"padding": "10px ", "whiteSpace": "pre-wrap"}}>{exportHTML}</div>
              </div>
          )}  

      </div>

    </div>
  );
}

export default App;
