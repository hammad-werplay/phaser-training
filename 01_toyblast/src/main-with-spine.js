import * as Phaser from './phaser/phaser-3.87.0-core.js';
import * as SpinePlugin from './spine/SpinePlugin';

import { mraidAdNetworks, networkPlugin } from './networkPlugin.js';

import { Game } from './scenes/Game';
import { Preloader } from './scenes/Preloader';
import { config } from './config.js';

const gameConfig = {
    type: Phaser.AUTO,
    parent: 'ad-container',
    width: 411,
    height: 731,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Preloader,
        Game
    ],
    plugins: {
        //  If you need to load a Spine file, uncomment this plugin
        scene: [
            { key: 'SpinePlugin', plugin: window['SpinePlugin'], mapping: 'spine' }
        ]
    }
};

function initializePhaserGame ()
{
    return new Phaser.Game(gameConfig);
}
  
function setupGameInitialization (adNetworkType)
{
    const game = initializePhaserGame();

    if (mraidAdNetworks.has(adNetworkType))
    {
        networkPlugin.initMraid(() => game);
    }
    else
    {
        // vungle, google ads, facebook, ironsource, tiktok
        return game;
    }
}
  
setupGameInitialization(config.adNetworkType);
