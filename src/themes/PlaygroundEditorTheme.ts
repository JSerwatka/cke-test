/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EditorThemeClasses } from 'lexical';

import './PlaygroundEditorTheme.css';

const theme: EditorThemeClasses = {
  image: 'editor-image',
  quote: 'PlaygroundEditorTheme__quote',
  text: {
    code: 'PlaygroundEditorTheme__textCode',
    strikethrough: 'PlaygroundEditorTheme__textStrikethrough',
    underline: 'PlaygroundEditorTheme__textUnderline',
    underlineStrikethrough: 'PlaygroundEditorTheme__textUnderlineStrikethrough',
  },
};

export default theme;
