chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method == "saveText") {
        console.log("saving text" + request.text);
        save_content_to_file(request.text,request.location);
    }
    if(request.method == "disableDownloadShelf"){
        disableDownloadShelf();
    }
    if(request.method == "enableDownloadShelf"){
        enableDownloadShelf();
    }
    return true;
});

function save_content_to_file(content, saveLocation) {
    var blob = new Blob([content], {type: "text/plain"});
    var url = URL.createObjectURL(blob);
    chrome.downloads.download({
      url: url, 
      filename: saveLocation,
      conflictAction: "overwrite"
    });
}
function disableDownloadShelf(){
    setTimeout(() => {
        chrome.downloads.setShelfEnabled(false);
    }, 100);
}
function enableDownloadShelf(){
    setTimeout(() => {
        chrome.downloads.setShelfEnabled(true);
    }, 100);
}