"use client";
import React, { useState, useRef, useEffect } from "react";

export default function Home() {
  const [files, setFiles] = useState([]); // {file, previewUrl, id}
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dragItem = useRef();
  const dragOverItem = useRef();

  useEffect(() => {
    return () => {
      // revoke object URLs on unmount
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
  }, [files]);

  function addFilesFromFileList(fileList) {
    const arr = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).slice(2, 9),
      file: f,
      previewUrl: f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".heic")
        ? URL.createObjectURL(f)
        : null,
    }));
    setFiles((prev) => [...prev, ...arr]);
  }

  function handleInputChange(e) {
    addFilesFromFileList(e.target.files || []);
  }

  function handleDrop(e) {
    e.preventDefault();
    addFilesFromFileList(e.dataTransfer.files || []);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function onDragStart(e, position) {
    dragItem.current = position;
  }

  function onDragEnter(e, position) {
    dragOverItem.current = position;
  }

  function onDragEnd() {
    const copyListItems = [...files];
    const dragIndex = dragItem.current;
    const dropIndex = dragOverItem.current;
    if (dragIndex === undefined || dropIndex === undefined) return;
    const dragItemContent = copyListItems.splice(dragIndex, 1)[0];
    copyListItems.splice(dropIndex, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setFiles(copyListItems);
  }

  function removeFile(id) {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f && f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function handleSubmit(e) {
    e && e.preventDefault();
    setError("");
    setResult("");
    if (!files.length) {
      setError("Please add at least one image file first.");
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append("file", f.file));

    setLoading(true);
    try {
      const res = await fetch("/api/process", { method: "POST", body: formData });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Request failed");
      }
      const data = await res.json();
      setResult(data.text || "");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
    } catch (err) {
      setError("Failed to copy to clipboard.");
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: "28px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Note Digitizer</h1>
      <p style={{ marginTop: 0, marginBottom: 16 }}>
        Upload photos of your handwritten notes. Reorder them by dragging, then click Convert to get a
        single Markdown transcription.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: "2px dashed #ddd",
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <input
          type="file"
          accept="image/*,.heic"
          multiple
          onChange={handleInputChange}
          style={{ display: "block", marginBottom: 8 }}
        />
        <div style={{ fontSize: 13, color: "#666" }}>Or drag & drop images here — reorder by dragging items.</div>
      </div>

      {files.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {files.map((f, idx) => (
            <div
              key={f.id}
              draggable
              onDragStart={(e) => onDragStart(e, idx)}
              onDragEnter={(e) => onDragEnter(e, idx)}
              onDragEnd={onDragEnd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 8,
                border: "1px solid #eee",
                borderRadius: 6,
                background: "#000000",
              }}
            >
              {f.previewUrl ? (
                <img src={f.previewUrl} alt={f.file.name} style={{ width: 86, height: 64, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 86, height: 64, display: "grid", placeItems: "center", background: "#000000" }}>
                  <span style={{ fontSize: 12 }}>{f.file.name}</span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{f.file.name}</div>
                <div style={{ fontSize: 12, color: "#000000" }}>{Math.round(f.file.size / 1024)} KB</div>
              </div>
              <button type="button" onClick={() => removeFile(f.id)} style={{ marginLeft: 8 }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : "Convert"}
        </button>
        <button onClick={() => { setFiles([]); setResult(""); setError(""); }}>
          Clear
        </button>
        <button onClick={handleCopy} disabled={!result}>
          Copy Result
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      {result && (
        <>
          <h2 style={{ marginTop: 20 }}>Result</h2>
          <textarea
            value={result}
            readOnly
            rows={18}
            style={{ width: "100%", fontFamily: "ui-monospace, Menlo, monospace" }}
          />
        </>
      )}
    </main>
  );
}
