/*
 * Manage Main map Objects
 */

var ArrayUtils = require('../../utils/Arrays');
var playersManager = require('./PlayersManager');
var Gold = require('./Collectable/Gold');


var MapFile = require('../../../client/assets/gameAssets/map/map.json');

var collectableObjects = [];

const COLLECTABLE_LAYER_NAME = "s_collectable";

// init the map objects that need to be synchronized
function init(){
    loadCollectablesFromMapFile();
}

function loadCollectablesFromMapFile(){
    var collectableLayer = MapFile.layers.filter(function( layer ) {
        return layer.name === COLLECTABLE_LAYER_NAME;
    })[0];

    var counter = 0;
    collectableLayer.objects.forEach(function(colObject){
        if(colObject.type === 'Gold'){
            collectableObjects.push(new Gold(counter, colObject.x, colObject.y));
            counter++;
        }
    });

    console.log('** Collectable objects loaded');
}


function synchronizeClient(client){
    client.on('CLIENT_GET_ALL_COLLECTABLES', onGetAllCollectables);
    client.on('CLIENT_TRY_TO_COLLECT', onClientAskToCollect);


    function onGetAllCollectables() {
        client.emit('SERVER_ALL_COLLECTABLES', collectableObjects);
        sendPlayersScores();
    }

    function onClientAskToCollect(collisionInfo){
        var targetColectable = ArrayUtils.getObjectInArrayById(collectableObjects, collisionInfo.collectableId);
        if(targetColectable.isAvailable){
            targetColectable.isAvailable = false;

            notifyCollectableDestroy(targetColectable);
            addPlayerScore(collisionInfo.playerId, targetColectable.scoreValue);
            sendPlayersScores();
        }
    }

    function addPlayerScore(playerId, scoreToAdd){
        var concernedPlayer = playersManager.getPlayerById(playerId);
        concernedPlayer.score += scoreToAdd;
    }

    function notifyCollectableDestroy(collectable){
        client.broadcast.emit('SERVER_COLLECTABLE_DESTROY', collectable);
    }

    function sendPlayersScores(){
        client.server.emit('SERVER_UPDATE_PLAYER_SCORES', playersManager.getPlayersList());
    }
}






module.exports = {
    init: init,
    synchronizeClient: synchronizeClient
};