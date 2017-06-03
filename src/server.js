"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const app = express();
app.set("port", process.env.PORT || 3000);
app.get("/", (req, res) => {
    res.send("Hello world!");
});
http.createServer(app).listen(app.get("port"), () => {
    console.log("Express server listening on port " + app.get("port"));
});
//# sourceMappingURL=server.js.map