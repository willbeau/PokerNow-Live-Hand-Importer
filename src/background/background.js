var browser = require("webextension-polyfill");

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method == "saveText") {
        save_content_to_file(request.text,request.location, sendResponse);
    }
    if(request.method == "disableDownloadShelf"){
        if (browser.downloads.setShelfEnabled) {
            setTimeout(()=> {
                browser.downloads.setShelfEnabled(false);
                sendResponse(true);
            }, 100);
        } else {
            sendResponse(false);
        }
    }
    if(request.method == "enableDownloadShelf"){
        if (browser.downloads.setShelfEnabled) {
            setTimeout(()=> {
                browser.downloads.setShelfEnabled(false);
                sendResponse(true);
            }, 100);
        } else {
            sendResponse(false);
        }
    }
    if(request.method == "makePopup"){
        browser.windows.create({
            type: "popup",
            tabId: sender.tab.id
        }).then(win=> {
            sendResponse(true);
        }, err => {
            console.error(err);
            sendResponse(false);
        });
    }
    return true;
});

function save_content_to_file(content, saveLocation, sendResponse) {
    var blob = new Blob([content], {type: "text/plain"});
    var url = URL.createObjectURL(blob);
    browser.downloads.download({
      url: url, 
      filename: saveLocation,
      conflictAction: "overwrite"
    }).then(id => {
        browser.downloads.onChanged.addListener(delta => {
            if (delta.state && delta.state.current == "complete" && delta.id == id) {
                URL.revokeObjectURL(url);
                browser.downloads.erase({id});
                sendResponse(true);
            }
        });
    }, err => {
        sendResponse(false);
    });
}
