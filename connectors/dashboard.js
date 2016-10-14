'use strict'

var request = require('request')
var Config = require('../config')
const fetch = require('node-fetch');

// SETUP A REQUEST TO DASHBOARD
var newMessage = function(recipientId, message, context, key) {

  const body = JSON.stringify({
    recipientId,
    message, // es6 syntax, same as - message: message,
    context,
    key,
  });

  console.log('sending feedback to dashboard:', body)

  return fetch(Config.DASHBOARD_URL+ '/api/flights/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  })
  .then(rsp => rsp.json())
  .then(json => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    return json;
  });
}

module.exports = {
	newMessage: newMessage,
}
