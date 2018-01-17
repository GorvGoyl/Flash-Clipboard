'use strict'
const path = require('path')
const electron = require('electron')
const url = require('url')
module.exports = {
    TRAY_ICON: path.join(__dirname,'../','/img/', 'flashclipboard'),
    APP_NAME: 'Flash Clipboard',
    OS: process.platform,
    OSISMAC: process.platform=='darwin',
    CLIPBOARDKEY : "fclipboard",
    SETTINGSKEY : "settings",
    TIMEDELAY : 500,
    CLIPBOARD_PAGE: path.join(__dirname,'../', 'clipboard.html'),
    ABOUT_PAGE: path.join(__dirname,'../', 'about.html'),
    SETTINGS_PAGE: path.join(__dirname,'../', 'settings.html'),
    TRAY_PAUSE_CAPTURE_LABEL: "Pause capturing text",
    TRAY_RESUME_CAPTURE_LABEL: "Resume capturing text",
    SETTINGS: {
        shortcut:'CmdOrCtrl+Shift+O',
        items:25,
        width:280,
        autorun:true
    }

}