# sourceio-automation [![Build Status](https://travis-ci.org/snollygolly/sourceio-automation.svg?branch=master)](https://travis-ci.org/snollygolly/sourceio-automation)

A bot to automatically play s0urce.io for you

### Note: As of Beta 2.2, OCR is unreliable and disabled by default

## Configuration

The main file (`main.js`) contains several values you may want to change.  They are grouped together inside of a `config` object at the top of the code.  All of them are commented, so be sure to read the comments before changing any of the values.

## How To Use

> Note: It's recommended that you use Google Chrome

* Go to [http://s0urce.io/](s0urce.io) and start a game.
* Open the Console (Under View -> Developer -> JavaScript Console)
* Paste in the full contents of `main.js`
* Type `app.start()` to start the automated bot
* If you need to stop, you can type `app.stop()`

## Contributing

If you want to contribute, that would be awesome!  Please make sure if you're contributing, you're following the following guidelines:

* Don't submit PRs to change sample configuration options.  For instance, if you don't like the message I use by default, feel free to fork my repository and change it, but a PR with a changed message won't be merged.
* Make sure to lint your code before submitting a PR.  We use ESLint for our linting, so all you need to do is run `npm install` and then `npm run test`.  If you see any errors, fix them before submitting your PR.
