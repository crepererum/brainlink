# BrainLink [![Build Status](https://travis-ci.org/crepererum/brainlink.png)](https://travis-ci.org/crepererum/brainlink)

This is just a small [LEAP](https://www.leapmotion.com/) driven drinking game. To play it, visit [crepererum.github.io/brainlink](http://crepererum.github.io/brainlink).

Development
-----------
Make sure you have [Node.js](http://nodejs.org/) (version>=0.10.0), [npm](https://npmjs.org/) and [grunt](http://gruntjs.com/) (version>=0.4.1, you also need grunt-cli) installed. Before you can start developing/testing the application, you have to install all dependencies:

    cd path/to/brainlink/repo
    npm install

Now you can modify the app. To ensure that your code match the style guidelines and does not contain obvious mistakes, run the buildin test suite:

    grunt test

I will only accept pull request that are checked by this method. To build the app (includes optimization), run the build command:

    grunt build

The build folder now contains the application. I recommend to use a local web server. You can [http-server](https://github.com/nodeapps/http-server) for that task.

3rd party libs
--------------
BrainLink uses some great libraries to provide you the best drinking game experience ever:

  - [Flocking](http://flockingjs.org/)
  - [LeapJS](https://github.com/leapmotion/leapjs)
  - [meSpeak.js](http://www.masswerk.at/mespeak/)

