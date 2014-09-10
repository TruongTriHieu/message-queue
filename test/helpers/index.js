'use strict';

var fs = require('fs');
var path = require('path');

var helpers = exports;

helpers.timeout = 200;
helpers.adapters = process.env.ADAPTER ?
  [process.env.ADAPTER] :
  fs.readdirSync(path.join(__dirname, '..', '..', 'lib', 'adapters'));
