

function toggleNav() {
    var navEl = document.getElementById("myTopnav");
    var dwEl = $('.downloaddiv');
    if (navEl.className === "topnav") {
        navEl.className += " responsive";
        dwEl.removeClass('topmargin')
    } else {
        navEl.className = "topnav";
        dwEl.addClass('topmargin')
    }
}