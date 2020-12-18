const { app, BrowserWindow } = require('electron')

const os = require('os-utils')

const express = require('express')
const http = require('http')
const expressApp = express()
const server = http.createServer(expressApp)
const socket = require('socket.io')
const io = socket(server)


let mainWindow = null
let link = "initial link value"
let cmdArr = null
const appVersion = app.getVersion()
const singleInstanceLock = app.requestSingleInstanceLock()
let cpuData = null
let memData = null
let totalMemData = null


let clientId = null
function bootSocketServer(id) {
  if (!clientId) {
    mainWindow.webContents.executeJavaScript(`console.log("bootSocketServer called with ${id}")`)
    clientId = id
    io.on('connection', socket => {
      mainWindow.webContents.executeJavaScript('console.log("connection handler entered")')
      socket.on('get cpu', () => {
        socket.emit('cpu data', cpuData)
        mainWindow.webContents.executeJavaScript(`console.log("emit cpu data ${cpuData} to ${clientId}")`)
      })
    })
    server.listen(8000, () => {
      mainWindow.webContents.executeJavaScript('console.log("socket server is running on port 8000")')
    })
  }
}


if (!singleInstanceLock) {
  app.quit();
}
else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    cmdArr = commandLine
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
      if (mainWindow.webContents) {
        // everything after 'du-web-protocol-electron-socket-server://'
        bootSocketServer(cmdArr[2].substr(41))
        mainWindow.webContents.executeJavaScript(`console.log("from second-instance: ${commandLine}")`)
      }
    }
    if (cmdArr && cmdArr[2] && cmdArr[2] == 'du-web-protocol-electron-socket-server://close/') {
      cleanUpAndQuit()
    }
  })
}

let cpuInterval = setInterval(() => {
  try {
    if (os) {
      os.cpuUsage(v => {
        try { // <-- this one did the trick, eventually. look into it later
          cpuData = v * 100
          memData = os.freememPercentage() * 100
          totalMemData = os.totalmem() / 1024
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('cpu', v * 100)
            mainWindow.webContents.send('mem', os.freememPercentage() * 100)
            mainWindow.webContents.send('total-mem', os.totalmem() / 1024)
          }
        } catch (e) {
          // hmm
        }
      })
    }
  } catch (e) {
    // hmm
  }
}, 200)

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('index.html')

  mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('du-link', link)
    mainWindow.webContents.send('du-appVersion', appVersion)
  })

  if (process.platform == 'win32') {
    let argv = process.argv
    if (mainWindow && mainWindow.webContents) {
      // everything after 'du-web-protocol-electron-socket-server://'
      bootSocketServer(argv[2].substr(41))
      mainWindow.webContents.executeJavaScript(`console.log("from createWindow: ${argv}")`)
    }
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    cleanUpAndQuit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.setAsDefaultProtocolClient('du-web-protocol-electron-socket-server')

const cleanUpAndQuit = () => {
  if (mainWindow) {
    mainWindow.close()
  }
  if (cpuInterval) {
    clearInterval(cpuInterval)
  }
  if (clientId && server) {
    server.close()
  }
  app.quit()
}