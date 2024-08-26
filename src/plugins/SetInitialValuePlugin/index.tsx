import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, CLEAR_HISTORY_COMMAND } from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { useLayoutEffect } from "react";

function addBackwardsCompatiblity(html: string) {
  let htmlClean;

  htmlClean = html.replaceAll("\\n", ""); 
  htmlClean = htmlClean.replaceAll("\\t", ""); 

  return htmlClean;
}

const SetInitialValuePlugin: React.FC<{ initHtml: string }> = ({
  initHtml = "",
}) => {
  const [editor] = useLexicalComposerContext();

  useLayoutEffect(() => {
    if (editor && initHtml) {
      editor.update(() => {
        const content = $generateHtmlFromNodes(editor, null);

        if (!!initHtml && content !== initHtml) {
          const initHtmlClean = addBackwardsCompatiblity(initHtml);

          const parser = new DOMParser();
          const dom = parser.parseFromString(initHtmlClean, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          console.log("output nodes", nodes);

          const root = $getRoot();
          root.clear();

          const selection = root.select();
          selection.removeText();
          selection.insertNodes(nodes);
          editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
        }
      });
    }
  }, [initHtml]);

  return null;
};

export default SetInitialValuePlugin;
