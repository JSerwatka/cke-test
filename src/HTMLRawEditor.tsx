import React, { useState, useEffect, useDeferredValue } from 'react';

const HTMLRawEditor = () => {
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const deferredHtml = useDeferredValue(html);

  useEffect(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(deferredHtml, 'text/html');
      const errorNode = doc.querySelector('parsererror');

      if (errorNode) {
        throw new Error('HTML parsing error');
      }
      setError(null);
    } catch (err) {
        console.log({err});
      setError((err as Error).message);
    }
  }, [deferredHtml]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtml(e.target.value);
  };

  return (
    <div style={containerStyle}>
      <textarea
        style={textareaStyle}
        value={html}
        onChange={handleChange}
        placeholder="Enter your HTML here..."
      />
      <div style={previewContainerStyle}>
        {error ? (
          <div style={errorStyle}>{error}</div>
        ) : (
          <iframe
            style={iframeStyle}
            srcDoc={deferredHtml}
            title="HTML Preview"
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  );
};

export default HTMLRawEditor;

const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
  };

  const textareaStyle: React.CSSProperties = {
    width: '50%',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '14px',
    borderRight: '1px solid #ccc',
  };

  const previewContainerStyle: React.CSSProperties = {
    width: '50%',
    position: 'relative',
  };

  const errorStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    padding: '16px',
    fontSize: "24px"
  };


  const iframeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: 'none',
  };