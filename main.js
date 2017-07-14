// eslint-disable-next-line prefer-const, one-var
let config, vars, app, loops, gui;

// eslint-disable-next-line prefer-const
config = {
	// the message you send to others when you hack them
	message: "papa bless, it's everyday bro /r/javascript",
	// the base64 database url
	db: "https://raw.githubusercontent.com/snollygolly/sourceio-automation/master/db.json",
	// all things timing related
	freq: {
		// how often to guess
		word: 1500,
		// how often to attempt to upgrade mining tools
		mine: 3000,
		// how often to attempt to upgrade firewalls
		upgrade: 4500,
		// how long to wait before attempting to rehack, not enough money for hack
		broke: 6000,
		// how long to wait before restarting the hacking loop
		hack: 3500
	},
	// how many hacks to try (and fail) before restarting
	maxHackFails: 5,
	// how high to upgrade all of your miner types
	maxMinerLevel: 20,
	// all the gui settings
	gui: {
		enabled: true,
		width: "320px",
		height: "350px"
	},
	// all the ocr settings, disabled by default
	ocr: {
		enabled: false,
		url: "http://api.ocr.space/parse/image",
		key: "XXX"
	}
};

// eslint-disable-next-line prefer-const
vars = {
	// the object that contains a mapping of image urls to words (built over time)
	listingURL: {},
	// the object that contains b64 hashes to words (loaded on start)
	listingB64: {},
	// how much BT you have
	balance: 0,
	flags: {
		// we're waiting for OCR to complete
		ocrBlock: false,
		// we're waiting for the bar to move in response to our word
		progressBlock: false
	},
	loops: {
		word: null,
		upgrade: null,
		miner: null
	},
	hackProgress: 0,
	hackFailures: 0,
	// the different types of miners and their current rank
	minerStatus: [
		{name: "shop-basic-miner", value: 0},
		{name: "shop-advanced-miner", value: 0},
		{name: "shop-mining-drill", value: 0},
		{name: "shop-data-center", value: 0},
		{name: "shop-bot-net", value: 0},
		{name: "shop-quantum-server", value: 0}
	],
	gui: {
		dragReady: false,
		dragOffset: {x: 0, y: 0}
	}
};

// eslint-disable-next-line prefer-const
app = {
	start: () => {
		$.get(config.db).done((data) => {
			vars.listingB64 = JSON.parse(data);
			// first check the windows are open, and open them if they aren't
			if ($("#player-list").is(":visible") === false) {
				log("* Target list must be open");
				$("#desktop-list").children("img").click();
			}
			if ($("#window-shop").is(":visible") === false) {
				log("* Black market must be open");
				$("#desktop-shop").children("img").click();
				$("#desktop-miner").children("img").click();
			}
			if ($("#window-computer").is(":visible") === false) {
				log("* My computer must be open");
				$("#desktop-computer").children("img").click();
			}
			if (config.gui.enabled === true) {
				if ($("#custom-gui").is(":visible") === false) {
					log("* Opening bot window");
					gui.show();
				}
			} else {
				log("* GUI disabled, skipping...");
			}
			// start the automation
			app.automate();
		});
	},

	restart: () => {
		app.stop();
		log(". Waiting for restart...");
		setTimeout(() => {
			log(". Restarting!");
			app.automate();
		}, config.freq.hack);
	},

	stop: () => {
		// check and disable all loops
		for (const loop in vars.loops) {
			if (vars.loops[loop] === null) {
				log(`! Can't stop ${loop} loop`);
				continue;
			}
			clearInterval(vars.loops[loop]);
			vars.loops[loop] = null;
		}
		vars.hackProgress = 0;
		// reset flags
		vars.flags.ocrBlock = false;
		vars.flags.progressBlock = false;
		log("* Stopped all hacking");
	},

	automate: () => {
		// does everything to prep for hacking except word guessing
		app.attack();
		// start the loop for btc monitoring
		vars.loops.miner = setInterval(loops.miner, config.freq.mine);
		// start the loop for upgrades
		vars.loops.upgrade = setInterval(loops.upgrade, config.freq.upgrade);
	},

	attack: () => {
		const targetsList = $(".window-list-table-select");
		const targetToAttack = targetsList[getRandomInt(0, targetsList.length - 1)];
		const targetName = targetToAttack.innerText;
		log(`. Now attacking ${targetName}`);
		// click it, and then hack, and then a random port
		targetToAttack.click();
		$("#window-other-button").click();
		const portNumber = getRandomInt(1,3);
		// do a check for money
		const portStyle = $(`#window-other-port${portNumber}`).attr("style");
		if (portStyle.indexOf("opacity: 1") === -1) {
			// this port costs too much, let's wait a bit
			log("* Hack too expensive, waiting");
			setTimeout(app.attack, config.freq.broke);
			return;
		}
		$(`#window-other-port${portNumber}`).click();
		vars.loops.word = setInterval(loops.word, config.freq.word);
	},

	findWord: () => {
		const wordLink = $(".tool-type-img").prop("src");
		if (!wordLink.endsWith("s0urce.io/client/img/words/template.png")) {
			if (vars.listingURL.hasOwnProperty(wordLink) === true) {
				const word = vars.listingURL[wordLink];
				log(`. Found word (URL): [${word}]`);
				app.submit(word);
				return;
			}
			toDataURL(wordLink).then((dataUrl) => {
				const hash = getHashCode(dataUrl);
				if (vars.listingB64.hasOwnProperty(hash) === true) {
					const word = vars.listingB64[hash];
					log(`. Found word (B64): [${word}]`);
					app.learn(word);
					return;
				}
				if (config.ocr.enabled === true) {
					log("* Not seen, trying OCR...");
					app.doOCR(config.ocr.url, {
						apikey: config.ocr.key,
						language: "eng",
						url: wordLink
					});
				} else {
					log("* OCR disabled, skipping...");
				}
			});
		} else {
			log("* Can't find the word link...");
			app.restart();
		}
	},

	learn: (word) => {
		const wordLink = $(".tool-type-img").prop("src");
		vars.listingURL[wordLink] = word;
		app.submit(word);
	},

	submit: (word) => {
		$("#tool-type-word").val(word);
		$("#tool-type-word").submit();
	},

	doOCR: (link, payload) => {
		vars.flags.ocrBlock = true;
		// this is made somewhat generic to allow different ocr vendors
		$.post(link, payload).done((data) => {
			const word = String(data["ParsedResults"][0]["ParsedText"]).trim().toLowerCase().split(" ").join("");
			if (word.length > 2) {
				log(`. Got data: [${word}]`);
				$("#tool-type-word").val(word);
				app.learn(word);
				vars.flags.ocrBlock = false;
			} else {
				log("* OCR failed");
				app.restart();
			}
		});
	}
};

loops = {
	word: () => {
		// block is true is we're mid-OCR
		if (vars.flags.ocrBlock === true) {
			return;
		}
		if ($("#targetmessage-input").is(":visible") === true) {
			// we're done!
			$("#targetmessage-input").val(config.message);
			$("#targetmessage-button-send").click();
			app.restart();
			return;
		}
		// if we're waiting on the progress bar to move...
		if (vars.flags.progressBlock === true) {
			const newHackProgress = parseHackProgress($("#progressbar-firewall-amount").attr("style"));
			// check to see if it's new
			if (vars.hackProgress === newHackProgress) {
				// the bar hasn't moved
				log("* Progress bar hasn't moved, waiting");
				vars.hackFails++;
				if (vars.hackFails >= config.maxHackFails) {
					vars.hackFails = 0;
					log("* Progress bar is stuck, restarting");
					// maybe the URLs have changed
					vars.listingURL = {};
					app.restart();
				}
				return;
			}
			// the bar has moved
			vars.hackFails = 0;
			vars.hackProgress = newHackProgress;
			vars.flags.progressBlock = false;
		}
		// actually do the word stuff
		vars.flags.progressBlock = true;
		app.findWord();
	},

	miner: () => {
		// first, get the status of our miners
		for (const miner of vars.minerStatus) {
			// set value
			miner.value = parseInt($(`#${miner.name}-amount`).text());
			// this is available to buy
			if ($(`#${miner.name}`).attr("style") === "opacity: 1;") {
				if (miner.value < config.maxMinerLevel) {
					// we should buy this
					$(`#${miner.name}`).click();
				}
			}
		}
	},

	upgrade: () => {
		vars.balance = parseInt($("#window-my-coinamount").text());
		// if the back button is visible, we're on a page, let's back out
		if ($("#window-firewall-pagebutton").is(":visible") === true) {
			$("#window-firewall-pagebutton").click();
		}
		// just get a random port, because who cares
		const firewall = getRandomInt(1,3);
		// select the firewall
		log(`. Handling upgrades to firewall ${firewall}`);
		$(`#window-firewall-part${firewall}`).click();
		// get stats
		const stats = {
			charge: parseInt($("#shop-max-charges").text()),
			strength: parseInt($("#shop-strength").text()),
			regen: parseInt($("#shop-regen").text())
		};
		const statLookup = {
			charge: "max_charge10",
			strength: "difficulty",
			regen: "regen"
		};
		const maxStats = {
			charge: 30,
			strength: 4,
			regen: 10
		};

		for (const stat in stats) {
			if (stats[stat] < maxStats[stat]) {
				const statPrice = parseInt($(`#shop-firewall-${statLookup[stat]}-value`).text());
				if (statPrice < vars.balance) {
					log(`. Buying ${stat}`);
					$(`#shop-firewall-${statLookup[stat]}`).click();
					return;
				}
			}
		}
		// nothing matched, let's go back
		if ($("#window-firewall-pagebutton").is(":visible") === true) {
			$("#window-firewall-pagebutton").click();
		}
	}
};

gui = {
	show: () => {
		if ($("#custom-gui").length > 0) {
			$("#custom-gui").show();
		}
		const sizeCSS = `height: ${config.gui.height}; width: ${config.gui.width};`;
		const labelMap = {
			word: "Word Speed",
			mine: "Miner Upgrade",
			upgrade: "Firewall Upgrade",
			hack: "Hack Wait"
		};
		const freqInput = (type) => {
			return `<span style="font-size:18px">
				${labelMap[type]}:
				<input type="text" class="custom-gui-freq input-form" style="width:50px;margin:0px 0px 15px 5px;border:" value="${config.freq[type]}" data-type="${type}">
				<span>(ms)</span>
			</span>`;
		};
		const botWindowHTML = `
		<div id="custom-gui" class="window" style="border-color: rgb(62, 76, 95); color: rgb(191, 207, 210); ${sizeCSS} z-index: 10; top: 363px; left: 914px;">
			<div id="custom-gui-bot-title" class="window-title" style="background-color: rgb(62, 76, 95);">
				Source.io Bot
				<span class="window-close-style">
					<img class="window-close-img" src="http://s0urce.io/client/img/icon-close.png">
				</span>
			</div>
			<div class="window-content" style="${sizeCSS}">
				<div id="custom-restart-button" class="button" style="display: block; margin-bottom: 15px">
					Restart Bot
				</div>
				<div id="custom-stop-button" class="button" style="display: block; margin-bottom: 15px">
					Stop Bot
				</div>
				${freqInput("word")}
				${freqInput("mine")}
				${freqInput("hack")}
				<div id="custom-github-button" class="button" style="display: block; margin-top: 20%">
					This script is on Github!
				</div>
			</div>
		</div>`;
		$(".window-wrapper").append(botWindowHTML);
		// bind functions to the gui's buttons
		$("#custom-gui-bot-title > span.window-close-style").on("click", () => {
			$("#custom-gui").hide();
		});
		$("#custom-restart-button").on("click", () => {
			app.restart();
		});
		$("#custom-stop-button").on("click", () => {
			app.stop();
		});
		$("#custom-github-button").on("click", () => {
			window.open("https://github.com/snollygolly/sourceio-automation");
		});
		$(".custom-gui-freq").on("keypress", (e) => {
			if (e.keyCode !== 13) {
				return;
			}
			const type = $(e.target).attr("data-type");
			if (!config.freq[type]) {
				// invalid input, disregard i guess?
				return;
			}
			config.freq[type] = $(e.target).val();
			log(`* Frequency for '${type}' set to ${config.freq[type]}`);
		});
		// make the bot window draggable
		botWindow = ("#custom-gui");
		$(document).on("mousedown", botWindow, (e) => {
			vars.gui.dragReady = true;
			vars.gui.dragOffset.x = e.pageX - $(botWindow).position().left;
			vars.gui.dragOffset.y = e.pageY - $(botWindow).position().top;
		});
		$(document).on("mouseup", botWindow, (e) => {
			vars.gui.dragReady = false;
		});
		$(document).on("mousemove", (e) => {
			if (vars.gui.dragReady) {
				$(botWindow).css("top", `${e.pageY - vars.gui.dragOffset.y}px`);
				$(botWindow).css("left", `${e.pageX - vars.gui.dragOffset.x}px`);
			}
		});
	}
};


function parseHackProgress(progress) {
	// remove the %;
	const newProgress = progress.slice(0, -2);
	const newProgressParts = newProgress.split("width: ");
	return parseInt(newProgressParts.pop());
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getHashCode(data) {
	let hash = 0;
	if (data.length === 0) {
		return hash;
	}
	for (let i = 0; i < data.length; i++) {
		const c = data.charCodeAt(i);
		hash = ((hash << 5) - hash) + c;
		hash &= hash;
	}
	return hash.toString();
}

function toDataURL(url) {
	return fetch(url)
		.then(response => response.blob())
		.then(blob => new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		}));
}

function log(message) {
	console.log(`:: ${message}`);
}
