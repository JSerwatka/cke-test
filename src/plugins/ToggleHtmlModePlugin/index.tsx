import React, { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $setSelection, COMMAND_PRIORITY_LOW, LexicalCommand, createCommand } from 'lexical';
import {
    generateContent,
    useLexicalCommandsLog
  } from '@lexical/devtools-core';

  export const TOGGLE_HTML_MODE_COMMAND: LexicalCommand<boolean> =
  createCommand("TOGGLE_HTML_MODE_COMMAND");

const HtmlTogglePlugin = () => {
    const [editor] = useLexicalComposerContext();
    const [isHTML, setIsHTML] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const commandsLog = useLexicalCommandsLog(editor);
    const htmlContentRef = useRef<string>("");

    const handleHtmlChange = (e:any) => {
        setHtmlContent(e.target.value);
        htmlContentRef.current = e.target.value
    };

    useEffect(() => {
      editor.registerCommand(
        TOGGLE_HTML_MODE_COMMAND,
        (isHtmlMode) => {
          setIsHTML(isHtmlMode);
          if (isHtmlMode) {
            // Switch from normal to HTML mode
            editor.update(() => {
              const html = generateContent(editor, commandsLog, true);
              setHtmlContent(html);
            });
          } else {
            // Switch from HTML to normal mode
            editor.update(() => {
              const parser = new DOMParser();
              const dom = parser.parseFromString(htmlContentRef.current, 'text/html');
              const nodes = $generateNodesFromDOM(editor, dom);
              $getRoot().clear();
              $getRoot().append(...nodes);
              $setSelection(null);
            });
          }
          return true;
        },
        COMMAND_PRIORITY_LOW
      );
    }, [editor, commandsLog, htmlContent]);


    return (
      <>
        {isHTML && (
          <textarea
            value={htmlContent}
            onChange={handleHtmlChange}
            style={{
              resize: "none",
              width: "99.4%",
              height: "96%",
              zIndex: 10,
              position: "absolute",
              top: 0,
              left: 0,
              overflow: "auto"
            }}
          />
        )}
      </>
      );
};

export default HtmlTogglePlugin;