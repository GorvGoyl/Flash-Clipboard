'use strict';
const { app, Menu, BrowserWindow, globalShortcut, clipboard, Tray } = require('electron')
const electron = require('electron')
const ipcMain = require('electron').ipcMain
const storage = require('electron-json-storage')
const url = require('url')
const path = require('path')
const robot = require('robotjs')
const config = require('./js/config')
const { autoUpdater } = require('electron-updater')
const isDev = require('electron-is-dev');
var log = require('electron-log');

let clipboardWindow = null;
let tray = null;
let aboutWindow = null;
let settingsWindow = null;
let last_copied_val = "";
let contextMenu;
let intervalId;
let isDisabled_btnClearClipboard = false;
let mouseMargin = 20;
let screenMargin = 40;
let tray_isPause = false;
//https://github.com/electron/electron/blob/master/docs/api/accelerator.md
// init main
function initMain() {
    if (isSecondInstance()) {
        displayBalloon();
        app.quit();
    }

    initSettings();
    // globalShortcut.register('CmdOrCtrl+Shift+P', () => {
    //     console.log(storage.getDataPath());
    // })

    // Check for changes at an interval.
    intervalId = setInterval(check_clipboard_for_changes, config.TIMEDELAY);
}

// show info after install
function initSettings() {
    storage.get('settings', function (error, obj) {
        if (error) throw error;
        if (isEmpty(obj)) {
            //first run
            //displayBalloon();
            storage.set('settings', config.SETTINGS, function (error) {
                if (error) throw error;
            });
        } else {
            config.SETTINGS = obj;
        }
        loadSettings();
    });

}
function loadSettings() {
    initClipboardWindow();
    initTray();
    registerShortcut(config.SETTINGS.shortcut);
    autoStart(config.SETTINGS.autorun);
}
function check_clipboard_for_changes() {
    let item = electron.clipboard.readText(String);
    if (last_copied_val !== item && item.trim().replace(/\s/g, "") != "") {
        copyToClipboard(item);
        last_copied_val = item;
    }
}

function isEmpty(obj) {
    return (!obj || (Object.keys(obj).length === 0 && obj.constructor === Object));
}

function parseSettings(obj) {
    try {
        obj.items = parseInt(obj.items);
        obj.width = parseInt(obj.width);
        if (!(obj.shortcut.substr(-2, 1) === '+')) { return false; }
        if (isNaN(obj.items) || obj.items > 100) { return false; }
        if (isNaN(obj.width) || obj.width > 1000) { return false; }
    } catch (e) {
        return false;
    }
    return true;
}

ipcMain.on('paste-command', (event, arg) => {
    hideClipboardWindow();
    clipboard.writeText(arg);
    //"command",
    let acc;
    if (config.OSISMAC) acc = ['command']; else acc = ["control"];
    robot.keyTap("v", acc);
})

function showClipboardWindow() {
    let arr = [];
    storage.get(config.CLIPBOARDKEY, function (error, obj) {
        if (error) throw error;
        if (!isEmpty(obj) && !isEmpty(obj.fclipboard)) {
            arr = obj.fclipboard;
        }
        clipboardWindow.webContents.send('sendclipboard', arr);
    });
}

//Set size and position of clipboard window
ipcMain.on('set-size-pos-command', (event, height) => {
    //wait for 100ms then show the window.. workaround for flicker effect
    setTimeout(function () {
        setSizePos(height);
    }, 100);
})
function setSizePos(height) {
    clipboardWindow.show();
    let point = electron.screen.getCursorScreenPoint();
    let screen = electron.screen.getDisplayNearestPoint(point).size;
    clipboardWindow.setPosition(screen.height, screen.width, false);
    clipboardWindow.setSize(config.SETTINGS.width, Math.ceil(height), false);
    let mouse = electron.screen.getCursorScreenPoint();
    let clipwin_y, clipwin_x;


    let clipwin_ht = clipboardWindow.getSize()[1];

    clipwin_x = mouse.x + mouseMargin - Math.max(0, mouse.x + mouseMargin + config.SETTINGS.width - screen.width);

    if (mouse.y - mouseMargin + clipwin_ht <= screen.height - screenMargin)
        clipwin_y = Math.max(mouse.y - mouseMargin, screenMargin);
    else {
        // clip window is partially out of screen so move the window up
        let diff_ht = mouse.y + mouseMargin + clipwin_ht - (screen.height - screenMargin);

        clipwin_y = mouse.y + mouseMargin - diff_ht;
        clipwin_y = Math.max(screenMargin, clipwin_y);
    }

    clipboardWindow.setPosition(clipwin_x, clipwin_y, false);

}
function hideClipboardWindow() {
    let screen = electron.screen.getPrimaryDisplay().size
    clipboardWindow.setPosition(screen.height, screen.width, false);
    clipboardWindow.minimize();
}
function hideSettingsWindow() {
    settingsWindow.hide();
}
function initClipboardWindow() {
    let screenSize = electron.screen.getPrimaryDisplay().size;
    let maxHeight = screenSize.height - 80;
    clipboardWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, '/js/renderer.js')
        },
        useContentSize: true,
        show: false, hasShadow: true, skipTaskbar: true, backgroundColor: "#f5f5f5",
        resizable: false, width: config.SETTINGS.width, maxHeight: maxHeight, thickFrame: false, frame: false

    })
    clipboardWindow.setMenu(null)
    clipboardWindow.loadURL(url.format({
        pathname: config.CLIPBOARD_PAGE,
        protocol: 'file:',
        slashes: true
    }))
    hideClipboardWindow();

    // Emitted when the window is closed.
    clipboardWindow.on('closed', () => {
        clipboardWindow = null
    })

    // hide on blur
    clipboardWindow.on('blur', function (event) {
        //clipboardWindow.webContents.send('clearHtmlList');
        hideClipboardWindow();
    });
}

function initAboutWindow() {
    aboutWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, '/js/renderer.js')
        },
        width: 400,
        title: 'Flash Clipboard - About', center: true,
        useContentSize: true,
        show: false, thickFrame: true,
        hasShadow: true,
        resizable: false, maximizable: false, minimizable: false, alwaysOnTop: true, skipTaskbar: true,
        frame: true
    })
    aboutWindow.setMenu(null)
    aboutWindow.loadURL(url.format({
        pathname: config.ABOUT_PAGE,
        protocol: 'file:',
        slashes: true
    }))
    aboutWindow.on('closed', () => {
        aboutWindow = null
    })
}

function showAboutWindow() {
    if (aboutWindow == null) {
        initAboutWindow();
        aboutWindow.webContents.on('did-finish-load', () => {
            aboutWindow.webContents.send('appversion', app.getVersion());
        })
    } else {
        aboutWindow.webContents.send('appversion', app.getVersion());
    }
}

ipcMain.on('show-about', (event, height) => {
    aboutWindow.setSize(400, Math.ceil(height) + 40, false);
    aboutWindow.show();
})


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
    storage.get(config.CLIPBOARDKEY, function (error, obj) {
        if (error) throw error;
        if (!isEmpty(obj) && !isEmpty(obj.fclipboard)) {
            arr = obj.fclipboard;
        }

        //remove duplicate of this item
        arr = arr.filter(function (a) { return a != item });

        // push new item to first position and maintain max arr size to x
        arr.unshift(item);
        while (arr.length > config.SETTINGS.items) {
            arr.pop();
        }

        // store the arr back to system
        storage.set(config.CLIPBOARDKEY, { fclipboard: arr }, function (error) {
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
            label: 'Settings', click: function () {
                showSettingsWindow();
            }
        }, {
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

    tray.setToolTip('Flash Clipboard' + (tray_isPause ? ' Status: Paused' : ''))
    tray.setContextMenu(contextMenu)
    if (tray) {
        tray.on("double-click", function () {
            tray.popUpContextMenu();
        });
    }
}

function displayBalloon() {
    tray.displayBalloon({ title: 'Flash Clipboard', 'content': 'Access app settings from tray menu.' });
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


//############################# SETTINGS #############################//

function autoStart(val) {
    app.setLoginItemSettings({
        openAtLogin: val,
        path: process.execPaths
    })
}
function registerShortcut(shortcut) {
    globalShortcut.unregisterAll();
    globalShortcut.register(shortcut, () => {
        showClipboardWindow();
    })

}
function trimItemsList(maxItems) {
    let arr = [];

    // get arr from system
    storage.get(config.CLIPBOARDKEY, function (error, obj) {
        if (error) throw error;
        if (!isEmpty(obj) && !isEmpty(obj.fclipboard)) {
            arr = obj.fclipboard;
            if (arr.length > maxItems) {
                while (arr.length > maxItems) {
                    arr.pop();
                }
                // store the arr back to system
                storage.set(config.CLIPBOARDKEY, { fclipboard: arr }, function (error) {
                    if (error) throw error;
                    if (isDisabled_btnClearClipboard) {
                        btnClearClipboard("enable");
                    }
                });
            }
        }
    });
}

function initSettingsWindow() {

    settingsWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, '/js/renderer.js')
        },
        width: 500, height: 300,
        title: 'Flash Clipboard - Settings', center: true,
        useContentSize: true,
        show: false,
        hasShadow: true, alwaysOnTop: true,
        resizable: false, maximizable: false, minimizable: false, thickFrame: true,
        frame: true, skipTaskbar: true
    })
    settingsWindow.setMenu(null)
    settingsWindow.loadURL(url.format({
        pathname: config.SETTINGS_PAGE,
        protocol: 'file:',
        slashes: true
    }))
    settingsWindow.on('closed', () => {
        settingsWindow = null
    })
}

function showSettingsWindow() {
    storage.get(config.SETTINGSKEY, function (error, obj) {
        if (error) throw error;
        if (!isEmpty(obj)) {
            config.SETTINGS = obj;
        }
        if (settingsWindow == null) {
            initSettingsWindow();
            settingsWindow.once('ready-to-show', () => {
                settingsWindow.webContents.focus();
                settingsWindow.webContents.send('sendsettings', config.SETTINGS, config.OSISMAC);
            })
        } else {
            settingsWindow.webContents.focus();
            settingsWindow.webContents.send('sendsettings', config.SETTINGS, config.OSISMAC);
        }


    });
}

ipcMain.on('ready-settings-win', (event, obj) => {
    settingsWindow.setSize(500, Math.ceil(obj) + 30, false);
    settingsWindow.show();
})

ipcMain.on('settings-save', (event, obj) => {
    hideSettingsWindow();
    if (parseSettings(obj)) {
        //Register shortcut
        registerShortcut(obj.shortcut);

        //Set max items
        trimItemsList(obj.items);

        //Set Autorun
        autoStart(obj.autorun);

        storage.set('settings', obj, function (error) {
            if (error) throw error;
            config.SETTINGS = obj;
        });
    }
})
//############################# APP UPDATE #############################//
//TODO: comment below line before release
// if (isDev) {
//     autoUpdater.updateConfigPath = path.join(__dirname, 'app-update.yml');
// }
autoUpdater.allowPrerelease = true;

autoUpdater.on('update-downloaded', (info) => {
    log.info("update downloaded: " + JSON.stringify(info))
    // setImmediate(() => {
    //     app.removeAllListeners("window-all-closed")
    //     if (focusedWindow != null) {
    //       focusedWindow.close()
    //     }
    //     autoUpdater.quitAndInstall(false)
    //   })
    setImmediate((e) => {
        log.info("quitAndInstall")
        autoUpdater.quitAndInstall(false, true)

    }

    )
    //autoUpdater.quitAndInstall(true,true); 
})


autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater: ' + err);
})


//##################### ERROR HANDLING #########################//
ipcMain.on('render-err', function (event, source, err) {
    var str = source + ': ';

    if (err != null) {
        if (err.stack != null) {
            str += err.stack;
        } else if (err.message != null) {
            str += err.message;
        }
    }
    console.log('Error in renderer: ' + str);
    log.error('Error in renderer: ' + str);
})

process.on('uncaughtException', function (err) {
    log.error('uncaughtException: ' + err);
    console.log('uncaughtException: ' + err);
})

