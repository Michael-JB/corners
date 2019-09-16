const cpx = require('cpx');

cpx.copySync('./src/public/css/*', './dist/public/css/');
cpx.copySync('./src/public/*', './dist/public/');