const { app, BrowserWindow, globalShortcut, clipboard } = require('electron')
const electron = require('electron')
const ipc = require('electron').ipcMain
const storage = require('electron-json-storage')
const url = require('url')
const path = require('path')
const robot = require('robotjs');

let win
var last_value = "";
function createWindow() {
    let screenSize = electron.screen.getPrimaryDisplay().size;
    win = new BrowserWindow({ width: 250, Height: screenSize.height, 
        backgroundThrottling: false, show: false, thickFrame: true,
        hasShadow: true,
        frame: true, skipTaskbar: true })
        //win.setMenu(null)
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))
    win.on('blur', function (event) {
        event.preventDefault()
        win.minimize();
    });

    // Check for changes at an interval.
    setInterval(check_clipboard_for_changes, 500);

    globalShortcut.register('CommandOrControl+O', () => {
        showPopup();
    })

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

function check_clipboard_for_changes() {
    let item = electron.clipboard.readText(String);
    if (last_value !== item && item.trim().replace(/\s/g, "") != "") {
        copyToMCP(item);
        last_value = item;
    }
}
ipc.on('paste-command', (event, arg) => {
    win.minimize();
    clipboard.writeText(arg);
    robot.keyTap("v", "control");

    //console.log(arg)  // prints "ping"
    //event.sender.send('asynchronous-reply', 'pong')
})

function showPopup() {
    var arr = [];
    storage.get('mclipboard', function (error, data) {
        //console.log(data)
        if (error) throw error;
        if (data && data.mclipboard) {
            arr = data.mclipboard;
        }
        var point = electron.screen.getCursorScreenPoint();
        win.showInactive();
        win.setPosition(point.x+10, 0,false);
        win.focus();  
        win.webContents.focus();
        win.webContents.send('sendclipboard', arr);
    });

      
}

function copyToMCP(item) {
    var arr = [];
    //const dataPath = storage.getDataPath();
    //console.log(dataPath);

    // get arr from system
    storage.get('mclipboard', function (error, data) {
        if (error) throw error;
        if (data && data.mclipboard) {
            arr = data.mclipboard;
        }
        //console.log(JSON.stringify(arr));

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
        //console.log(JSON.stringify(arr));
    });
}

app.on('ready', createWindow)

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
    if (win === null) {
        createWindow()
    }
})