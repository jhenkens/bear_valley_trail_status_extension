var s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function () {
    var a: any = this;
    a.remove();
};
// see also "Dynamic values in the injected code" section in this answer
(document.head || document.documentElement).appendChild(s);
