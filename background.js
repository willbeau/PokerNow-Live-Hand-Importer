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
    // Create a data URL for plain text.
    const url = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    chrome.downloads.download({
      url: url,
      filename: saveLocation,
      conflictAction: "overwrite"
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download error:", chrome.runtime.lastError.message);
      } else {
        console.log("Download started with id:", downloadId);
      }
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