'use strict';

var http = require('http');
var getPort = require('get-port');

var server = http.createServer(function (req, res) {
  var accept = req.headers.accept || '';
  var json = ~accept.indexOf('json');

  switch (req.url) {
    case '/':
      res.end('hello');
      break;
    case '/users':
      if (json) {
        res.end('["tobi","loki","jane"]');
      } else {
        res.end('tobi, loki, jane');
      }
      break;
  }
});

describe('http server', function () {
  var port;

  function get (url) {
    var fields;
    var expected;
    var header = {};

    function request (done) {
      http.get({
        path: url,
        port: port,
        headers: header
      }, function (res) {
        var buf = '';
        res.should.have.property('statusCode', 200);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          buf += chunk;
        });
        res.on('end', function () {
          buf.should.equal(expected);
          done();
        });
      });
    }

    return {
      set: function (field, val) {
        header[field] = val;
        return this;
      },

      should: {
        respond: function (body) {
          fields = Object.keys(header)
            .map(function (field) {
              return field + ': ' + header[field];
            })
            .join(', ');

          expected = body;
          describe('GET ' + url, function () {
            this.timeout(500);
            if (fields) {
              describe('when given ' + fields, function () {
                it('should respond with "' + body + '"', request);
              });
            } else {
              it('should respond with "' + body + '"', request);
            }
          });
        }
      }
    };
  }

  before(function (done) {
    getPort(function (err, portNo) {
      if (err) {
        return done(err);
      }
      port = portNo;
      server.listen(port, done);
    });
  });

  beforeEach(function () {
    this.timeout(2000);
  });

  after(function () {
    server.close();
  });

  get('/')
    .should
    .respond('hello');

  get('/users')
    .should
    .respond('tobi, loki, jane');

  get('/users')
    .set('Accept', 'application/json')
    .should
    .respond('["tobi","loki","jane"]');
});
