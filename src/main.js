/*
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.method == "getSelection"){
	  sendResponse({data: window.getSelection().toString()});
    }
	
    else
      sendResponse({}); // snub them.
});
*/

var selectedHtml = '',
	cache = {}, tabid = 0,
	fileName = '',
	quickHTML = {
	init: function() {
		// If set {"persistent":false} at mainfest, can not create contextMenus.
		chrome.contextMenus.create({
			"title": "show the html",
			"contexts": ["selection"], //["all", "page", "frame", "selection", "link", "editable", "image","video", "audio"],
			"type": "normal",
			"onclick": quickHTML.menuHandler
		});

		/*
		chrome.runtime.onMessage.addListener(function(request, sender, callback) {
			callback(selectedHtml);
		});
		*/

		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

		chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
			if (cache[tabId]) {
				quickHTML.deleteFile(tabId, cache[tabId]);
			}
		});

		// Hot key : Open the edit page.
		chrome.commands.onCommand.addListener(function(command) {
			//console.log('Command:', command);
			if (command === 'newsilen-qh-edit') {
				chrome.tabs.create({
					url: "data:text/html,<html contenteditable>"
				}, function(tab) {
					// TODO focus on the window. 
				});
			}
			if (command === 'newsilen-qh-show') {
				//console.log(window.quickHTML);
			}
		});
	},
	menuHandler: function(info, tab) {
		selectedHtml = info.selectionText;
		//console.info(tab);
		window.requestFileSystem(window.TEMPORARY, 1024 * 1024 /*1MB*/ , quickHTML.createFile, quickHTML.errorHandler);
	},
	createFile: function(fs) {
		fileName = quickHTML.createFileName();
		fs.root.getFile(fileName, {
			create: true
		}, function(fileEntry) {
			// Create a FileWriter object for our FileEntry.
			fileEntry.createWriter(function(fileWriter) {

				fileWriter.onwriteend = function(e) {
					// chrome.extension.getURL('result.html')
					chrome.tabs.create({
						url: fileEntry.toURL()
					}, function(tab) {
						tabid = tab.id;
						cache[tabid] = fileName; // map the tab id and file name.
					});
				};

				fileWriter.onerror = function(e) {
					console.log('Write failed: ' + e.toString());
				};

				var blob = new Blob([selectedHtml], {
					type: 'text/plain'
				});
				fileWriter.write(blob);

			}, quickHTML.errorHandler);
		}, quickHTML.errorHandler);
	},
	createFileName: function() {
		return 'NSQS' + ('1.0' + Math.random()).replace(/\D/g, '') + '.html';
	},
	deleteFile: function(tabId, fName) {
		window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function(fs) {
			fs.root.getFile(fName, {
				create: false
			}, function(fileEntry) {

				fileEntry.remove(function() {
					delete cache[tabId]; // remove the cache.
				}, quickHTML.errorHandler);
			}, quickHTML.errorHandler);
		}, quickHTML.errorHandler);
	},
	errorHandler: function(e) {
		console.log('Error: ' + e);
	}
};

quickHTML.init();