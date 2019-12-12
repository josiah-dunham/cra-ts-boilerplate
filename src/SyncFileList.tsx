import React from "react";
import { shell } from "electron";
import { ProgressBar } from "@bentley/bwc-react/core/ProgressIndicators";

const Download = require("./assets/download.png");
const Upload = require("./assets/upload.png");
const Folder = require("./assets/FolderOpen.ico");
const Checkmark = require("./assets/Checkmark.ico");

export function SyncFileList({ files, clearList }) {
  return (
    <>
      <h2>File List</h2>
      <span onClick={clearList}>Clear List</span>
      <ul style={{ listStyle: "none", padding: 0, fontSize: 14 }}>
        {files
          .sort((a, b) => a.position < b.position)
          .map((file, index) => (
            <SyncFileListItem key={index} file={file} />
          ))}
      </ul>
    </>
  );
}

function SyncFileListItem({ file }) {
  return (
    <li
      style={{
        margin: 0,
        padding: "0 0 10px 0",
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
        color: calculateColor(file)
      }}
    >
      <span>{file.name} </span>
      <ProgressBar value={file.progress} />
      <span style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
        <span style={{ cursor: "pointer" }} onClick={() => goToFile(file.path)}>
          <img src={Folder} width="26px" height="26px" />
        </span>
        <span>{getFileActionIcon(file.action, file.progress)}</span>
      </span>
    </li>
  );
}

function goToFile(filePath) {
  shell.showItemInFolder(filePath);
}

// this should change to a green checkmark if finished.
function getFileActionIcon(action: "download" | "upload", fileProgress: string) {
  return (
    <img
      style={{ width: 26, height: 26 }}
      src={parseInt(fileProgress) === 100 ? Checkmark : action === "download" ? Download : Upload}
    />
  );
}

function calculateColor(file) {
  if (parseInt(file.progress) === 100) {
    return "green";
  }

  if (parseInt(file.progress) === 0) {
    return "red";
  }

  return "orangered";
}
