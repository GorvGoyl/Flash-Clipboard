const { ipcRenderer } = require('electron')
var ipc = require('electron').ipcRenderer;

ipc.on('sendclipboard', function (event, clipArr) {
    var ul = document.getElementById("clipboard-ul");
    ul.innerHTML = "";
    var li = "";
    // build li
    for (i = 0; i < clipArr.length; i++) {
        li = document.createElement("li");
        li.setAttribute("tabindex", i + 1);
        li.appendChild(document.createTextNode(clipArr[i]));
        ul.appendChild(li);
    }
 // default focus on 2nd element
    $('li:first-child').next().focus().addClass("active");
});

function pasteValue(item) {
    ipcRenderer.send('paste-command', item);
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