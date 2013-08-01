/**********************************************************/
/******************GLOBAL VARS*****************************/
/**********************************************************/
var canvas, ctx;

var leap;
var leapPlayerMap = {};

var gameState;
var freeze = false;
var players = [];
var nonDeadPlayers;
var totalPlayers;
var activePlayer;

var storedSequence = [];
var currentSequence = [];
var currentFingers = {};

var pulses = [];

var synths = [];


/**********************************************************/
/******************ENUMS***********************************/
/**********************************************************/
var GAME_STATES = {
	BOOT: 0,
	SEARCH_PLAYERS: 1,
	PLAY: 2,
	END: 3
};

var FREEZE_STATES = {
	NONE: false,
	WAIT_PUNISH: 1,
	WAIT_SPEECH: 2
};

var FREQUENCIES = {
	1: 32.70, // C1
	2: 36.71, // D1
	3: 41.20, // E1
	4: 43.65, // F1
	5: 49.00  // G1
};


/**********************************************************/
/******************METHODS*********************************/
/**********************************************************/
function say(msg, callback) {
	"use strict";

	console.log("\"" + msg + "\"");
	meSpeak.speak(String(msg), {
		pitch: 40,
		speed: 170,
		wordgap: 1
	});

	if (callback) {
		callback();
	}
}

function pos2arg(x, y) {
	"use strict";

	if ((x > 0) && (y >= 0)) {
		return Math.atan(y / x);
	} else if ((x < 0) && (y > 0)) {
		return Math.PI - Math.atan(y / (-x));
	} else if ((x < 0) && (y <= 0)) {
		return Math.PI + Math.atan((-y) / (-x));
	} else if ((x > 0) && (y < 0)) {
		return 2 * Math.PI - Math.atan((-y) / x);
	} else if ((x === 0) && (y > 0)) {
		return 0.5 * Math.PI;
	} else if ((x === 0) && (y < 0)) {
		return 1.5 * Math.PI;
	} {
		return NaN;
	}
}

function enumerateObjects(objects, center, base) {
	"use strict";
	var i, toSort, relX, relY, baseArg;

	if (!center) {
		center = {
			x: 0,
			y: 0
		};
	}
	if (!base) {
		base = {
			x: 0,
			y: 1
		};
	}

	toSort = [];
	for (i = 0; i < objects.length; ++i) {
		relX = objects[i].x - center.x;
		relY = objects[i].y - center.y;

		toSort.push([
				objects[i],
				pos2arg(relX, relY)
			]);
	}

	baseArg = pos2arg(base.x - center.x, base.y - center.y);
	for (i = 0; i < toSort.length; ++i) {
		// add additional 2 * Math.PI to avoid modulo operation on negative numbers
		toSort[i][1] = (toSort[i][1] - baseArg + 3 * Math.PI) % (2 * Math.PI);
	}

	toSort.sort(function sortObjects(a,b) {
		return a[1] - b[1];
	});

	for (i = 0; i < toSort.length; ++i) {
		toSort[i][0].id = i + 1;
	}
}

function getPlayer(id) {
	"use strict";
	var i;

	for (i = 0; i < players.length; ++i) {
		if (players[i].id === id) {
			return players[i];
		}
	}
}

function checkSequence() {
	"use strict";
	var i;

	for (i = 0; i < Math.min(storedSequence.length, currentSequence.length); ++i) {
		if (storedSequence[i] !== currentSequence[i]) {
			return false;
		}
	}

	return true;
}

function unfreez() {
	"use strict";

	freeze = FREEZE_STATES.NONE;
}


/**********************************************************/
/******************OBJECTS*********************************/
/**********************************************************/
function Finger() {
	"use strict";
	var self = this;

	self.id = 0;
	self.x = 0;
	self.y = 0;
	self.rotation = 0;
	self.active = false;
}

function Player() {
	"use strict";
	var self = this;

	self.id = 0;
	self.x = 0;
	self.y = 0;
	self.size = 50;
	self.fingers = [];
	self.leapFingerMap = {};

	function enumerateFingers() {
		var i, mean;

		mean = {
			x: 0,
			y: 0
		};
		for (i = 0; i < self.fingers.length; ++i) {
			mean.x += self.fingers[i].x / self.fingers.length;
			mean.y += self.fingers[i].y / self.fingers.length;
		}

		enumerateObjects(self.fingers, self, mean);
	}
	self.enumerateFingers = enumerateFingers;
}

function Pulse(_x, _y) {
	"use strict";
	var self = this;

	self.x = _x;
	self.y = _y;
	self.phase = 0;
}


/**********************************************************/
/******************THREADS*********************************/
/**********************************************************/
function render() {
	"use strict";
	var i, j, x, finger, player, scaleFactor;

	scaleFactor = Math.min(canvas.width, canvas.height) / 400;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.scale(scaleFactor, scaleFactor);
	ctx.translate(200 + (canvas.width / scaleFactor - 400) / 2, 200 + (canvas.height / scaleFactor - 400) / 2);

	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	for (i = 0; i < pulses.length; ++i) {
		x = Math.round((1 - pulses[i].phase) * 127).toString(16);
		if (x.length === 1) {
			x = "0" + x;
		}

		ctx.beginPath();
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#" + x + x + x;
		ctx.arc(pulses[i].x, pulses[i].y, pulses[i].phase * 200, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.closePath();
	}

	for (i = 0; i < players.length; ++i) {
		player = players[i];

		ctx.beginPath();
		ctx.arc(player.x, player.y, player.size, 0, 2 * Math.PI);
		if ((player.id === activePlayer) && (freeze === FREEZE_STATES.WAIT_PUNISH)) {
			ctx.fillStyle = "#220000";
			ctx.strokeStyle = "#bb1111";
		} else {
			ctx.fillStyle = "#000022";
			ctx.strokeStyle = "#1111bb";
		}
		if (player.id === activePlayer) {
			ctx.fill();
			ctx.lineWidth = 2;
		} else {
			ctx.lineWidth = 1;
		}
		ctx.stroke();
		ctx.closePath();

		if (player.id !== 0) {
			if ((player.id === activePlayer) && (freeze === FREEZE_STATES.WAIT_PUNISH)) {
				ctx.fillStyle = "#bb1111";
			} else {
				ctx.fillStyle = "#1111bb";
			}
			ctx.font = "30px Arial";
			ctx.fillText(player.id, player.x, player.y);
		}

		for (j = 0; j < player.fingers.length; ++j) {
			finger = player.fingers[j];

			ctx.save();
			ctx.translate(finger.x, finger.y);
			ctx.rotate(finger.rotation);

			ctx.beginPath();
			ctx.rect(-10, -15, 20, 30);
			if ((player.id === activePlayer) && (freeze === FREEZE_STATES.WAIT_PUNISH)) {
				ctx.fillStyle = "#220000";
				ctx.strokeStyle = "#bb1111";
			} else {
				ctx.fillStyle = "#002200";
				ctx.strokeStyle = "#11bb11";
			}
			if (finger.active) {
				ctx.fill();
				ctx.lineWidth = 3;
			} else {
				ctx.lineWidth = 1;
			}
			ctx.stroke();
			ctx.closePath();

			if (finger.id !== 0) {
				if ((player.id === activePlayer) && (freeze === FREEZE_STATES.WAIT_PUNISH)) {
					ctx.fillStyle = "#bb1111";
				} else {
					ctx.fillStyle = "#11bb11";
				}
				ctx.font = "15px Arial";
				ctx.fillText(finger.id, 0, 0);
			}

			ctx.restore();
		}
	}

	window.requestAnimationFrame(render);
}

function parseFrame(frame) {
	"use strict";
	var i, j, finger, fingersChanged, fingersMean, lfinger, hand, nextLeapFingerMap, nextFingers, nextLeapPlayerMap, nextPlayers, player;

	nextPlayers = [];
	nextLeapPlayerMap = {};

	for (i = 0; i < frame.hands.length; ++i) {
		hand = frame.hands[i];
		player = undefined;

		if ((gameState === GAME_STATES.SEARCH_PLAYERS) && (!leapPlayerMap[hand.id]) && (hand.fingers.length === 5)) {
			say("Player detected.");
			player = new Player();
		} else if (leapPlayerMap[hand.id]) {
			player = leapPlayerMap[hand.id];
		}

		if (player) {
			player.x = hand.palmPosition[0];
			player.y = hand.palmPosition[2];
			player.size = hand.sphereRadius / 2;

			nextPlayers.push(player);
			nextLeapPlayerMap[hand.id] = player;

			nextFingers = [];
			nextLeapFingerMap = {};
			fingersChanged = false;
			fingersMean = 0.0;

			for (j = 0; j < hand.fingers.length; ++j) {
				lfinger = hand.fingers[j];

				if (player.leapFingerMap[lfinger.id]) {
					finger = player.leapFingerMap[lfinger.id];
				} else {
					finger = new Finger();
					fingersChanged = true;
				}

				finger.x = lfinger.tipPosition[0];
				finger.y = lfinger.tipPosition[2];
				finger.rotation = lfinger.direction[0];
				fingersMean += lfinger.tipPosition[1] / hand.fingers.length;

				nextFingers.push(finger);
				nextLeapFingerMap[lfinger.id] = finger;
			}

			// need at least 3 fingers to detect active fingers
			if (hand.fingers.length >= 3) {
				for (j = 0; j < hand.fingers.length; ++j) {
					lfinger = hand.fingers[j];
					finger = nextLeapFingerMap[lfinger.id];

					if (finger.active && ((fingersMean - lfinger.tipPosition[1]) < 12)) {
						finger.active = false;
					}
					if (!finger.active && ((fingersMean - lfinger.tipPosition[1]) > 17)) {
						finger.active = true;
					}
				}
			}

			if (player.fingers.length !== nextFingers.length) {
				fingersChanged = true;
			}

			player.fingers = nextFingers;
			player.leapFingerMap = nextLeapFingerMap;

			if (fingersChanged && (player.fingers.length === 5)) {
				player.enumerateFingers();
			}
		}
	}

	players = nextPlayers;
	leapPlayerMap = nextLeapPlayerMap;
}

function keyPress(evt) {
	"use strict";
	var i;

	evt.preventDefault();

	// space?
	if (evt.keyCode === 32) {
		if ((gameState === GAME_STATES.SEARCH_PLAYERS) && (players.length > 0)) {
			say("Let's begin!");
			enumerateObjects(players);
			totalPlayers = players.length;

			nonDeadPlayers = [];
			for (i = 0; i < players.length; ++i) {
				nonDeadPlayers.push(players[i].id);
			}

			gameState = GAME_STATES.PLAY;
		}

		if (freeze === FREEZE_STATES.WAIT_PUNISH) {
			say("Player " + activePlayer + ", let's try again!");

			freeze = FREEZE_STATES.WAIT_SPEECH;
			window.setTimeout(function() {
				currentFingers = {};
				currentSequence = [];
				freeze = FREEZE_STATES.NONE;
			}, 400);
		}
	}
}

function logic() {
	"use strict";
	var i, finger, nextFingers, nextNonDeadPlayers, nextPulses, player;

	// next player?
	if (!freeze &&
			(gameState === GAME_STATES.PLAY) &&
			(players.length > 0) &&
			((!activePlayer) || ((currentSequence.length > storedSequence.length) && checkSequence()))) {
		storedSequence = currentSequence;
		currentSequence = [];

		if (!activePlayer) {
			activePlayer = 1;
		} else {
			activePlayer = 1 + (activePlayer % totalPlayers);
		}

		while (!getPlayer(activePlayer)) {
			activePlayer = 1 + (activePlayer % totalPlayers);
		}

		currentFingers = {};

		freeze = FREEZE_STATES.WAIT_SPEECH;
		window.setTimeout(function() {
			say("Player " + activePlayer + ", it's your turn!");

			window.setTimeout(function() {
				freeze = FREEZE_STATES.NONE;
			}, 200);
		}, 400);
	}

	// analyze state
	if (!freeze &&
			(gameState === GAME_STATES.PLAY) &&
			(player = getPlayer(activePlayer))) {
		// check fingers
		nextFingers = {};
		for (i = 0; i < player.fingers.length; ++i) {
			finger = player.fingers[i];

			if ((finger.active) && (finger.id !== 0)) {
				nextFingers[finger.id] = true;

				if (!currentFingers[finger.id]) {
					currentSequence.push(finger.id);
					pulses.push(new Pulse(finger.x, finger.y));
					console.log("Play " + finger.id);
					synths[finger.id].play();
				}
			} else if (finger.id !== 0) {
				synths[finger.id].pause();
			}
		}
		currentFingers = nextFingers;

		// check sequence
		if (!checkSequence()) {
			say("Player " + activePlayer + ", you are wrong! Game members, feel free to punish him! Press space when you are ready!");
			synths.fail.play();
			window.setTimeout(function() {
				synths.fail.pause();
			}, 1000);
			for (i = 1; i <= 5; ++i) {
				synths[i].pause();
			}
			freeze = FREEZE_STATES.WAIT_PUNISH;
		}
	}

	// looking for dead players
	if (!freeze &&
			(gameState === GAME_STATES.PLAY)) {
		nextNonDeadPlayers = [];
		for (i = 0; i < nonDeadPlayers.length; ++i) {
			if (getPlayer(nonDeadPlayers[i]) || (freeze === FREEZE_STATES.WAIT_SPEECH)) {
				nextNonDeadPlayers.push(nonDeadPlayers[i]);
			} else {
				say("We lost player " + nonDeadPlayers[i] + "!");
				freeze = FREEZE_STATES.WAIT_SPEECH;
				window.setTimeout(unfreez, 1000);
			}
		}
		nonDeadPlayers = nextNonDeadPlayers;
	}

	// all players dead?
	if (!freeze &&
			(gameState === GAME_STATES.PLAY) &&
			(players.length === 0)) {
		say("You are drunk. The game ends now!");
		activePlayer = undefined;
		gameState = GAME_STATES.END;
	}

	// animation
	nextPulses = [];
	for (i = 0; i < pulses.length; ++i) {
		pulses[i].phase += 0.04;
		if (pulses[i].phase < 1) {
			nextPulses.push(pulses[i]);
		}
	}
	pulses = nextPulses;

	window.setTimeout(logic, 50);
}

function init() {
	"use strict";
	var i;

	gameState = GAME_STATES.BOOT;

	canvas = document.getElementById("canvas");
	canvas.height = canvas.clientHeight;
	canvas.width = canvas.clientWidth;

	ctx = canvas.getContext("2d");

	leap = new Leap.Controller();
	leap.on("frame", parseFrame);
	leap.connect();

	meSpeak.loadConfig("data/mespeak_config.json");
	meSpeak.loadVoice("data/mespeak_en.json");

	for (i = 1; i <=5; ++i) {
		flock.init();
		synths[i] = flock.synth({
			synthDef: [
				{
					id: "leftSynth_" + i,
					ugen: "flock.ugen.triOsc",
					fleq: FREQUENCIES[i]
				},
				{
					id: "rightSynth_" + i,
					ugen: "flock.ugen.triOsc",
					freq: FREQUENCIES[i] + 2
				}
			]
		});
	}
	flock.init();
	synths.fail = flock.synth({
		synthDef: {
			ugen: "flock.ugen.lfPulse",
			freq: 1000,
			mul: 0.1
		}
	});

	document.addEventListener("keydown", keyPress);

	gameState = GAME_STATES.SEARCH_PLAYERS;

	window.requestAnimationFrame(render);
	window.setTimeout(logic, 50);

	say("Welcome, my name is Aurora. I'm your brainmaster. Just put your 5 finger hands over the leap device and press space when all players are detected.");
}


/**********************************************************/
/*****************BOOT*************************************/
/**********************************************************/
window.onload = init;

