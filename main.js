'use strict';
const { app, Menu, BrowserWindow, globalShortcut, clipboard, Tray } = require('electron')
const electron = require('electron')
const ipc = require('electron').ipcMain
const storage = require('electron-json-storage')
const url = require('url')
const path = require('path')
const robot = require('robotjs')

let clipboardWindow = null;
let tray = null;
let aboutWindow = null;
let last_copied_val = "";
let defaultHeight;
let contextMenu;
let isDisabled_btnClearClipboard = false;
let clipboardKey = "mclipboard";
let defaultWidth = 250;
// init main
function initMain() {
    if (isSecondInstance()) {
        app.quit();
    }
    initClipboardWindow();
    initTray();

    // hide on blur
    clipboardWindow.on('blur', function (event) {
        event.preventDefault()
        clipboardWindow.minimize();
    });

    // Check for changes at an interval.
    setInterval(check_clipboard_for_changes, 500);

    globalShortcut.register('CommandOrControl+O', () => {
        showClipboard();
    })


}

function check_clipboard_for_changes() {
    let item = electron.clipboard.readText(String);
    if (last_copied_val !== item && item.trim().replace(/\s/g, "") != "") {
        copyToClipboard(item);
        last_copied_val = item;
    }
}
ipc.on('paste-command', (event, arg) => {
    clipboardWindow.minimize();
    clipboard.writeText(arg);
    robot.keyTap("v", "control");
    //event.sender.send('asynchronous-reply', 'pong')
})

function showClipboard() {
    let arr = [];
    storage.get(clipboardKey, function (error, data) {
        //console.log(data)
        if (error) throw error;
        if (data && data.mclipboard) {
            arr = data.mclipboard;
        }
        let point = electron.screen.getCursorScreenPoint();
        clipboardWindow.showInactive();
        //clipboardWindow.show();
        //clipboardWindow.setBounds({width:defaultWidth,height:defaultHeight, x: point.x+10, y:20},false)
        clipboardWindow.setPosition(point.x + 10, 20, false);
        //clipboardWindow.show();
        clipboardWindow.focus();
        clipboardWindow.webContents.focus();
        clipboardWindow.webContents.send('sendclipboard', arr);
    });
}

function initClipboardWindow() {
    let screenSize = electron.screen.getPrimaryDisplay().size;
    defaultHeight = screenSize.height - 40;
    clipboardWindow = new BrowserWindow({
        maxWidth: defaultWidth, minWidth: defaultWidth, minHeight: defaultHeight,
        backgroundThrottling: false, show: false, hasShadow: true, skipTaskbar: true,
        thickFrame: false, frame: false

    })
    clipboardWindow.setMenu(null)
    clipboardWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Emitted when the window is closed.
    clipboardWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        clipboardWindow = null
    })
}

function showAboutWindow() {
    // lazy-loading
    if (aboutWindow == null) {
        aboutWindow = new BrowserWindow({
            width: 400, height: 300,
            backgroundThrottling: false, show: false, thickFrame: false,
            hasShadow: true, resizable: false, maximizable: false, minimizable: false,
            alwaysOnTop: true,
            frame: true, skipTaskbar: true
        })
        aboutWindow.setMenu(null)
        aboutWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'about.html'),
            protocol: 'file:',
            slashes: true
        }))
    }
    aboutWindow.show();
    // Emitted when the window is closed.
    aboutWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        aboutWindow = null
    })
}

function initTray() {
    tray = new Tray("./images/clipboard2.png")
    const template = [
        {
            label: 'About', click: function () {
                showAboutWindow();
            }
        }, {
            label: 'Clear Clipboard', click: function () {
                clearClipboard();
            }
        }, {
            label: 'Quit', click: function () {
                app.quit();
            }
        }
    ]
    contextMenu = Menu.buildFromTemplate(template)

    tray.setToolTip('')
    tray.setContextMenu(contextMenu)
}

function clearClipboard() {
    storage.remove(clipboardKey, function (error) {
        if (error) throw error;
        btnClearClipboard("disable");
    });
}

function btnClearClipboard(action) {
    if (action == "enable") {
        contextMenu.items[1].enabled = true;
        isDisabled_btnClearClipboard = false;
    } else if (action == "disable") {
        contextMenu.items[1].enabled = false;
        isDisabled_btnClearClipboard = true;
    }
}
function copyToClipboard(item) {
    let arr = [];
    //const dataPath = storage.getDataPath();
    //console.log(dataPath);

    // get arr from system
    storage.get(clipboardKey, function (error, data) {
        if (error) throw error;
        if (data && data.mclipboard) {
            arr = data.mclipboard;
        }

        //remove duplicate of this item
        arr = arr.filter(function (a) { return a != item });

        // push new item to first position and maintain max arr size to x
        arr.unshift(item);
        while (arr.length > 50) {
            arr.pop();
        }

        // store the arr back to system
        storage.set(clipboardKey, { mclipboard: arr }, function (error) {
            if (error) throw error;
            if (isDisabled_btnClearClipboard) {
                btnClearClipboard("enable");
            }
        });
    });
}

app.on('ready', initMain)

function isSecondInstance() {
    const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (clipboardWindow) {
            // no need to restore as our app starts in minimized state
            //   if (clipboardWindow.isMinimized()) clipboardWindow.restore()
            //   clipboardWindow.focus()
        }
    })
    return isSecondInstance;
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (clipboardWindow === null) {
        initMain()
    }
})