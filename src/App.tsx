import "./App.css";
import Editor from "./Editor";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import PlaygroundEditorTheme from "./themes/PlaygroundEditorTheme";
import PlaygroundNodes from "./nodes/PlaygroundNodes";

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
  return (
    <div className="App">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-shell">
          <Editor />
        </div>
      </LexicalComposer>
    </div>
  );
}

export default App;
