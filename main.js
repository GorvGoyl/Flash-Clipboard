'use strict';
const { app, Menu, BrowserWindow, globalShortcut, clipboard, Tray } = require('electron')
const electron = require('electron')
const ipc = require('electron').ipcMain
const storage = require('electron-json-storage')
const url = require('url')
const path = require('path')
const robot = require('robotjs')
const config = require('./config')
const { autoUpdater } = require('electron-updater')
const isDev = require('electron-is-dev');


let clipboardWindow = null;
let tray = null;
let aboutWindow = null;
let last_copied_val = "";
let contextMenu;
let intervalId;
let isDisabled_btnClearClipboard = false;
let mouseMargin = 20;
let screenMargin = 40;
let tray_isPause = false;
//https://github.com/electron/electron/blob/master/docs/api/accelerator.md
let KEY_OPEN = 'CmdOrCtrl+Shift+O';
// init main
function initMain() {
    if (isSecondInstance()) {
        app.quit();
    }
    initClipboardWindow();
    initTray();
    if (tray) {
        tray.on("double-click", function () {
            tray.popUpContextMenu();
        });
    }
    // hide on blur
    clipboardWindow.on('blur', function (event) {
        //clipboardWindow.webContents.send('clearHtmlList');
        hideClipboardWindow();
    });


    // Check for changes at an interval.
    intervalId = setInterval(check_clipboard_for_changes, config.TIMEDELAY);

    globalShortcut.register(KEY_OPEN, () => {
        showClipboardWindow();
    })


}

function check_clipboard_for_changes() {
    let item = electron.clipboard.readText(String);
    if (last_copied_val !== item && item.trim().replace(/\s/g, "") != "") {
        copyToClipboard(item);
        last_copied_val = item;
    }
}


function showClipboardWindow() {
    let arr = [];
    storage.get(config.CLIPBOARDKEY, function (error, data) {
        if (error) throw error;
        if (data && data.mclipboard) {
            arr = data.mclipboard;
        }
        clipboardWindow.show();
        clipboardWindow.webContents.focus();
        clipboardWindow.webContents.send('sendclipboard', arr);
    });
}
ipc.on('paste-command', (event, arg) => {
    hideClipboardWindow();
    clipboard.writeText(arg);
    robot.keyTap("v", ["command", "control"]);
})
ipc.on('dom-ready-command', (event, height) => {
    //wait for 100ms then show the window.. workaround for flicker effect
    setTimeout(function () {
        let mouse = electron.screen.getCursorScreenPoint();
        let clipwin_y, clipwin_x;
        let screen = electron.screen.getPrimaryDisplay().size;
        clipboardWindow.setSize(config.WIDTH, height, false);
        let clipwin_ht = clipboardWindow.getSize()[1];

        clipwin_x = mouse.x + mouseMargin - Math.max(0, mouse.x + mouseMargin + config.WIDTH - screen.width);

        if (mouse.y - mouseMargin + clipwin_ht <= screen.height - screenMargin)
            clipwin_y = Math.max(mouse.y - mouseMargin, screenMargin);
        else {
            // clip window is partially out of screen so move the window up
            let diff_ht = mouse.y + mouseMargin + clipwin_ht - (screen.height - screenMargin);

            clipwin_y = mouse.y + mouseMargin - diff_ht;
            clipwin_y = Math.max(screenMargin, clipwin_y);
        }

        clipboardWindow.setPosition(clipwin_x, clipwin_y, false);
    }, 100);
})

function hideClipboardWindow() {
    let screen = electron.screen.getPrimaryDisplay().size
    clipboardWindow.setPosition(screen.height, screen.width, false);
    clipboardWindow.minimize();
}
function initClipboardWindow() {
    let screenSize = electron.screen.getPrimaryDisplay().size;
    let maxHeight = screenSize.height - 80;
    clipboardWindow = new BrowserWindow({
        minWidth: config.WIDTH,
        webPreferences: {
            backgroundThrottling: false
        },
        show: false, hasShadow: true, skipTaskbar: true, backgroundColor: "#f5f5f5",
        resizable: false, maxWidth: config.WIDTH, maxHeight: maxHeight, thickFrame: false, frame: false

    })
    clipboardWindow.setMenu(null)
    clipboardWindow.loadURL(url.format({
        pathname: config.CLIPBOARD_WIN_PATH,
        protocol: 'file:',
        slashes: true
    }))
    hideClipboardWindow();

    // Emitted when the window is closed.
    clipboardWindow.on('closed', () => {
        clipboardWindow = null
    })
}

function showAboutWindow() {
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
            pathname: config.ABOUT_WIN_PATH,
            protocol: 'file:',
            slashes: true
        }))
    }
    aboutWindow.show();
    aboutWindow.on('closed', () => {
        aboutWindow = null
    })
}



function clearClipboard() {
    storage.remove(config.CLIPBOARDKEY, function (error) {
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

function pauseplayClipboard() {
    let label;
    // pause clipboard
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        tray_isPause = true;
    } else {
        //resume clipboard
        // prevent currently copied text
        last_copied_val = electron.clipboard.readText(String);
        intervalId = setInterval(check_clipboard_for_changes, config.TIMEDELAY);
        tray_isPause = false;
    }
    tray.destroy();
    initTray();
}


function copyToClipboard(item) {
    let arr = [];

    // get arr from system
    storage.get(config.CLIPBOARDKEY, function (error, data) {
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
        storage.set(config.CLIPBOARDKEY, { mclipboard: arr }, function (error) {
            if (error) throw error;
            if (isDisabled_btnClearClipboard) {
                btnClearClipboard("enable");
            }
        });
    });
}



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


//################################### TRAY EVENTS ##########################//

function initTray() {
    tray = new Tray(getTrayIconPath())
    contextMenu = '';
    const template = [
        {
            label: tray_isPause ? config.TRAY_RESUME_CAPTURE_LABEL : config.TRAY_PAUSE_CAPTURE_LABEL, click: function () {
                pauseplayClipboard();
            }
        }, {
            label: 'Clear Clipboard', click: function () {
                clearClipboard();
            }
        },
        {
            label: 'About', click: function () {
                showAboutWindow();
            }
        }, {
            label: 'Quit', click: function () {
                app.quit();
            }
        }
    ]
    contextMenu = Menu.buildFromTemplate(template)

    tray.setToolTip('MultiCopy Paste' + (tray_isPause ? ' Status: Paused' : ''))
    tray.setContextMenu(contextMenu)
}

function getTrayIconPath() {
    if (config.OS === 'win32')
        return config.TRAY_ICON + '.ico'
    return config.TRAY_ICON + '.png'
}

//######################## APP EVENTS ##########################//

app.on('ready', function () {
    initMain();
    autoUpdater.checkForUpdates();
})
app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (clipboardWindow === null) {
        initMain()
        autoUpdater.checkForUpdates();
    }
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (config.OS !== 'darwin') {
        app.quit()
    }
})





app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPaths
})

//############################# APP UPDATE #############################//
// if (isDev) {
//     autoUpdater.updateConfigPath = path.join(__dirname, 'app-update.yml');
// }
autoUpdater.allowPrerelease = true;

autoUpdater.on('update-downloaded', (info) => {
    // setImmediate(() => {
    //     app.removeAllListeners("window-all-closed")
    //     if (focusedWindow != null) {
    //       focusedWindow.close()
    //     }
    //     autoUpdater.quitAndInstall(false)
    //   })
    setImmediate(() => autoUpdater.quitAndInstall(true, true))
    //autoUpdater.quitAndInstall(true,true); 
})

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err);
})

function sendStatusToWindow(e) { console.log(e) }