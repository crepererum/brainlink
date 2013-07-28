var canvas, ctx;

var leap;
var leapPlayerMap = new Object();

var players = [];

function Finger() {
	"use strict";
	var self = this;

	self.id = 0;
	self.x = 0;
	self.y = 0;
}

function Player() {
	"use strict";
	var self = this;

	self.id = 0;
	self.x = 0;
	self.y = 0;
	self.fingers = [];
}

function say(msg, callback) {
	"use strict";

	console.log(msg);

	if (callback) {
		callback();
	}
}

function render() {
	"use strict";
	var i, j, finger, player;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	for (i = 0; i < players.length; ++i) {
		player = players[i];

		ctx.fillStyle = "#ffffff";

		ctx.font = "30px Arial";
		ctx.fillText(player.id, player.x, player.y);

		for (j = 0; j < player.fingers.length; ++j) {
			finger = player.fingers[j];

			ctx.font = "15px Arial";
			ctx.fillText(finger.id, finger.x, finger.y);
		}
	}

	window.requestAnimationFrame(render);
}

function parseFrame(frame) {
	"use strict";
	var i, hand, nextLeapPlayerMap, nextPlayers, player;

	nextPlayers = [];
	nextLeapPlayerMap = new Object();

	for (i = 0; i < frame.hands.length; ++i) {
		hand = frame.hands[i];

		if ((hand.fingers.length == 5) && (!leapPlayerMap[hand.id])) {
			say("player detected");

			player = new Player();
			player.x = hand.palmPosition[0];
			player.y = hand.palmPosition[2];

			nextPlayers.push(player);
			nextLeapPlayerMap[hand.id] = player;
		} else if (leapPlayerMap[hand.id]) {
			player = leapPlayerMap[hand.id];

			nextPlayers.push(player);
			nextLeapPlayerMap[hand.id] = player;
		}
	}

	players = nextPlayers;
	leapPlayerMap = nextLeapPlayerMap;
}

function init() {
	"use strict";

	canvas = document.getElementById("canvas");
	canvas.height = canvas.clientHeight;
	canvas.width = canvas.clientWidth;

	ctx = canvas.getContext("2d");

	leap = new Leap.Controller();
	leap.on("frame", parseFrame);
	leap.connect();

	window.requestAnimationFrame(render);
}

window.onload = init;

