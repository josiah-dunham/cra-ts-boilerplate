import { app, BrowserWindow, ipcMain, Tray, screen } from 'electron'
import * as path from 'path'
import * as isDev from 'electron-is-dev'
// import { watchmanChange, startWatching, fetchWatchmanInput } from "./watcher/watchman";
import { initialize } from './localDB/store'
import { constants } from './helpers/constants'
import { initializeDBAndFS, initializeWatcher } from './initializeAppParts'
const ProjectWiseICON = __dirname + "/assets/images/ProjectWise.ico"


export enum SyncActionType {
  Create,
  Update,
  Delete,
  Move,
}

// Beacuse I've been getting inconsistent tray bounds: (https://github.com/electron/electron/issues/17852)
// I'm going to hardcode some values - it's a difference of if the little extra menu is out or not.

const WINDOWS_BOTTOM_TRAY_HEIGHT = 1040 // this isn't going to work because of differing screen heights...
const { ROOT_WATCH_DIRECTORY, TRAY_ICON_PATH } = constants
let watchmanOutput, historyLog
let mainWindow: BrowserWindow
let tray: Tray

function createWindow(): void {
  // const browserWidowDebugOptions = {
  //   show: true,
  //   frame: true,
  //   fullscreenable: true,
  //   resizable: true,

  //   skipTaskbar: false,
  // }

  const browserWindowTrayOptions = {
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
  }

  mainWindow = new BrowserWindow({
    width: 450,
    height: 600,
    webPreferences: { nodeIntegration: true },
    transparent: true,
    ...browserWindowTrayOptions,
  })

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../index.html')}`,
  )
  mainWindow.on('closed', () => (mainWindow = null))
  mainWindow.on('blur', () => {
    // for debugging I need to have the window open..
    // mainWindow.hide();
  })
}

function createTray(): void {
  tray = new Tray(ProjectWiseICON)
  // we are not supposed to use the on click event... because if we click else where on the desktop,
  // it should toggle.
  tray.on('click', function(event) {
    toggleWindow()
  })
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    showWindow()
  }
}

// https://github.com/electron/electron/issues/10069
// flicker...
// workaround: https://github.com/electron/electron/issues/10069#issuecomment-482052649
function showWindow() {
  const position = getWindowPosition()
  mainWindow.setOpacity(0)

  mainWindow.setPosition(position.x, position.y)
  mainWindow.show()
  mainWindow.focus()
  setTimeout(() => {
    mainWindow.setOpacity(1)
  }, 1000 / 60)
}

function getWindowPosition(): WindowCoordinates {
  const windowBounds = mainWindow.getBounds()
  const trayBounds = tray.getBounds()

  const taskBarPosition = getTaskBarPosition()
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  // console.log("\nprimary display work area size: ", width, height, "\n");
  let x, y

  // tray.getBounds() when the taskbar located bottom
  // { x: 1696, y: 1040, width: 24, height: 40 }

  // tray.getBounds() when the taskbar located top
  // { x: 1696, y: 0, width: 24, height: 40 }

  // tray.getBounds() when the taskbar located left
  // { x: 9, y: 909, width: 24, height: 24 }

  // tray.getBounds() when the taskbar located right
  // { x: 1863, y: 909, width: 24, height: 24 }

  switch (taskBarPosition) {
    case 'top':
      x = Math.round(
        trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2,
      )
      y = Math.round(trayBounds.y + trayBounds.height + 3)
      break
    case 'bottom':
      x = Math.round(width - windowBounds.width - 20)
      y = Math.round(height - windowBounds.height - trayBounds.height)

    default:
      break
  }

  return {
    x,
    y,
  }
}

// this is a first guess = I think we can account for different screen
// sizes... eh for now let's just return bottom...
function getTaskBarPosition(): 'top' | 'bottom' | 'left' | 'right' {
  const trayBounds = tray.getBounds()

  // if (trayBounds.y === 0) return "top";
  // if (trayBounds.x < 10) return "left";
  // if (trayBounds.width === trayBounds.height) return "right";
  return 'bottom'
}

// hide in main dock/taskbar
app.dock && app.dock.hide()

app.on('ready', async () => {
  createWindow()
  createTray()
  // showWindow()

  await initializeDBAndFS()

  // mainWindow.webContents.openDevTools();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('fetchDataSourceContents', () => {
  initialize()
})

ipcMain.on('show-window', () => {
  showWindow()
})

export function sendFileProgressToFrontEnd(
  instanceId: string,
  instanceName: string,
  instancePath: string,
) {
  return async function(receivedLength, contentLength) {
    await mainWindow.webContents.send(
      'update-file-progress',
      instanceId,
      instanceName,
      instancePath,
      receivedLength,
      contentLength,
    )
  }
}
