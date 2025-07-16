import * as Phaser from "../phaser/phaser-3.87.0-core.js";

import { Base64Manager } from "../utils/Base64Manager.js";
import { LoadBase64Audio } from "../utils/LoadBase64Audio.js";
import { LoadBase64BitmapFont } from "../utils/LoadBase64BitmapFont.js";
import { adReady } from "../networkPlugin";
import { soundFxMP3 } from "../../media/audio_sound_fx.mp3.js";
import { MADETommySoftBlackWOFF2 } from "../../media/fonts_MADE-Tommy-Soft-Black.woff2.js";
import { footerPNG } from "../../media/images_footer.png.js";
import { buttonPNG } from "../../media/images_button.png.js";

export class Preloader extends Phaser.Scene {
	constructor() {
		super("Preload");
	}

	init() {
		console.log("%cSCENE::Preloader", "color: #fff; background: #f00;");
	}

	preload() {
		//  Invoke the Base64Manager - pass in the current scene reference and a callback to invoke when it's done
		Base64Manager(this, () => this.base64LoaderComplete());

		this.load.image("footer", footerPNG);
		this.load.image("button", buttonPNG);

		LoadBase64Audio(this, [{ key: "sound_fx", data: soundFxMP3 }]);
	}

	create() {
		//  This may run before the Loader has completed, so don't use in-flight assets here
		if (!document.getElementById("made-tommy-style")) {
			const style = document.createElement("style");
			style.id = "made-tommy-style";
			style.innerHTML = `
		@font-face {
			font-family: 'MADE Tommy Soft';
			src: url(${MADETommySoftBlackWOFF2}) format('woff2');
			font-weight: 900;
			font-style: normal;
		}
	`;
			document.head.appendChild(style);
		}
	}

	base64LoaderComplete() {
		adReady();

		this.time.delayedCall(200, () => {
			this.scene.start("Game");
		});
	}
}
