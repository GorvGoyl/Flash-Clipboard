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
var last_copied_val = "";
// init main
function initMain() {
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
    var arr = [];
    storage.get('mclipboard', function (error, data) {
        //console.log(data)
        if (error) throw error;
        if (data && data.mclipboard) {
            arr = data.mclipboard;
        }
        var point = electron.screen.getCursorScreenPoint();
        //clipboardWindow.showInactive();
        clipboardWindow.show();
        clipboardWindow.setPosition(point.x + 10, 20, false);
        //clipboardWindow.focus();  
        clipboardWindow.webContents.focus();
        clipboardWindow.webContents.send('sendclipboard', arr);
    });
}

function initClipboardWindow() {
    let screenSize = electron.screen.getPrimaryDisplay().size;
    clipboardWindow = new BrowserWindow({
        maxWidth: 250, minWidth: 250, minHeight: screenSize.height - 40,
        backgroundThrottling: false, show: false, thickFrame: true,
        hasShadow: true,
        frame: true, skipTaskbar: true
    })
    //clipboardWindow.setMenu(null)
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

function showAboutWindow(){
    // lazy-loading
    if(aboutWindow==null){
        aboutWindow = new BrowserWindow({
            width: 400, height:600,
            backgroundThrottling: false, show: false, thickFrame: true,
            hasShadow: true,
            frame: true, skipTaskbar: true
        })
        //aboutWindow.setMenu(null)
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
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'About', click: function () {
                showAboutWindow();

            }
        },{
            label: 'Quit', click: function () {
                app.quit();

            }
        }
    ])
    tray.setToolTip('')
    tray.setContextMenu(contextMenu)
}

function copyToClipboard(item) {
    var arr = [];
    //const dataPath = storage.getDataPath();
    //console.log(dataPath);

    // get arr from system
    storage.get('mclipboard', function (error, data) {
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
        storage.set('mclipboard', { mclipboard: arr }, function (error) {
            if (error) throw error;
        });
    });
}

app.on('ready', initMain)

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (clipboardWindow) {
    // no need to restore as our app starts in minimized state
    //   if (clipboardWindow.isMinimized()) clipboardWindow.restore()
    //   clipboardWindow.focus()
    }
  })

  if (isSecondInstance) {
    app.quit()
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