'use strict'
const path = require('path')
const electron = require('electron')
const url = require('url')
const APP_NAME = 'Multicopy Paste'
const TIMEDELAY = 500
const WIDTH = 250
const CLIPBOARDKEY = "mclipboard"
const TRAY_ICON = "icon"

module.exports = {
    TRAY_ICON: path.join(__dirname, TRAY_ICON),
    APP_NAME: APP_NAME,
    OS: process.platform,
    CLIPBOARDKEY : CLIPBOARDKEY,
    WIDTH : WIDTH,
    TIMEDELAY : TIMEDELAY
}