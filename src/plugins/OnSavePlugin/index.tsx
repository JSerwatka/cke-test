import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { useEffect } from "react";

function OnSavePlugin({ isSaving, setExportHTML, setIsSaving }: { isSaving: boolean; setExportHTML: React.Dispatch<React.SetStateAction<string>>; setIsSaving: React.Dispatch<React.SetStateAction<boolean>>; }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (isSaving) {
      editor.getEditorState().read(() => {
        setExportHTML($generateHtmlFromNodes(editor, null));
        setIsSaving(false)
      });
    }

  }, [isSaving]);

  return null;
}

export default OnSavePlugin;
