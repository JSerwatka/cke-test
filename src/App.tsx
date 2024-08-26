import "./App.css";
import Editor from "./Editor";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import PlaygroundEditorTheme from "./themes/PlaygroundEditorTheme";
import PlaygroundNodes from "./nodes/PlaygroundNodes";
import { useState } from "react";
import { TextNode } from "lexical";
import { ExtendedTextNode } from "./nodes/ExtendedTextNode";

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
    ],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };
  const [isSaving, setIsSaving] = useState(false);
  const [HTMLTextareaValue, setHTMLTextareaValue] = useState("");

  return (
    <div className="App">
      <textarea onChange={(e) => setHTMLTextareaValue(e.target.value)}>
        {HTMLTextareaValue}
      </textarea>
      <p></p>
      <LexicalComposer initialConfig={initialConfig}>
        <button onClick={() => setIsSaving(true)}>Save</button>
        <div className="editor-shell">
          <Editor isSaving={isSaving} htmlTextareaValue={HTMLTextareaValue} />
        </div>
      </LexicalComposer>
    </div>
  );
}

export default App;
