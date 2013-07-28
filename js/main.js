/**********************************************************/
/******************GLOBAL VARS*****************************/
/**********************************************************/
var canvas, ctx;

var leap;
var leapPlayerMap = new Object();

var gameState;
var players = [];


/**********************************************************/
/******************ENUMS***********************************/
/**********************************************************/
var GAME_STATES = {
	BOOT: 0,
	SEARCH_PLAYERS: 1,
	PLAY: 2
};

/**********************************************************/
/******************OBJECTS*********************************/
/**********************************************************/
function Finger() {
	"use strict";
	var self = this;

	self.id = 0;
	self.x = 0;
	self.y = 0;
	self.active = false;
}

function Player() {
	"use strict";
	var self = this;

	self.id = 0;
	self.x = 0;
	self.y = 0;
	self.fingers = [];
	self.leapFingerMap = new Object();

	self.enumerateFingers = enumerateFingers;

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
}


/**********************************************************/
/******************METHODS*********************************/
/**********************************************************/
function say(msg, callback) {
	"use strict";

	console.log(msg);

	if (callback) {
		callback();
	}
}

function pos2arg(x, y) {
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
		}
	}

	toSort = [];
	for (i = 0; i < objects.length; ++i) {
		relX = objects[i].x - center.x;
		relY = objects[i].y - center.y;

		toSort.push([
				objects[i],
				pos2arg(relX, relY)]);
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

function render() {
	"use strict";
	var i, j, finger, player, scaleFactor;

	scaleFactor = Math.min(canvas.width, canvas.height) / 400;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.scale(scaleFactor, scaleFactor);
	ctx.translate(200 + (canvas.width / scaleFactor - 400) / 2, 200 + (canvas.height / scaleFactor - 400) / 2);

	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	for (i = 0; i < players.length; ++i) {
		player = players[i];

		ctx.fillStyle = "#ffffff";
		ctx.font = "30px Arial";
		ctx.fillText(player.id, player.x, player.y);

		for (j = 0; j < player.fingers.length; ++j) {
			finger = player.fingers[j];

			if (finger.active) {
				ctx.fillStyle = "#00ff00";
			} else {
				ctx.fillStyle = "#ffffff";
			}
			ctx.font = "15px Arial";
			ctx.fillText(finger.id, finger.x, finger.y);
		}
	}

	window.requestAnimationFrame(render);
}

function parseFrame(frame) {
	"use strict";
	var i, j, finger, fingersChanged, lfinger, hand, nextLeapFingerMap, nextFingers, nextLeapPlayerMap, nextPlayers, player;

	nextPlayers = [];
	nextLeapPlayerMap = new Object();

	for (i = 0; i < frame.hands.length; ++i) {
		hand = frame.hands[i];
		player = undefined;

		if ((gameState == GAME_STATES.SEARCH_PLAYERS) && (!leapPlayerMap[hand.id]) && (hand.fingers.length == 5)) {
			say("player detected");
			player = new Player();
		} else if (leapPlayerMap[hand.id]) {
			player = leapPlayerMap[hand.id];
		}

		if (player) {
			player.x = hand.palmPosition[0];
			player.y = hand.palmPosition[2];

			nextPlayers.push(player);
			nextLeapPlayerMap[hand.id] = player;

			nextFingers = [];
			nextLeapFingerMap = new Object();
			fingersChanged = false;

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
				finger.active = ((hand.palmPosition[1] - lfinger.tipPosition[1]) > 20);

				nextFingers.push(finger);
				nextLeapFingerMap[lfinger] = finger;
			}

			if (player.fingers.length !== nextFingers.length) {
				fingersChanged = true;
			}

			player.fingers = nextFingers;
			player.leapFingerMap = nextLeapFingerMap;

			if (fingersChanged) {
				player.enumerateFingers();
			}
		}
	}

	players = nextPlayers;
	leapPlayerMap = nextLeapPlayerMap;
}

function keyPress(evt) {
	"use strict";

	evt.preventDefault();

	// space?
	if (evt.keyCode === 32) {
		if ((gameState == GAME_STATES.SEARCH_PLAYERS) && (players.length > 0)) {
			say("let's begin");
			enumerateObjects(players)
			gameState = GAME_STATES.PLAY;
		}
	}
}

function init() {
	"use strict";

	gameState = GAME_STATES.BOOT;

	canvas = document.getElementById("canvas");
	canvas.height = canvas.clientHeight;
	canvas.width = canvas.clientWidth;

	ctx = canvas.getContext("2d");

	leap = new Leap.Controller();
	leap.on("frame", parseFrame);
	leap.connect();

	document.addEventListener("keydown", keyPress);

	gameState = GAME_STATES.SEARCH_PLAYERS;

	window.requestAnimationFrame(render);
}


/**********************************************************/
/*****************BOOT*************************************/
/**********************************************************/
window.onload = init;

