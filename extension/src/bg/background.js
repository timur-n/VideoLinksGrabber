let links = [
	{name: 'Test link', url: 'test url', type: 'MP4'}
];

chrome.runtime.onInstalled.addListener(function() {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([{
			// conditions: [new chrome.declarativeContent.PageStateMatcher({pageUrl: {hostEquals: 'kinogo.by'}})],
			conditions: [new chrome.declarativeContent.PageStateMatcher()],
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}]);
	});

	const filter = {
		urls: ["*://*/*"]
	};
	const makeListener = function(name) {
		return function(details) {
			if (/.*\.mp4$/.test(details.url)) {
				console.log(name, details);
				// todo: remove duplicates?
				let fileName = /[^\/\\&\?]+\.\w{3,}(?=([\?&].*$|$))/.exec(details.url);
				fileName = fileName.length && fileName[0] || details.url;
				links.unshift({
					name: fileName,
					url: details.url,
					type: ''
				});
			}
		}
	};
	chrome.webRequest.onBeforeSendHeaders.addListener(makeListener("onBeforeSendHeaders"), filter, ["requestHeaders"]);
	// chrome.webRequest.onResponseStarted.addListener(makeListener("onResponseStarted"), filter);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log("onMessage", request);
	switch(request.action) {
		case 'list':
			sendResponse({response: urls});
			break;

		case 'clear':
			links = [];
			sendReponse({response: 'OK'});
			break;
	}
});

function getList() {
	return links;
}

function clearList() {
	links = [];
	return links;
}

function deleteItem(item) {
	const i = links.indexOf(item);
	if (i > -1) {
		links.splice(i, 1);
	}
	return links;
}
