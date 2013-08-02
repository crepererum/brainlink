module.exports = function(grunt) {
	"use strict";

	// project config
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		clean: [
			"release"
		],
		copy: [
			{
				expand: true,
				cwd: "src/",
				src: "*",
				dest: "release/",
				filter: "isFile"
			},
			{
				expand: true,
				cwd: "extern/",
				src: "**",
				dest: "release"
			}
		],
		csslint: {
			files: [
				"src/css/main.css"
			],
			options: {
				ids: false
			}
		},
		cssmin: {
			minify: {
				src: "src/css/*.css",
				dest: "release/css/main.css"
			}
		},
		jshint: {
			files: [
				"Gruntfile.js",
				"src/js/main.js"
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
		},
		uglify: {
			build: {
				options: {
					sourceMap: "release/js/main.sourcemap.js",
					sourceMappingURL: "js/main.sourcemap.js"
				},
				files: {
					"release/js/main.js": ["src/js/*.js"]
				}
			}
		}
	});

	// load other grunt modules
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-csslint");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");

	// register TODOs
	grunt.registerTask("build", ["clean", "copy", "cssmin", "uglify"]);
	grunt.registerTask("test", ["csslint", "jshint"]);
	grunt.registerTask("default", ["test", "build"]);
};

