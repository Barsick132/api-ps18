const express = require('express')
const app = express()
const fs = require('fs')

const PORT = process.env.PORT || 3000
const path = './public/';
app.use(express.static(__dirname + "/public"));
app.get('/', (request, response) => {
    let page = 'login.html'
    fs.readFile(path + page, function (error, data) {
        if (error) {
            response.statusCode = 404;
            response.end("Resourse not found!")
        }
        else {
            response.end(data);
        }
    })
})

app.listen(PORT, () => {
    console.log(`Server has been started on the ${PORT} port...`);
})

/*const http = require('http')
const server = http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end('Hello World\n')
})
const PORT = process.env.PORT || 80
server.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})*/

/*const http = require("http");
const urler  = require('url');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const path = './pages/';
let page = '';

http.createServer(function (request, response) {
    let url = urler.parse(request.url).pathname.substr(1); // ДОДЕЛАТЬ ОБРАБОТКУ .HTML
    console.log(url);
    if (url === '' || url == '') {
        page = "login.html";
    }
    else{
        fs.readdirSync(path).forEach(file => {
            if (url == file.split('.').shift() & file.indexOf('.')!=-1) { // !!!file.split('.').shift() 
                page = file;
            };
        });
    }
    
    if(page === '' || page === '404.html'){
        page = "404.html";
        response.statusCode = 404;
    }
    
    fs.readFile(path + page, function (error, data) {
        if (error) {
            response.statusCode = 404;
            response.end("Resourse not found!");
        }
        else {
            response.end(data);
        }
    });
}).listen(PORT);*/