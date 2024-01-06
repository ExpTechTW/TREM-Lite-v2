/* eslint-disable no-undef */
function parseJSON(jsonString) {
	try {
		return JSON.parse(jsonString);
	} catch (err) {
		return null;
	}
}

function getRandomElement(arr) {
	const randomIndex = Math.floor(Math.random() * arr.length);
	return arr[randomIndex];
}

function now() {
	return Date.now() + variable.time_offset;
}

function formatTwoDigits(n) {
	return n < 10 ? "0" + n : n;
}

function generateMD5(input) {
	return crypto.createHash("md5").update(input).digest("hex");
}

function region_code_to_string(region, code) {
	for (const city of Object.keys(region))
		for (const town of Object.keys(region[city]))
			if (region[city][town].code == code)
				return { city, town };
	return null;
}