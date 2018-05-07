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
			link.pending = true;
			return $http.post(kodiUrl, stop)
				.then(result => {
					console.log('Stop', stop, result);
					const clearVideoPlaylist = jsonRpc('Playlist.Clear', {playlistid: 1});
					return $http.post(kodiUrl, clearVideoPlaylist)
						.then(result => {
							console.log('Clear list', clearVideoPlaylist, result);
							const addItemsToPlaylist = jsonRpc('Playlist.Add', {playlistid: 1, item: {file: link.url}});
							return $http.post(kodiUrl, addItemsToPlaylist)
								.then(result => {
									console.log('Add', addItemsToPlaylist, result);
									const open = jsonRpc('Player.Open', {item: {playlistid: 1, position: 0}});
									return $http.post(kodiUrl, open)
										.then(result => {
											console.log('Open', open, result);
											link.pending = false;
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
	<div class="vlg-header" layout="row" layout-align="start center">
		<h3 flex>Found videos</h3>
		<md-button ng-click="$ctrl.clear()">Delete all</md-button>
	</div>
	<div class="vlg-list" flex>
		<div ng-repeat="link in $ctrl.links track by $index" layout="row" layout-align="start center">
			<span flex>{{link.name}} @ {{link.site}}</span>
			<div class="vlg-play">
				<md-progress-circular class="vlg-progress" ng-if="link.pending" mode="indeterminate" md-diameter="48px"></md-progress-circular>
				<md-button ng-click="$ctrl.play(link)" ng-disabled="link.pending">Play</md-button>
			</div>
			<md-button ng-click="$ctrl.delete(link)">Delete</md-button>
		</div>
	</div>
</div>`,
		controller: function(vlgData, vlgKodi) {

			this.links = vlgData.getList();

			this.play = link => vlgKodi.play(link);

			this.delete = link => this.links = vlgData.deleteItem(link);

			this.clear = () => this.links = vlgData.clearList();
		}
	});
