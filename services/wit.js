'use strict'

var Config = require('../config')
var FB = require('../connectors/facebook')
var Dashboard = require('../connectors/dashboard')
var request = require('request')
const {Wit, log} = require('node-wit') // Es6, 'const' is a var that cannot be reassigned, 'let' can be.

var firstEntityValue = function (entities, entity) {
	var val = entities && entities[entity] &&
		Array.isArray(entities[entity]) &&
		entities[entity].length > 0 &&
		entities[entity][0].value

	if (!val) {
		return null
	}
	return typeof val === 'object' ? val.value : val
}

var errorHandler = err => console.error( 'Error messaging', recipientId, ':', err.stack || err );
var actions = {

  // Compulsory method - https://github.com/wit-ai/node-wit#wit-class
  // :param request: contains sessionId, context, text, entities properties
  // :param response: contains text, quickreplies properties
	send ({sessionId, context, text}, {text: resText, quickreplies} ) { // Destructure sessionId from request object, ie var sessionId = request.sessionId;
    console.log('WIT WANTS TO TALK TO:', context._fbid_)
    console.log('WIT HAS SOMETHING TO SAY:', resText)
    console.log('WIT HAS A CONTEXT:', context)

    // Our bot has a reply! Let's retrieve the Facebook user whose session belongs to
    const recipientId = context._fbid_;

    if (recipientId) {
      // We return a js promise to let our bot know when we're done sending

      if (checkURL(resText)) {  // check if resText contains image url

        return FB.newMessage(recipientId, resText, true)
        .then(() => null).catch(errorHandler)

      } else {
        // const sentiment = Math.floor(Math.random()) == 1 ? 'positive' : 'negative';
        const {faq, rawrequest, feedback, rating, borrowrequest} = context;
        const key = faq ? 'faq' : borrowrequest ? 'borrowrequest' : rawrequest ? 'rawrequest' : feedback ? 'feedback' : rating ? 'rating' : null;
        console.log('key', key);

        // send template picture
        if(context.borrowrequest && context.reservebook) {

          const message = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements":[
                {
                  "title":"Information Systems Management in the Big Data Era",
                  "item_url":"https://petersfancybrownhats.com",
                  "image_url":"https://images.springer.com/sgw/books/medium/9783319135021.jpg",
                  "subtitle":"Big data in the modern world",
                  "buttons":[
                    {
											"type":"postback",
                      "payload": "DEVELOPER_DEFINED_PAYLOAD",
                      "title":"Reserve book"
                    },
                  ]
                },
                {
                  "title":"Modern Information Systems",
                  "item_url":"https://petersfancybrownhats.com",
                  "image_url":"http://cdn.intechopen.com/books/images/2330.jpg",
                  "subtitle":"Importance of Information Systems today",
                  "buttons":[
                    {
                      "type":"postback",
                      "payload": "DEVELOPER_DEFINED_PAYLOAD",
                      "title":"Reserve book"
                    },
                  ]
                },

                ]
              }
            }
          }
					delete context.rawrequest
					delete context.borrowrequest
					console.log('borrowrequest', context.borrowrequest)
          FB.newMessage(recipientId, null, null, null, message)
          .then(() => null).catch(errorHandler)
        }

        // if(quickreplies){
        //   var mapquickreplies = quickreplies.map(reply => {
        //     return {"content_type":"text", "title": reply, "payload": reply}
        //   });
        //   console.log(mapquickreplies)
        //   return FB.newMessage(recipientId, resText, null, mapquickreplies).then(() => null).catch(errorHandler)
        // }

        return FB.newMessage(recipientId, resText)
        .then(() => null).catch(errorHandler)
      }

    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      // Giving the wheel back to our bot
			delete context.borrowrequest
			delete context.rawrequest
      return Promise.resolve()
    }
  },



  // Merge action as found on wit.ai story, returns a js promise with new context
	merge({sessionId, context, entities, text}) {
    console.log(`Session ${sessionId} received`);
    console.log(`The current context is ${JSON.stringify(context)}`);
    console.log(`Wit extracted ${JSON.stringify(entities)}`);

		// Reset the weather story

		// Retrive the location entity and store it in the context field
		var loc = firstEntityValue(entities, 'location')
		if (loc) {
			context.loc = loc
		}

		// Reset the cutepics story
		delete context.pics


		// //Inflight Requests
		// var time = firstEntityValue(entities, 'intent')
		// if (time) {
		// 	context.time = time
		// }

		// Retrieve Requests
		var borrowrequest = firstEntityValue(entities, 'borrowrequest')
		if (borrowrequest) {
			context.rawrequest = borrowrequest
		}

		// Retrieve the category
		var category = firstEntityValue(entities, 'category')
		if (category) {
			context.cat = category
		}

		// Retrieve the sentiment
		var sentiment = firstEntityValue(entities, 'sentiment')
		if (sentiment) {
      context.feedback = text
			context.feedbackSentiment = sentiment
		}

    return Promise.resolve(context);
	},

	error({sessionId, context, error}) {
		console.log(error.message)
	},



	['push-request']({sessionId, context, text}) {
		context.borrowrequest = text;
		console.log(context);
    return Promise.resolve(context);
	},


}

// SETUP THE WIT.AI SERVICE
var getWit = function () {
	console.log('GRABBING WIT')
	return new Wit({
		accessToken: Config.WIT_TOKEN,
		actions,
		logger: new log.Logger(log.DEBUG)
	})
}

module.exports = {
	getWit: getWit,
}

// BOT TESTING MODE
if (require.main === module) {
	console.log('Bot testing mode!')
	var client = getWit()
	client.interactive()
}



// CHECK IF URL IS AN IMAGE FILE
var checkURL = function (url) {
    return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}
