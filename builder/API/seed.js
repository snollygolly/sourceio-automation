const co = require("co");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));
const exec = require("child_process").exec;

config = {
	name: "builder",
	path: "/etc/cron.d",
	timing: "1,16,31,46 * * * *",
	user: "ubuntu",
    command: "/usr/bin/node /home/ubuntu/sourceio-automation/builder/index.js \n"
}

co(function* co() {
    try {
        console.log("Checking for cron folder");
        const folder = yield fs.readdirAsync(config.path);
    } catch (err) {
        console.log("Folder not found!");
        return;
    }

    try {
        console.log("Folder found, checking for cron job");
        const job = yield fs.readFileAsync(`${config.path}/${config.name}`);
        console.log("Job previously created!");
        return;
    } catch (err) {
        // Continue
    }

    try {
        console.log("Creating cronjob");
        const result = yield fs.writeFileAsync(`${config.path}/${config.name}`, 
            `${config.timing} ${config.user} ${config.command}`);
            console.log("Completed! - Running Script for the first time!");
            exec("/usr/bin/node /home/sourceio-automation/builder/index.js");
            return;
    } catch(err) {
        console.log(`Cron job failed - ${err}`)
    }
}).catch((err) => {
	throw new Error (err.toString());
});
