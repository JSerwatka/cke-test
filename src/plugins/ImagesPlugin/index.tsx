/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
} from "lexical";
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { CAN_USE_DOM } from "../../utils/canUseDom";

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  ImagePayload,
} from "../../nodes/ImageNode";
import Button from "../../ui/Button";
import { DialogActions, DialogButtonsList } from "../../ui/Dialog";
import FileInput from "../../ui/FileInput";
import TextInput from "../../ui/TextInput";

export type InsertImagePayload = Readonly<ImagePayload>;

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

export function InsertImageUriDialogBody({
  onClick,
  imageLoading,
}: {
  onClick: (payload: InsertImagePayload) => void;
  imageLoading: boolean;
}) {
  const [src, setSrc] = useState("");
  const [altText, setAltText] = useState("");

  const isDisabled = src === "" || imageLoading;
  const buttonText = imageLoading ? 'Uploading...' : 'Confim';

  return (
    <>
      <TextInput
        label="Image URL"
        placeholder="i.e. https://source.unsplash.com/random"
        onChange={setSrc}
        value={src}
        data-test-id="image-modal-url-input"
      />
      <TextInput
        label="Alt Text"
        placeholder="Random unsplash image"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      <DialogActions>
        <Button
          data-test-id="image-modal-confirm-btn"
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageUploadedDialogBody({
  onClick,
  imageLoading
}: {
  onClick: (payload: InsertImagePayload) => void;
  imageLoading: boolean;
}) {
  const [src, setSrc] = useState("");
  const [altText, setAltText] = useState("");

  const isDisabled = src === "" || imageLoading;
  const buttonText = imageLoading ? 'Uploading...' : 'Confim';

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader();
    reader.onload = function () {
      if (typeof reader.result === "string") {
        setSrc(reader.result);
      }
      return "";
    };
    if (files !== null) {
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <>
      <FileInput
        label="Image Upload"
        onChange={loadImage}
        accept="image/*"
        data-test-id="image-modal-file-upload"
      />
      <TextInput
        label="Alt Text"
        placeholder="Descriptive alternative text"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      <DialogActions>
        <Button
          data-test-id="image-modal-file-upload-btn"
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [mode, setMode] = useState<null | "url" | "file">(null);
  const [imageLoading, setImageLoading] = useState(false);
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [activeEditor]);

  const onClick = async (payload: InsertImagePayload) => {
    setImageLoading(true);
    let { altText, src } = payload;

    const imgUploaded = await cloudinaryUpload(src);
    if (imgUploaded.error || !imgUploaded.url) {
      throw new Error('Failed to upload image');
    }

    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, { altText, src: imgUploaded.url });
    setImageLoading(false);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id="image-modal-option-url"
            onClick={() => setMode("url")}
          >
            URL
          </Button>
          <Button
            data-test-id="image-modal-option-file"
            onClick={() => setMode("file")}
          >
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === "url" && <InsertImageUriDialogBody onClick={onClick} imageLoading={imageLoading} />}
      {mode === "file" && <InsertImageUploadedDialogBody onClick={onClick} imageLoading={imageLoading} />}
    </>
  );
}

export default function ImagesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor");
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }
            
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event);
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor]);

  return null;
}

const TRANSPARENT_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const img = document.createElement("img");
img.src = TRANSPARENT_IMAGE;

function $onDragStart(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData("text/plain", "_");
  dataTransfer.setDragImage(img, 0, 0);
  dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        width: node.__width,
      },
      type: "image",
    })
  );

  return true;
}

function $onDragover(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return true;
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
  }
  return true;
}

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData("application/x-lexical-drag");
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== "image") {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest("code, span.editor-image") &&
    target.parentElement &&
    target.parentElement.closest("div.ContentEditable__root")
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const target = event.target as null | Element | Document;
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
      ? (target as Document).defaultView
      : (target as Element).ownerDocument.defaultView;
  const domSelection = getDOMSelection(targetWindow);
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}

export interface ImageUploadResponse {
  error: boolean;
  url?: string;
}

export async function cloudinaryUpload(image: string | Blob) {
  return new Promise<ImageUploadResponse>((resolve, reject) => {
    const cloudinaryPreset = "keepmoving-dev";
      if (!cloudinaryPreset) {
          return reject(new Error("No cloudinary preset defined"));
      }

      const cloudName = "energylab";

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

      xhr.onerror = (e) => {
          console.error(e);
          reject(new Error("Error during upload"));
      };

      xhr.onreadystatechange = () => {
          if (xhr.readyState === 4 && xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              const responseUrl = response.secure_url;

              return resolve({
                  error: false,
                  url: responseUrl
              });
          }
      };

      fd.append("upload_preset", cloudinaryPreset);
      fd.append("tags", "admin_upload");
      fd.append("file", image);
      xhr.send(fd);
  });
}

