import { AdNetworkFactory, Mintegral, Mraid } from "./lib/ad-network-plugin.js";
import { config } from "./config.js";

// Do not touch here unless you know what you're doing
export const networkPlugin = AdNetworkFactory.createAdNetwork(config.adNetworkType);
export const mraidAdNetworks = new Set(["unityads", "adcolony", "applovin", "kayzen", "ironsource"]);

export function adStart() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameStart();
    }
}

export function adEnd() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameEnd();
    }
}

export function adClose() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameClose(() => {
            console.log("Game close worked!");
        });
    }
}

export function adRetry() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameRetry();
    }
}

export function adReady() {
    if (config.adNetworkType === "mintegral") {
        Mintegral.gameReady();
    }
}

/**
 * This function is used to handle the audio volume change event for MRAID networks.
 * 
 * @param {Phaser.Scene} sceneInstance - The Phaser scene instance.
 */
export function onAudioVolumeChange(sceneInstance) {
    if (mraidAdNetworks.has(config.adNetworkType)) {
        Mraid.audioVolumeChange((volumePercentage) => {
            if (volumePercentage !== null) {
                let newVolume = volumePercentage / 100;

                if (sceneInstance) {
                    sceneInstance.getScenes(true).forEach(scene => {
                        if (scene?.sound) {
                            scene.sound.setVolume(newVolume);
                        }
                    });
                }
            }
        });
    }
}

/**
 * This function is used to handle the CTA (Call To Action) click event.
 * 
 * @returns {void}
 */
export function onCtaPressed() {
    adClose(); // these calls are needed for Mintegral
    adEnd();

    if (mraidAdNetworks.has(config.adNetworkType)) {
        networkPlugin.ctaPressed(config.googlePlayStoreLink, config.appleStoreLink);
    } else {
        networkPlugin.ctaPressed();
    }
}