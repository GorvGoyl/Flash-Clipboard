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
 if(clipArr.length>1)
    $('li:first-child').next().focus().addClass("active");
    else  $('li:first-child').focus().addClass("active");

    ipcRenderer.send('dom-ready-command');
});

ipc.on('clearHtmlList', function (event) {
    clearHtmlList();});
// $(window).bind("beforeunload", function() { 
//     clearHtmlList(); 
// })
function pasteValue(item) {
    clearHtmlList();
    // if(ipcRenderer.sendSync('paste-command', item())){
    //     clearHtmlList();
    // }
    ipcRenderer.send('paste-command', item);
    
}

function clearHtmlList(){
    $('#clipboard-ul').empty();
}

$(document).ready(function () {
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

});