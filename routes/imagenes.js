var express = require('express');

var app = express();

const path = require('path');
var fs = require('fs'); // file system

app.get('/:tipo/:img', (req, res, next) => {

    var tipo = req.params.tipo;
    var img = req.params.img;

    var pathImagen = path.resolve(__dirname, `../uploads/${ tipo }/${ img }`)

    if (fs.existsSync(pathImagen)) {
        res.sendfile(pathImagen);
    } else {
        var pathNoImage = path.resolve(__dirname, `../assets/no-img.jpg`);
        res.sendfile(pathNoImage);
    }

});

module.exports = app;