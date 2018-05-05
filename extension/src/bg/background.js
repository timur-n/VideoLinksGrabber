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
			}
		}
	};
	chrome.webRequest.onBeforeSendHeaders.addListener(makeListener("onBeforeSendHeaders"), filter, ["requestHeaders"]);
});
