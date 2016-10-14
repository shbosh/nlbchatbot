'use strict'

var request = require('request')
var Config = require('../config')
const fetch = require('node-fetch');

// PARSE A FACEBOOK MESSAGE to get user, message body, or attachment
// https://developers.facebook.com/docs/messenger-platform/webhook-reference
var getMessageEntry = function (body) {
	var val = body.object === 'page' &&
						body.entry &&
						Array.isArray(body.entry) &&
						body.entry.length > 0 &&
						body.entry[0] &&
						body.entry[0].messaging &&
						Array.isArray(body.entry[0].messaging) &&
						body.entry[0].messaging.length > 0 &&
						body.entry[0].messaging[0]
	return val || null
}

// SETUP A REQUEST TO FACEBOOK SERVER
var newMessage = function(recipientId, msg, hasAtts, hasQuick, hasTemplate) {

  let message;
  if (hasAtts) {
    message = {
      attachment: {
        "type": "image",
        "payload": { "url": msg }
      }
    }
  } else if (hasQuick) {
    message = { text: msg, quick_replies: hasQuick }
  } else if (hasTemplate) {
    message = hasTemplate
  } else {
    message = { text: msg }
  }

  // https://developers.facebook.com/docs/messenger-platform/send-api-reference

  // FOR IMAGES
    // "message":{
    //    "attachment":{
    //      "type":"image",
    //      "payload":{
    //        "url":"https://petersapparel.com/img/shirt.png"
    //      }
    //    }
    //  }

  // FOR TEMPLATES
    // "message":{
    //   "attachment":{
    //     "type":"template",
    //     "payload":{
    //       "template_type":"button",
    //       "text":"What do you want to do next?",
    //       "buttons":[
    //         {
    //           "type":"web_url",
    //           "url":"https://petersapparel.parseapp.com",
    //           "title":"Show Website"
    //         },
    //         {
    //           "type":"postback",
    //           "title":"Start Chatting",
    //           "payload":"USER_DEFINED_PAYLOAD"
    //         }
    //       ]
    //     }
    //   }
    // }

  const body = JSON.stringify({
    recipient: { id: recipientId },
    message, // es6 syntax, same as - message: message,
  });

  const qs = 'access_token=' + encodeURIComponent(Config.FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
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
	getMessageEntry: getMessageEntry,
}
