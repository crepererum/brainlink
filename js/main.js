var canvas, ctx;

function init() {
	"use strict";

	canvas = document.getElementById("canvas");
	canvas.height = canvas.clientHeight;
	canvas.width = canvas.clientWidth;

	ctx = canvas.getContext("2d");
}

window.onload = init;

