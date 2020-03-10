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