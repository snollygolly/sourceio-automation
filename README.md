# sourceio-automation
A bot to automatically play s0urce.io for you

### Note: As of Beta 2.2, OCR is unreliable.  If you find a word I missed in the database, please issue a pull request or open an issue and I'll fix it.

## Configuration

The main file (`main.js`) contains several values you may want to change.

* `ocrApiKey` - The key for the ocr.space API (it's free)
* `db` - The path to the training JSON
* `message` - The message you send to people after you hack them
* `wordFreq` - How often to guess words.  If you guess too fast, you'll be booted from the game and your progress will no longer update.
* `mineFreq` - How often to purchase upgrades
* `minerLevel` - How high you get your miners to before moving to the next level up.
* `playerToAttack` - The index of the player you want to attack, 0 is the first in the list

## How To Use

> Note: It's recommended that you use Google Chrome

* Go to [http://s0urce.io/](s0urce.io) and start a game.
* Open the Console (Under View -> Developer -> JavaScript Console)
* Paste in the full contents of `main.js`
* Type `app.start()` to start the automated bot
* If you need to stop, you can type `app.stop()`
