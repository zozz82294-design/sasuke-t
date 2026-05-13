const http = require("http");
const fs = require("fs");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  fs.readFile("index.html", (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Error loading file");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log("Server running on port " + port);
});
