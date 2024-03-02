const fileUpload = require('express-fileupload');

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


app.use(fileUpload());

app.post('/upload', function(req, res) {
    let sampleFile;
    let uploadPath;

    console.log('Llegando al fichero')
  
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No se han subido archivos.');
    }
  
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    sampleFile = req.files.fichero;
    uploadPath = __dirname + '/public/archivos-comp/' + sampleFile.name;
  
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function(err) {
      if (err)
        return res.status(500).send(err);
  
      res.send('Archivo Subido!');
    });
  });



module.exports = app;
