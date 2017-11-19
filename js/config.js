'use strict'
const path = require('path')
const electron = require('electron')
const url = require('url')
module.exports = {
    TRAY_ICON: path.join(__dirname,'../','/img/', 'multicopypaste'),
    APP_NAME: 'Multicopy Paste',
    OS: process.platform,
    CLIPBOARDKEY : "mclipboard",
    WIDTH : 250,
    TIMEDELAY : 500,
    CLIPBOARD_PAGE: path.join(__dirname,'../', 'clipboard.html'),
    ABOUT_PAGE: path.join(__dirname,'../', 'about.html'),
    TRAY_PAUSE_CAPTURE_LABEL: "Pause capturing text",
    TRAY_RESUME_CAPTURE_LABEL: "Resume capturing text"

}