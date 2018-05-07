/*
function sendMessageToContent(message, callback) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
			console.log('Content script response', response);
			if (callback) {
				callback(response);
			}
		});
	});
}

function startStop() {
	console.log('startStop');
	sendMessageToContent({togglePolling: true});
	chrome.extension.getBackgroundPage().test();
}

function showMainPage() {
	chrome.tabs.create({url: chrome.extension.getURL('src/dashboard/index.html')});
}

function initialize() {
	console.log('initializing');
	chrome.extension.getBackgroundPage().test();
	showMainPage();
}

window.addEventListener("load", initialize);
*/

function sendMessage(request) {
	console.log('sendMessage', request);
	chrome.runtime.sendMessage(request, function(response) {
		console.log('sendMessage callback', response);
	});
}

angular
	.module('video-links-grabber', ['ngMaterial'])
	.service('vlgData', function() {
		this.getList = () => chrome.extension.getBackgroundPage().getList();
		this.deleteItem = item => chrome.extension.getBackgroundPage().deleteItem(item);
		this.clearList = () => chrome.extension.getBackgroundPage().clearList();
	})
	.service('vlgKodi', function($http) {

		function jsonRpc(method, params) {
			return {
				jsonrpc: '2.0',
				method: method,
				params: params,
				id: 1
			}
		}

		this.play = link => {
			const kodiUrl = 'http://xbmc:xbmc_13@raspi2:8080/jsonrpc';
			// doAction stop: getActivePlayerId => post action stop

			// clearPlaylist
			/* function clearPlaylist(callback) {
			    var clearVideoPlaylist = '{"jsonrpc": "2.0", "method": "Playlist.Clear", "params":{"playlistid":1}, "id": 1}';
			    var clearAudioPlaylist = '{"jsonrpc": "2.0", "method": "Playlist.Clear", "params":{"playlistid":0}, "id": 1}';

			    ajaxPost(clearVideoPlaylist, function () {
			        ajaxPost(clearAudioPlaylist, function (response) {
			            callback(response);
			        });
			    });
			}*/

			// queueItem
			/*
			function queueItem(url, callback) {
			    getPluginPath(url, function (contentType, pluginPath) {
			        addItemsToPlaylist([
			            {"contentType": contentType, "pluginPath": pluginPath}
			        ], function (result) {
			            callback(result);
			        });
			    });
			}
			*/
			const handleError = error => console.log('Error', error);
			const stop = jsonRpc('Player.Stop', {playerid: 1});
			$http.post(kodiUrl, stop)
				.then(result => {
					console.log('Stop', stop, result);
					const clearVideoPlaylist = jsonRpc('Playlist.Clear', {playlistid: 1});
					$http.post(kodiUrl, clearVideoPlaylist)
						.then(result => {
							console.log('Clear list', clearVideoPlaylist, result);
							const addItemsToPlaylist = jsonRpc('Playlist.Add', {playlistid: 1, item: {file: link.url}});
							$http.post(kodiUrl, addItemsToPlaylist)
								.then(result => {
									console.log('Add', addItemsToPlaylist, result);
									const open = jsonRpc('Player.Open', {item: {playlistid: 1, position: 0}});
									$http.post(kodiUrl, open)
										.then(result => {
											console.log('Open', open, result);

										})
										.catch(handleError);
								})
								.catch(handleError);
						})
						.catch(handleError);
				})
				.catch(handleError);
		};
	})
	.component('vlgPage', {
		template: `
<div class="vlg-container" layout="column">
	<h3>Video links grabber</h3>
	<div flex>
		<div ng-repeat="link in $ctrl.links track by $index" layout="row" layout-align="start center">
			<span flex>{{link.name}}</span>
			<md-button class="md-icon-button"><md-icon md-font-icon="play_arrow" md-font-set="icomoon"></md-icon></md-button>
			<md-button class="" ng-click="$ctrl.play(link)">Play</md-button>
			<md-button class="" ng-click="$ctrl.delete(link)">Delete</md-button>
		</div>
	</div>
</div>`,
		controller: function(vlgData, vlgKodi) {

			this.links = vlgData.getList();

			this.play = link => vlgKodi.play(link);

			this.delete = link => this.links = vlgData.deleteItem(link);
		}
	});
