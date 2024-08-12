import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { useEffect } from "react";

function OnSavePlugin({ isSaving }: { isSaving: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.getEditorState().read(() => {
      console.log($generateHtmlFromNodes(editor, null));
    });
  }, [isSaving]);

  return null;
}

export default OnSavePlugin;
