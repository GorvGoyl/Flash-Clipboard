/*ELECTRON*/
const { ipcRenderer } = require('electron')
let ipc = require('electron').ipcRenderer;

ipc.on('sendclipboard', function (event, clipArr) {
    clearHtmlList();
    let ul = document.getElementById("clipboard-ul");
    let li = "";
    // build li
    for (i = 0; i < clipArr.length; i++) {
        li = document.createElement("li");
        li.setAttribute("tabindex", i + 1);
        li.appendChild(document.createTextNode(clipArr[i]));
        ul.appendChild(li);
    }

    // default focus on 2nd element
    if (clipArr.length > 1)
        $('li:first-child').next().focus().addClass("active");
    else $('li:first-child').focus().addClass("active");

    let pageHeight = ($('body').outerHeight(true));
    let electronWindowHt = (pageHeight);
    sendToMain('dom-ready-command', electronWindowHt);
});

ipc.on('clearHtmlList', function (event) {
    clearHtmlList();
});
function sendToMain(channel, listener, args){
    ipcRenderer.send(channel,listener, args);
}
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
    $('#clipboard-ul').empty();
}

$(document).ready(function () {
     /*CLIPBOARD_PAGE*/
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

    // $(':input[type="number"]').addEventListener("keypress", function (evt) {
    //     if (evt.which != 8 && evt.which != 0 && evt.which < 48 || evt.which > 57)
    //     {
    //         evt.preventDefault();
    //     }
    // });
    /*-SETTINGS_PAGE END*/
});