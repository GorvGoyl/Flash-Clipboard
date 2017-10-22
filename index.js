const { ipcRenderer } = require('electron')
var ipc = require('electron').ipcRenderer;

ipc.on('sendclipboard', function (event, items) {
    document.getElementById("para").innerHTML="";
    var li = "";
    for (i = 0; i < items.length; i++) {
        li = li + "<li tabindex='" + (i + 1) + "' onclick='pasteValue(this)'>" + items[i] + "</li>";
    }
    document.getElementById("para").innerHTML = li;
    //alert(++i);
    $('li:first-child').next().focus().addClass("active");
});

function pasteValue(val) {
    ipcRenderer.send('asynchronous-message', val.innerHTML);
}
$(document).ready(function () {
    // $("li").hover(function(){
    //     $(this).addClass('active').siblings().removeClass();
    // }, function(){
    //     $(this).removeClass('active');
    // });
    // $("li").mouseover(function(){
    //     $("li").addClass('active');
    // });
    // $("li").mouseout(function(){
    //     $("li").removeClass('active');
    // });
    $('div.container').on('focus', 'li', function () {
        $this = $(this);
        $this.addClass('active').siblings().removeClass();
        $this.closest('div.container').scrollTop($this.index() * $this.outerHeight());
    }).on('keydown', 'li', function (e) {
        $this = $(this);
        if (e.keyCode == 40) {
            $this.next().focus();
            return false;
        } else if (e.keyCode == 38) {
            $this.prev().focus();
            return false;
        } else if (e.keyCode == 13) {
            var abc = $this[0];
            pasteValue(abc);
            return false;
        }
    }).on('mouseenter','li', function (event) {
        $( this ).focus().addClass('active').siblings().removeClass();;
    }).on('mouseleave','li',  function(){
        $(this).removeClass('active');
    });

    
});