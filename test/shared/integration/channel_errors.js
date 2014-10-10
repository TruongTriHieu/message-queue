'use strict';

var helpers   = require('../../helpers');
var adapters  = helpers.adapters;

var validateMeow = helpers.readFixture('topics/meow.js');

adapters.forEach(function(adapterName) {
  var test = helpers.testFor(adapterName,
    ['shared', 'integration', 'channel_errors']);

  var adapter = require('../../../lib')(adapterName);
  var pub;
  var sub;
  var channel;

  test('set pub', function(assert) {
    pub = new adapter.Publish();
    pub.on('error', assert.fail);
    pub.on('ready', function() {
      assert.pass('pub is ready!');
      assert.end();
    });
  });

  test('set sub', function(assert) {
    sub = new adapter.Subscribe({channel: 'cats'});
    sub.on('error', assert.fail);
    sub.on('ready', function() {
      assert.pass('sub is ready!');
      assert.end();
    });
  });

  test('should emit "channel.error" when exist problems in the conn',
  function(assert) {
    var messages = [
      {meow: 'ok'},
      {woof: 'not'},
      {meow: 'yeah', but: 'no'}
    ];

    var msg;

    pub.on('close', function() {
      assert.pass('Publish closed "publish event"');
    });

    channel = pub.channel('cats', {
      schema: validateMeow
    });

    channel.on('error', function(err) {
      assert.equal(err.message,
        'Connection closed',
        '"channel event" err.message');
      assert.equal(err.type,
        'adapter',
        '"channel event" err.type');
      assert.equal(err.data,
        msg,
        '"channel event" err.data');
    });

    function handler() {
      if (!messages.length) {
        assert.end();
        return;
      }

      setTimeout(function() {
        msg = messages.pop();
        var res = channel.publish(msg);
        assert.equal(msg, msg, '"channel" message');
        assert.equal(res, 
          pub.closed ? false : true, 
          '"channel" publish result');

        if (!pub.closed) { 
          //
          // send one message and closes the publisher
          //
          pub.close();
        }
        handler();
      }, 1);
    }

    handler();

    sub.on('message', function(msg) {
      assert.ok(msg.meow);
      assert.equal(msg.but, undefined);
      assert.deepEqual(Object.keys(msg), ['meow'], 'was filtered');
    });
  });

  test('set pub one more time', function(assert) {
    pub = new adapter.Publish();
    pub.on('error', assert.fail);
    pub.on('ready', function() {
      assert.pass('pub is ready!');
      assert.end();
    });
  });

  test('should emit "channel.error" when exist problems in the validation',
  function(assert) {
    var msg = {woof: 'not'};

    pub.on('close', function() {
      assert.pass('Publish closed "publish event"');
      assert.end();
    });

    channel = pub.channel('cats', {
      schema: validateMeow
    });

    channel.on('error', function(err) {
      assert.equal(err.message,
        'ValidationError: meow is required',
        '"channel event" err.message');
      assert.equal(err.type,
        'validation',
        '"channel event" err.type');
      assert.equal(err.data,
        msg,
        '"channel event" err.data');
      pub.close();
    });

    var res = channel.publish(msg);
    assert.equal(res, false);
  });
});
