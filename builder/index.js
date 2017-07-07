const bluebird = require("bluebird");
const co = require("co");
const rp = require("request-promise");
const md5 = require("md5");
const fs = bluebird.promisifyAll(require("fs"));

const rootPath = "http://s0urce.io/client/img/word"
const outputPath = `${__dirname}/output`;

const hashMap = require("./hash.json");

const easyMod = "e";
const mediumMod = "m";
const hardMod = "h";

const easyLimit = 61;
const mediumLimit = 65;
const hardLimit = 54;

const result = {};

co(function* co(){
	console.log("* Starting image fetching");
	// trying to read easy images
	let easyCount = 0;
	while (easyCount <= easyLimit) {
		const url = `${rootPath}/${easyMod}/${easyCount}`;
		const image = yield rp({
			uri: url,
			method: "GET",
			encoding: null
		});
		const path = `${outputPath}/images/easy-${easyCount}.png`;
		console.log(`* Writing easy image ${easyCount} to ${path}`);
		yield fs.writeFileAsync(path, image, "binary");
		result[url] = hashLookup(image);
		easyCount++;
	}

	let mediumCount = 0;
	while (mediumCount <= mediumLimit) {
		const url = `${rootPath}/${mediumMod}/${mediumCount}`;
		const image = yield rp({
			uri: url,
			method: "GET",
			encoding: null
		});
		result[url] = "";
		const path = `${outputPath}/images/medium-${mediumCount}.png`;
		result[url] = hashLookup(image);
		console.log(`* Writing medium image ${mediumCount} to ${path}`);
		yield fs.writeFileAsync(path, image, "binary");
		mediumCount++;
	}

	let hardCount = 0;
	while (hardCount <= hardLimit) {
		const url = `${rootPath}/${hardMod}/${hardCount}`;
		const image = yield rp({
			uri: url,
			method: "GET",
			encoding: null
		});
		result[url] = "";
		const path = `${outputPath}/images/hard-${hardCount}.png`;
		result[url] = hashLookup(image);
		console.log(`* Writing hard image ${hardCount} to ${path}`);
		yield fs.writeFileAsync(path, image, "binary");
		hardCount++;
	}

	console.log("* Writing db file");
	// write the result
	const path = `${outputPath}/listing.json`;
	yield fs.writeFileAsync(path, JSON.stringify(result, null, 2));
	console.log("* Done!");

}).catch((err) => {
	throw new Error (err.toString());
});

function hashLookup(image) {
	const md5Hash = md5(image);
	if (!hashMap[md5Hash]) {
		console.error(`! No mapping found for ${md5Hash}`);
		return null;
	}
	return hashMap[md5Hash];
}
