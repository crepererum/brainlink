module.exports = function(grunt) {
	"use strict";

	// project config
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		csslint: {
			files: [
				"css/main.css"
			],
			options: {
				ids: false
			}
		},
		jshint: {
			files: [
				"Gruntfile.js",
				"js/main.js"
			],
			options: {
				browser: true,
				camelcase: true,
				curly: true,
				eqeqeq: true,
				forin: true,
				globals: {
					console: true,
					flock: true,
					Leap: true,
					meSpeak: true,
					module: true
				},
				immed: true,
				indent: 4,
				latedef: true,
				newcap: true,
				noarg: true,
				noempty: true,
				nonew: true,
				quotmark: "double",
				strict: true,
				trailing: true,
				undef: true,
				unused: true
			}
		}
	});

	// load other grunt modules
	grunt.loadNpmTasks("grunt-contrib-csslint");
	grunt.loadNpmTasks("grunt-contrib-jshint");

	// register TODOs
	grunt.registerTask("default", ["csslint", "jshint"]);
};

