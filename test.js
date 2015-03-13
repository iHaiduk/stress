var async = require("async");
var http = require("http");
var net = require("net");
var fs = require("fs");
var cluster = require('cluster');

var options = {
  host: '127.0.0.1',
  port: 80,
  path: '/',
  method: 'GET'
};


var rps = 400;
var numCPUs = 50;
var isFork = false; // do fork

var row=[];
for (var i = 0; i<rps; i++) {row.push(i);}
var n =0;
var resps = [];
var total=0;
var maxRPS = 0;

// HTTP wrapper

var executer_ = function (i, next) {
    var req = http.request(options, function (res) {
        var body = '';
        res.on("data", function (chunk) {
            body += chunk.toString();
        });

        res.on("end", function () {
            console.log("exec: ", i, Date.now() - ts); // Execution time of each request
            n++;
            total++;
            resps[n] = body;
            next();
        });

    });
    req.end();
}

// Socket connection

var executer = function (i, next) {
    var body = '';
    var ts = Date.now();
    var client = net.connect(80, "google.com", function () {
        client.write('GET / HTTP/1.1\r\n\r\n');
        client.end();
    });
    client.on('data', function(chunk) {
      body += chunk.toString();
      
    });
    client.on('end', function() {
        console.log("exec: ", i, Date.now() - ts); // Execution time of each request
        total++;
        n++;
        resps.push(body);
        next();
    });

}

if (isFork && cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        worker = cluster.fork();
    }
} else {

    var totalTs = Date.now();
    async.each(row, function (i, next) {

        executer(i, next);

    }, function () {
        console.log(resps.length, resps[resps.length-1]);
        console.log("Total", total, Date.now() - totalTs); // total done requests and eaten time
        fs.appendFileSync("/tmp/res.txt", maxRPS + "\n");

    });


    setInterval(function () { // RPS reports
        if (n>maxRPS) maxRPS=n;
        console.log("RPS:", n);
        n=0;

    }, 1000);

}


