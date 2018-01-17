'use strict'
let MAX_ITEMS=100, MAX_WIDTH=1000;
let alt, ctrl, shift, cmd,cmdctrl;
let altck, ctrlck, shiftck, cmdck, autorunck;
let keybx, itemsbx, widthbx;

/*
ELECTRON
*/
const { ipcRenderer } = require('electron')
let ipc = require('electron').ipcRenderer;
let shell = require('electron').shell
document.addEventListener('click', function (event) {
  if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
    event.preventDefault()
    shell.openExternal(event.target.href)
  }
})

ipc.on('sendclipboard', function (event, clipArr) {
    clearHtmlList();
    let ul = document.getElementById("clipboard-ul");
    let li = "";
    // build li
    for (let i = 0; i < clipArr.length; i++) {
        li = document.createElement("li");
        li.setAttribute("tabindex", i + 1);
        li.appendChild(document.createTextNode(clipArr[i]));
        ul.appendChild(li);
    }
    // default focus on 2nd element
    if (clipArr.length > 1)
        $('li:first-child').next().focus().addClass("active");
    else if(clipArr.length==1) $('li:first-child').focus().addClass("active");
    else{
        let spn = $('<span />').html("copy some text and that'll appear here")
        ul.append("copy some text and that'll appear here :-)");
        $(ul).addClass('nocontent');
    }

    let pageHeight = $('body').outerHeight(true);
    sendToMain('set-size-pos-command', pageHeight);
});
ipc.on('appversion', function (event, vers) {
    let el = document.getElementById("version");
    el.innerHTML=vers;
    let pageHeight = $('body').outerHeight(true);
    sendToMain('show-about', pageHeight);
});
ipc.on('clearHtmlList', function (event) {
    clearHtmlList();
});
function sendToMain(channel, listener, args) {
    ipcRenderer.send(channel, listener, args);
}

/* SETTINGS PAGE*/
ipc.on('sendsettings', function (event, obj, isMAC) {
    setValues(obj, isMAC);
    let pageHeight = ($('body').outerHeight(true));
    let electronWindowHt = (pageHeight);
    sendToMain('settings-ready-command', electronWindowHt);
});

/*-ELECTRON END*/



function objFromError(err, filter, space) {
    var plainObject = {};
    Object.getOwnPropertyNames(err).forEach(function (key) {
        plainObject[key] = err[key];
    });

    return plainObject;
};

window.onerror = function (msg, url, lineNo, columnNo, error) {
    sendToMain('render-err', 'main', objFromError(error));
}
function pasteValue(item) {
    clearHtmlList();
    sendToMain('paste-command', item);
}

function clearHtmlList() {
    $('#clipboard-ul').removeClass('nocontent');
    $('#clipboard-ul').empty();
}

function allowedKey(key) {
    //back,null,tab,arrows
    var allowedkeys = [0, 8, 9, 37, 38, 39, 40];
    return allowedkeys.includes(key);
}

function setValues(obj, isMAC) {
    alt = 'Alt', ctrl = 'Ctrl', shift = 'Shift', cmd = 'Cmd', cmdctrl = 'CmdOrCtrl';
    altck = $('#alt'), ctrlck = $('#ctrl'), shiftck = $('#shift'), cmdck = $('#cmd'), autorunck = $('#autorun');
    keybx = $('#shortcutkey'), itemsbx = $('#maxitems'), widthbx = $('#maxwidth');
    let srt = obj.shortcut;

    if (isMAC) {
        $('#mac').show();
        $('#win').hide();
        if (srt.includes(cmdctrl)) { cmdck.prop('checked', true); }
    } else {
        if (srt.includes(cmdctrl)) { ctrlck.prop('checked', true); }
    }

    if (srt.includes(alt)) { altck.prop('checked', true); }
    if (srt.includes(shift)) { shiftck.prop('checked', true); }
    if (obj.autorun) { autorunck.prop('checked', true); }
    keybx.val(srt.substr(-1).toUpperCase());
    itemsbx.val(obj.items);
    widthbx.val(obj.width);
    let pageHeight = ($('body').outerHeight(true));
    sendToMain('ready-settings-win',pageHeight);
}

function settings_save() {
    let obj = {}, srt='';
    if (altck.is(':checked')) srt += alt + '+';
    if (shiftck.is(':checked')) srt += shift + '+';
    if (cmdck.is(':checked') || ctrlck.is(':checked')) srt += cmdctrl + '+';
    srt += keybx.val().toUpperCase();
    obj.shortcut = srt;
    obj.items = itemsbx.val();
    obj.width = widthbx.val();
    obj.autorun = autorunck.is(':checked');
    sendToMain('settings-save', obj);
}

$(document).ready(function () {
    /*CLIPBOARD_PAGE*/
    let $this;
    $('div.clipboard-container').on('focus', 'li', function () {
        $this = $(this);
        $this.addClass('active').siblings().removeClass();
        $this.closest('div.clipboard-container').scrollTop($this.index() * $this.outerHeight());
    }).on('keydown', 'li', function (e) {
        $this = $(this);
        if (e.keyCode == 40) {
            $this.next().focus();
            return false;
        } else if (e.keyCode == 38) {
            $this.prev().focus();
            return false;
        } else if (e.keyCode == 13) {
            pasteValue($this.text());
            return false;
        }
    }).on('mouseenter', 'li', function (event) {
        $(this).focus().addClass('active').siblings().removeClass();;
    }).on('mouseleave', 'li', function (event) {
        $(this).removeClass('active');
    }).on('click', 'li', function (event) {
        pasteValue($(this).text());
    });
    /*-CLIPBOARD_PAGE END*/

    /*SETTINGS_PAGE*/
    // allow only numbers in number field
    $(':input[type="number"]').on("keydown keyup", function (evt) {
        if (!allowedKey(evt.which) && evt.which < 48 || evt.which > 57) {
            evt.preventDefault();
        }

    });

    $('#maxitems').on("keydown keyup", function (evt) {
        if ($(this).val() > MAX_ITEMS && !allowedKey(evt.which)) {
            evt.preventDefault();
            $(this).val(MAX_ITEMS);
        }
    });
    $('#maxwidth').on("keydown keyup", function (evt) {
        if ($(this).val() > MAX_WIDTH && !allowedKey(evt.which)) {
            evt.preventDefault();
            $(this).val(MAX_WIDTH);
        }
    });
    $('#shortcutkey').on("keypress", function (evt) {
        if (!allowedKey(evt.which)){
            evt.preventDefault();
            keybx.val(String.fromCharCode(evt.which).toUpperCase());
        }
        
    });
    /*-SETTINGS_PAGE END*/
});