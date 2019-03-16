let links = [
	{name: 'Test link - bunny animation', site: 'Test', url: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4', type: ''}
];

chrome.runtime.onInstalled.addListener(function() {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([{
			conditions: [new chrome.declarativeContent.PageStateMatcher()],
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}]);
	});

	const filter = {
		urls: ["*://*/*"]
	};
	const makeListener = function(name) {
		return function(details) {
			// console.log('---', details)
			let fileName = /[^\/\\&\?]+\.\w{3,}(?=([\?&].*$|$))/i.exec(details.url);
			fileName = fileName && fileName.length && fileName[0] || details.url;
			if (/.*\.(mp4|m3u8|flv)$/i.test(fileName)) {
				console.log(name, details);
				links.unshift({
					name: fileName,
					site: details.initiator,
					url: details.url,
					type: ''
				});
			}
		}
	};
	chrome.webRequest.onBeforeSendHeaders.addListener(makeListener("onBeforeSendHeaders"), filter, ["requestHeaders"]);
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
