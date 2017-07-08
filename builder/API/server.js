"use strict";

const config = {
    name: "Source.io API",
    port: 3000
}

const ns = require("node-static");

var fileServer = new ns.Server("../output");

require("http").createServer((req, res) => {
    req.addListener("end", () => {
        fileServer.serveFile("/listing.json", 200, {}, req, res);
    }).resume()
}).listen(config.port);

console.log(`${config.name} is up and running on ${config.port}`)