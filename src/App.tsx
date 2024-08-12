import "./App.css";
import Editor from "./Editor";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import PlaygroundEditorTheme from "./themes/PlaygroundEditorTheme";
import PlaygroundNodes from "./nodes/PlaygroundNodes";
import { useState } from "react";

function App() {
  const initialConfig = {
    editorState: null,
    namespace: "Playground",
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="App">
      <LexicalComposer initialConfig={initialConfig}>
        <button onClick={() => setIsSaving(true)}>Save</button>
        <div className="editor-shell">
          <Editor isSaving={isSaving} />
        </div>
      </LexicalComposer>
    </div>
  );
}

export default App;
