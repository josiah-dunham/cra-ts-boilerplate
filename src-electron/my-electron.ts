import { app, BrowserWindow } from "electron";
import * as isDev from "electron-is-dev";

import * as path from "path";

let mainWindow: any;

if(isDev) {
  console.log("this is dev!!")
}
else {
  console.log("this is NOT dev")
}

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 680,
    webPreferences: {
      nodeIntegration: true,
    },
    width: 900,
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../index.html")}`,
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", (): any => (mainWindow = null));
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
