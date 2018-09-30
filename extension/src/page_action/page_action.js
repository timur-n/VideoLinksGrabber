angular
    .module('video-links-grabber', ['ngMaterial'])
    .config(function($mdThemingProvider, $mdIconProvider) {
        $mdIconProvider
            .icon('copy', 'fonts/copy.svg');
    })
    .service('vlgData', function() {
        this.getList = () => chrome.extension.getBackgroundPage().getList();
        this.deleteItem = item => chrome.extension.getBackgroundPage().deleteItem(item);
        this.clearList = () => chrome.extension.getBackgroundPage().clearList();
    })
    .service('vlgCopy', function() {
        this.copy = text => {
            const input = document.createElement('input');
            input.style.position = 'fixed';
            input.style.opacity = 0;
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);
        };
    })
    .service('vlgKodi', function($http, $q) {

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
            link.pending = true;
            const handleError = error => {
                console.log('Error', error);
                return $q.reject(error);
            };
            const stop = jsonRpc('Player.Stop', {
                playerid: 1
            });
            return $http.post(kodiUrl, stop)
                .then(result => {
                    //console.log('Stop', stop, result);
                    const clearVideoPlaylist = jsonRpc('Playlist.Clear', {
                        playlistid: 1
                    });
                    return $http.post(kodiUrl, clearVideoPlaylist)
                })
                .then(result => {
                    //console.log('Clear list', clearVideoPlaylist, result);
                    const addItemsToPlaylist = jsonRpc('Playlist.Add', {
                        playlistid: 1,
                        item: {
                            file: link.url
                        }
                    });
                    return $http.post(kodiUrl, addItemsToPlaylist)
                })
                .then(result => {
                    //console.log('Add', addItemsToPlaylist, result);
                    const open = jsonRpc('Player.Open', {
                        item: {
                            playlistid: 1,
                            position: 0
                        }
                    });
                    return $http.post(kodiUrl, open)
                })
                .then(result => {
                    console.log("Sent to KODI");
                })
                .catch(handleError)
                .finally(() => link.pending = false);
        };
    })
    .component('vlgPage', {
        template: `
<div class="vlg-container" layout="column">
	<div class="vlg-header" layout="row" layout-align="start center">
		<h3 flex>Found videos</h3>
		<md-button ng-click="$ctrl.clear()">Clear list</md-button>
		<md-button class="md-icon-button" ng-click="$ctrl.settings()">
			<md-tooltip>Settings</md-tooltip>
			<i class="icon-settings"></i>
		</md-button>
	</div>
	<div class="vlg-list" flex>
		<div ng-repeat="link in $ctrl.links track by $index" layout="row" layout-align="start center">
			<span flex>{{link.name}} @ {{link.site}}</span>
			<div class="vlg-play">
				<md-progress-circular class="vlg-progress" ng-if="link.pending" mode="indeterminate" md-diameter="48px"></md-progress-circular>
				<md-button ng-click="$ctrl.play(link)" ng-disabled="link.pending">Play</md-button>
			</div>
			<md-button class="md-icon-button" ng-click="$ctrl.download(link)" aria-label="Download">
				<md-tooltip>Download</md-tooltip>
				<i class="icon-cloud_download"></i>
			</md-button>
			<md-button class="md-icon-button" ng-click="$ctrl.copy(link)" aria-label="Download">
				<md-tooltip>Copy URL</md-tooltip>
				<md-icon md-svg-icon="copy" class="vlg-icon-btn"></md-icon>
			</md-button>
			<md-button class="md-icon-button" ng-click="$ctrl.delete(link)" aria-label="Delete">
				<md-tooltip>Delete</md-tooltip>
				<i class="icon-delete"></i>
			</md-button>
		</div>
	</div>
</div>`,
        controller: function($timeout, $mdToast, vlgData, vlgKodi, vlgCopy) {

            this.links = vlgData.getList();

            this.toast = (type, message) => {
                $mdToast.show({
                    template: `
<md-toast>
	<div class="vlg-toast" ng-class="$ctrl.getToastClass()" layout="row" layout-align="start center">
		<i class="vlg-toast-icon" ng-class="$ctrl.getIconClass()"></i>
		<span>{{$ctrl.message}}</span>
	</div>
</md-toast>`,
                    // hideDelay: 0,
                    position: 'top',
                    bindToController: true,
                    controllerAs: '$ctrl',
                    parent: 'body',
                    locals: {
                        type: type,
                        message: message
                    },
                    controller: function() {
                        this.getIconClass = () => ({
                            "icon-check_circle": this.type === "success",
                            "icon-error": this.type === "error",
                        });

                        this.getToastClass = () => ({
                            "vlg-toast-success": this.type === "success",
                            "vlg-toast-error": this.type === "error",
                        });
                    }
                });
            }

            this.play = link => vlgKodi
                .play(link)
                .then(result => {
                    this.toast("success", "Sent to Kodi");
                })
                .catch(error => {
                    this.toast("error", "Error sending to Kodi");
                });

            this.download = link => {
                // todo: pause network monitoring for the download URL?
                chrome.downloads.download({
                    url: link.url,
                    saveAs: true,
                });
            };

            this.delete = link => this.links = vlgData.deleteItem(link);

            this.clear = () => this.links = vlgData.clearList();

            this.settings = () => {};

            this.copy = link => vlgCopy.copy(link.url);
        }
    });