import * as Phaser from "../phaser/phaser-3.87.0-full.js";

import { Base64Manager } from "../utils/Base64Manager.js";
import { LoadBase64Audio } from "../utils/LoadBase64Audio.js";
import { LoadBase64BitmapFont } from "../utils/LoadBase64BitmapFont.js";
import { adReady } from "../networkPlugin.js";
import { iceicebabyPNG } from "../../media/fonts_iceicebaby.png.js";
import { iceicebabyXML } from "../../media/fonts_iceicebaby.xml.js";
import { soundFxMP3 } from "../../media/audio_sound_fx.mp3.js";
import { bgJPEG } from "../../media/images_bg.jpeg.js";
import { toyBlastLogoPNG } from "../../media/images_toy_blast_logo.png.js";
import { stoolPNG } from "../../media/images_stool.png.js";
import { orangeDimondPNG } from "../../media/images_orangeDimond.png.js";
import { greenDimondPNG } from "../../media/images_greenDimond.png.js";
import { yellowDimondPNG } from "../../media/images_yellowDimond.png.js";
import { hexagonBlueDimondPNG } from "../../media/images_hexagonBlueDimond.png.js";
import { containerPNG } from "../../media/images_container.png.js";
import { pipePNG } from "../../media/images_pipe.png.js";
import { girlPNG } from "../../media/images_girl.png.js";
import { girlJumpPNG } from "../../media/spritesheets_girl_jump.png.js";
import { FunnelGlowPNG } from "../../media/images_FunnelGlow.png.js";
import { girlDeadPNG } from "../../media/spritesheets_girl_dead.png.js";
import { lavaTilePNG } from "../../media/images_lava_tile.png.js";
import { circlePNG } from "../../media/images_circle.png.js";
import { lavaFRAG } from "../../media/shaders_lava.frag.js";

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

		this.add
			.text(this.scale.width / 2, this.scale.height / 2, "Loading...", {
				fontFamily: "Arial",
				fontSize: 64,
				color: "#ffffff",
			})
			.setOrigin(0.5);

		//  Images load normally as base64 encoded strings
		this.load.image("bg", bgJPEG);
		this.load.image("toyblast_logo", toyBlastLogoPNG);
		this.load.image("box_green", greenDimondPNG);
		this.load.image("box_orange", orangeDimondPNG);
		this.load.image("box_yellow", yellowDimondPNG);
		this.load.image("box_hexagon_blue", hexagonBlueDimondPNG);
		this.load.image("stool", stoolPNG);
		this.load.image("girl", girlPNG);
		this.load.image("lava_collector", containerPNG);
		this.load.image("pipe", pipePNG);
		this.load.image("spark", FunnelGlowPNG);
		this.load.image("lava_tile", lavaTilePNG);
		this.load.image("circle", circlePNG);

		this.load.spritesheet("girl_jump", girlJumpPNG, {
			frameWidth: 418,
			frameHeight: 450,
		});
		this.load.spritesheet("girl_dead", girlDeadPNG, {
			frameWidth: 410,
			frameHeight: 502,
		});

		this.load.glsl("lava_shader", lavaFRAG);

		LoadBase64Audio(this, [{ key: "sound_fx", data: soundFxMP3 }]);

		LoadBase64BitmapFont(this, {
			key: "font1",
			xml: iceicebabyXML,
			png: iceicebabyPNG,
		});
	}

	create() {
		//  This may run before the Loader has completed, so don't use in-flight assets here
	}

	base64LoaderComplete() {
		adReady();

		this.scene.start("Game");
	}
}
