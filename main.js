let app;
let listing = null;
let isAutomated = false;
let block = false;
let waiting = false;
let hackProgress = 0;
let wordLoop = null;
let minerLoop = null;
let upgradeLoop = null;
let myBT = 0;
let minerStatus = [
	{
		name: "shop-basic-miner",
		value: 0
	},
	{
		name: "shop-advanced-miner",
		value: 0
	},
	{
		name: "shop-mining-drill",
		value: 0
	},
	{
		name: "shop-data-center",
		value: 0
	},
	{
		name: "shop-bot-net",
		value: 0
	},
	{
		name: "shop-quantum-server",
		value: 0
	}
];
let maxStats = {
	charge: 30,
	strength: 4,
	regen: 10
};
const firewalls = ["1", "2", "3"];
const ocrApiKey = "XXX";
const db = "https://raw.githubusercontent.com/snollygolly/sourceio-automation/master/db.json";
let message = "papa bless, one love /r/javascript";
let wordFreq = 1250;
let mineFreq = 3000;
let blockFreq = 5000;
let upgradeFreq = 7500;
let minerLevel = 20;
let playerToAttack = 0;

app = {
	start: () => {
		$.get(db).done((data) => {
			listing = JSON.parse(data);
			app.automate();
		});
	},

	exportListing: () => {
		log(JSON.stringify(listing, null, 2));
	},

	automate: () => {
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
		if ($("#window-bot").is(":visible") === false) {
			log("* Opening bot window");
			app.gui();
		}
		isAutomated = true;
		// start by getting the first target in the list
		const targetName = $("#player-list").children("tr").eq(playerToAttack)[0].innerText;
		log(`. Now attacking ${targetName}`);
		// click it, and then hack, and then port b
		$("#player-list").children("tr").eq(playerToAttack)[0].click();
		$("#window-other-button").click();
		// do a check for money
		const portStyle = $(`#window-other-port${firewalls[0]}`).attr("style");
		if (portStyle.indexOf("opacity: 1") === -1) {
			// this port costs too much, let's wait a bit
			log("* Hack too expensive, waiting");
			setTimeout(app.automate, blockFreq);
			return;
		}
		$("#window-other-port2").click();
		// handle upgrades
		app.loops.upgrade();
		// start the loop that does the guessing
		wordLoop = setInterval(app.loops.word, wordFreq);
		// start the loop for btc monitoring
		minerLoop = setInterval(app.loops.miner, mineFreq);
		// start the loop for upgrades
		//upgradeLoop = setInterval(app.loops.upgrade, upgradeFreq);
	},

	gui: () => {
		//check if bot window has been appended already
		if ($("#window-bot").length > 0) {
			$("#window-bot").show();
		}
		else {
			//change these variables to ajust the size of the bot's window in px
			let windowWidth = "320px";
			let windowHeight = "350px";
			//create all of the elements for the bot's gui
			let $botWindow = $("<div>", {
				class: "window",
				id: "window-bot",
				css: {
					"border-color": "rgb(77, 100, 122);",
					"color:": "rgb(191, 207, 210)",
					"height": windowHeight,
					"width": windowWidth,
					"z-index": "10",
					"top": "363px",
					"left": "914px"
				}
			});
			let $botTitle = $("<div>", {
				class: "window-title",
				css: { "background-color": "rgb(77, 100, 122);" },
				text: "Source.io Bot"
			});
			let $closeButton = $("<span>", {
				class: "window-close-style"
			});
			let $closeButtonImage = $("<img>", {
				class: "window-close-img",
				src: "http://s0urce.io/client/img/icon-close.png"
			});
			let $botContent = $("<div>", {
				class: "window-content",
				css: {
					"width": windowWidth,
					"height": windowHeight
				}
			});
			let $restartButton = $("<div>", {
				class: "button",
				css: {
					"display": "block",
					"margin-bottom": "15px"
				},
				text: "Restart Bot"
			});
			let $stopButton = $("<div>", {
				class: "button",
				css: {
					"display": "block",
					"margin-bottom": "15px"
				},
				text: "Stop Bot"
			});
			let $gitHubLink = $("<div>" , {
				class: "button",
				css: {"display": "block", "margin-top": "65%"}, 
				text: "This script is on Github!"
			});
			//bind functions to the gui's buttons
			$closeButton.click(() => {
				$botWindow.hide();
			});
			$restartButton.click(() => {
				app.restart();
			});
			$stopButton.click(() => {
				app.stop();
			});
			$gitHubLink.click(() => {
				window.open("https://github.com/snollygolly/sourceio-automation");
			});
			$botWindow.appendTo(".window-wrapper");
			$botTitle.appendTo($botWindow);
			$closeButton.appendTo($botTitle);
			$closeButtonImage.appendTo($closeButton);
			$botContent.appendTo($botWindow);
			$restartButton.appendTo($botContent);
			$stopButton.appendTo($botContent);
			$gitHubLink.appendTo($botContent);
			//make the bot window draggable
			Draggable("window-bot");
		}
	},

	loops: {
		word: () => {
			if (block === true) {
				return;
			}
			if ($("#targetmessage-input").is(":visible") === true) {
				// we're done!
				$("#targetmessage-input").val(message);
				$("#targetmessage-button-send").click();
				app.restart();
				return;
			}
			// if we're waiting on the progress bar to move...
			if (waiting === true) {
				const newHackProgress = parseHackProgress($("#progressbar-firewall-amount").attr("style"));
				// check to see if it's new
				if (hackProgress === newHackProgress) {
					// the bar hasn't moved
					log("* Progress bar hasn't moved, waiting");
					// TODO: make this an automatic process
					return;
				} else {
					// the bar has moved
					hackProgress = newHackProgress;
					waiting = false;
				}
			}
			// actually do the word stuff
			waiting = true;
			app.go();
		},
		miner: () => {
			// first, get the status of our miners
			for (const miner of minerStatus) {
				// set value
				miner.value = parseInt($(`#${miner.name}-amount`).text());
				// this is available to buy
				if ($(`#${miner.name}`).attr("style") === "opacity: 1;") {
					if (miner.value < minerLevel) {
						// we should buy this
						$(`#${miner.name}`).click();
					}
				}
			}
		},
		upgrade: () => {
			myBT = parseInt($("#window-my-coinamount").text());
			// if the back button is visible, we're on a page, let's back out
			if ($("#window-firewall-pagebutton").is(":visible") === true) {
				$("#window-firewall-pagebutton").click();
			}
			// take it off the top
			const firewall = firewalls.shift()
			firewalls.push(firewall);
			// select the firewall
			log(`. Handling upgrades to firewall ${firewall}`);
			$(`#window-firewall-part${firewall}`).click();
			// get stats
			const stats = {
				charge: parseInt($("#shop-max-charges").text()),
				strength: parseInt($("#shop-strength").text()),
				regen: parseInt($("#shop-regen").text()),
			};
			// start checking prices, start with strength
			if (stats.strength < maxStats.strength) {
				log(". Strength isn't maxed");
				const strengthPrice = parseInt($("#shop-firewall-difficulty-value").text());
				if (strengthPrice < myBT) {
					log(". Buying strength");
					$("#shop-firewall-difficulty").click();
					return;
				}
			}
			// check max charges
			if (stats.charge < maxStats.charge) {
				log(". Charge isn't maxed");
				const chargePrice = parseInt($("#shop-firewall-max_charge10-value").text());
				if (chargePrice < myBT) {
					$("#shop-firewall-max_charge10").click();
					log(". Buying charge");
					return;
				}
			}
			// check regen
			if (stats.regen < maxStats.regen) {
				log(". Regen isn't maxed");
				const regenPrice = parseInt($("#shop-firewall-regen-value").text());
				if (regenPrice < myBT) {
					$("#shop-firewall-regen").click();
					log(". Buying regen");
					return;
				}
			}
			// nothing matched, let's go back
			if ($("#window-firewall-pagebutton").is(":visible") === true) {
				$("#window-firewall-pagebutton").click();
			}
		}
	},

	restart: () => {
		app.stop();
		app.automate();
	},

	stop: () => {
		if (wordLoop === null && minerLoop === null && upgradeLoop === null) {
			log("! No loops to stop");
			return;
		}
		isAutomated = false;
		block = false;
		waiting = false;
		clearInterval(wordLoop);
		wordLoop = null;
		clearInterval(minerLoop);
		minerLoop = null;
		clearInterval(upgradeLoop);
		upgradeLoop = null;
		log("* Stopped loops");
	},

	exportListing: () => {
		log(JSON.stringify(listing, null, 2));
	},

	go: () => {
		const wordLink = $(".tool-type-img").prop("src");
		if (wordLink !== "http://s0urce.io/client/img/words/template.png") {
			if (listing.hasOwnProperty(wordLink) === true) {
				const word = listing[wordLink];
				log(`. Found word: [${word}]`);
				app.submit(word);
				return;
			}
			log("* Not seen, trying OCR...");
			app.ocr(wordLink);
		}
		else {
			log("* Can't find the word link...");
			app.restart();
		}
	},

	submit: (word) => {
		$("#tool-type-word").val(word);
		$("#tool-type-word").submit();
	},

	learn: (word) => {
		const wordLink = $(".tool-type-img").prop("src");
		listing[wordLink] = word;
		app.submit(word);
	},

	ocr: (url) => {
		block = true;
		$.post("http://api.ocr.space/parse/image", {
			apikey: ocrApiKey,
			language: "eng",
			url: url
		}).done((data) => {
			const word = String(data["ParsedResults"][0]["ParsedText"]).trim().toLowerCase().split(" ").join("");
			if (word.length > 2) {
				log(`. Got data: [${word}]`);
				$("#tool-type-word").val(word);
				if (isAutomated === true) {
					app.learn(word);
					block = false;
				}
			} else {
				log("* OCR failed");
				app.restart();
			}
		});
	}
};


let Draggable = function (id) {
	var el = document.getElementById(id),
		isDragReady = false,
		dragoffset = {
			x: 0,
			y: 0
		};
	this.init = function () {
		this.events();
	};
	//events for the element 
	this.events = function () {
		var self = this;
		
		_on(el, 'mousedown', function (e) {
			isDragReady = true;
			//corssbrowser mouse pointer values 
			e.pageX = e.pageX || e.clientX + (document.documentElement.scrollLeft ?
				document.documentElement.scrollLeft :
				document.body.scrollLeft);
			e.pageY = e.pageY || e.clientY + (document.documentElement.scrollTop ?
				document.documentElement.scrollTop :
				document.body.scrollTop);
			dragoffset.x = e.pageX - el.offsetLeft;
			dragoffset.y = e.pageY - el.offsetTop;
		});
		_on(document, 'mouseup', function () {
			isDragReady = false;
		});
		_on(document, 'mousemove', function (e) {
			if (isDragReady) {
				e.pageX = e.pageX || e.clientX + (document.documentElement.scrollLeft ?
					document.documentElement.scrollLeft :
					document.body.scrollLeft);
				e.pageY = e.pageY || e.clientY + (document.documentElement.scrollTop ?
					document.documentElement.scrollTop :
					document.body.scrollTop);
				el.style.top = (e.pageY - dragoffset.y) + "px";
				el.style.left = (e.pageX - dragoffset.x) + "px";
			}
		});
	};
	//cross browser event Helper function 
	var _on = function (el, event, fn) {
		document.attachEvent ? el.attachEvent('on' + event, fn) : el.addEventListener(event, fn, !0);
	};
	this.init();
}



function parseHackProgress(progress) {
	// remove the %;
	const newProgress = progress.slice(0, -2);
	const newProgressParts = newProgress.split("width: ");
	return parseInt(newProgressParts.pop());
}

function log(message) {
	console.log(`:: ${message}`);
}


