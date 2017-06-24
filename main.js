let app;
let listing = null;
let isAutomated = false;
let block = false;
let wordLoop = null;
let minerLoop = null;
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

const ocrApiKey = "e3b7e80ac588957";
const db = "https://raw.githubusercontent.com/snollygolly/sourceio-automation/master/db.json";
const message = "papa bless, one love /r/javascript";
const wordFreq = 1250;
const mineFreq = 2000;
const minerLevel = 20;

app = {
	start: () => {
		$.get("https://raw.githubusercontent.com/snollygolly/sourceio-automation/master/db.json").done((data) => {
			listing = JSON.parse(data);
			automate();
		});
	},

	exportListing: () => {
		console.log(JSON.stringify(listing, null, 2));
	},

	automate: () => {
		// first check the windows are open, and open them if they aren't
		if ($("#player-list").is(":visible") === false) {
			console.error("! Target list must be open");
			$("#desktop-list").children("img").click();
		}
		if ($("#window-shop").is(":visible") === false) {
			console.error("! Black market must be open");
			$("#desktop-shop").children("img").click();
		}
		isAutomated = true;
		// start by getting the first target in the list
		const targetName = $("#player-list").children("tr").eq(0)[0].innerText;
		console.log(`* Now attacking ${targetName}`);
		// click it, and then hack, and then port b
		$("#player-list").children("tr").eq(0)[0].click();
		$("#window-other-button").click();
		// do a check for money
		const portStyle = $("#window-other-port2").attr("style");
		if (portStyle.indexOf("opacity: 1") === -1) {
			// this port costs too much, let's wait a bit
			console.log("* Hack too expensive, waiting");
			setTimeout(app.automate, 1000);
			return;
		}
		$("#window-other-port2").click();
		// start the loop that does the guessing
		wordLoop = setInterval(app.loops.word, wordFreq);
		// start the loop for btc monitoring
		minerLoop = setInterval(app.loops.miner, mineFreq
		);
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
		}
	},

	restart: () => {
		app.stop();
		app.automate();
	},

	stop: () => {
		if (wordLoop === null && minerLoop === null) {
			console.log("! No loops to stop");
			return;
		}
		isAutomated = false;
		block = false;
		clearInterval(wordLoop);
		clearInterval(minerLoop);
		wordLoop = null;
		console.log("* Stopped loop");
	},

	exportListing: () => {
		console.log(JSON.stringify(listing, null, 2));
	},

	go: () => {
		console.log("* Running 'go'");
		const wordLink = $(".tool-type-img").prop("src");
		if (listing.hasOwnProperty(wordLink) === true) {
			const word = listing[wordLink];
			console.log(`* Found word: [${word}]`);
			app.submit(word);
			return;
		}
		console.log("* Not seen, trying OCR...");
		app.ocr(wordLink);
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
			const word = String(data["ParsedResults"][0]["ParsedText"]).trim().toLowerCase();
			if (word.length > 3) {
				console.log(`* Got data: [${word}]`);
				$("#tool-type-word").val(word);
				if (isAutomated === true) {
					app.learn(word);
					block = false;
				}
			} else {
				console.log("! OCR failed");
				app.restart();
			}
		});
	}
};
