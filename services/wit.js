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
        const {faq, rawrequest, feedback, rating} = context;
        console.log('faq', faq)
        console.log('rawrequest', rawrequest)
        console.log('feedback', feedback)
        console.log('rating', rating)
        const key = faq ? 'faq' : rawrequest ? 'rawrequest' : feedback ? 'feedback' : rating ? 'rating' : null;
        console.log('key', key);
        if(key)
          Dashboard.newMessage(recipientId, resText, context, key);

        // send template picture
        if(context.request) {

          const message = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"generic",
                "elements":[
                {
                  "title":"Welcome to Peter\'s Hats",
                  "item_url":"https://petersfancybrownhats.com",
                  "image_url":"http://www.thinkgeek.com/images/products/zoom/11af_4th_doctors_hat.jpg",
                  "subtitle":"We\'ve got the right hat for everyone.",
                  "buttons":[
                    {
                      "type":"web_url",
                      "url":"https://petersfancybrownhats.com",
                      "title":"View Website"
                    },
                  ]
                },
                {
                  "title":"Welcome to Peter\'s Hats",
                  "item_url":"https://petersfancybrownhats.com",
                  "image_url":"http://www.projectmanagement.com/design/hat.jpg",
                  "subtitle":"We\'ve got the right shirts for everyone.",
                  "buttons":[
                    {
                      "type":"web_url",
                      "url":"https://petersfancybrownhats.com",
                      "title":"View Website"
                    },
                  ]
                },

                ]
              }
            }
          }
          FB.newMessage(recipientId, null, null, null, message)
          .then(() => null).catch(errorHandler)
        }

        // send restricted items picture
        if(resText.substring(0,33) === "Please check the prohibited items") {
          const restrictedPic = "https://www.singaporeair.com/en_UK/us/travel-info/baggage/baggage-restrictions/saar5/images/travel-info/baggages/prohibited-items.jpg";
          FB.newMessage(recipientId, restrictedPic, true)
          .then(() => null).catch(errorHandler)
        }

        if(quickreplies){
          var mapquickreplies = quickreplies.map(reply => {
            return {"content_type":"text", "title": reply, "payload": reply}
          });
          console.log(mapquickreplies)
          return FB.newMessage(recipientId, resText, null, mapquickreplies).then(() => null).catch(errorHandler)
        }

        return FB.newMessage(recipientId, resText)
        .then(() => null).catch(errorHandler)
      }

    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      // Giving the wheel back to our bot
      return Promise.resolve()
    }
  },

  // Merge action as found on wit.ai story, returns a js promise with new context
	merge({sessionId, context, entities, text}) {
    console.log(`Session ${sessionId} received`);
    console.log(`The current context is ${JSON.stringify(context)}`);
    console.log(`Wit extracted ${JSON.stringify(entities)}`);

		// Reset the weather story
		delete context.forecast

		// Retrive the location entity and store it in the context field
		var loc = firstEntityValue(entities, 'location')
		if (loc) {
			context.loc = loc
		}

		// Reset the cutepics story
		delete context.pics

		//Retrieve time
		var time = firstEntityValue(entities, 'intent')
		if (time) {
			context.time = time
		}

		// //Inflight Requests
		// var time = firstEntityValue(entities, 'intent')
		// if (time) {
		// 	context.time = time
		// }

		// Retrieve Requests
		var request = firstEntityValue(entities, 'request')
		if (request) {
			context.rawrequest = request
		}

		// Retrieve the category
		var category = firstEntityValue(entities, 'category')
		if (category) {
			context.cat = category
		}

    // Retrieve the rating
    var rating = firstEntityValue(entities, 'rating')
    if (rating) {
      context.rating = parseInt(text)
    }

    // Check for faq
    var faq = firstEntityValue(entities, 'faq')
    if (faq) {
      context.faq = text
    }

    // Check for feedback
    var feedback = firstEntityValue(entities, 'feedback')
    if (feedback) {
      context.feedback = text
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

  verified({sessionId, context, text, entities}) {

    var ver = firstEntityValue(entities, 'VERIFIED')
    if (ver) {
      context.ver = ver
    }
    return Promise.resolve(context);

  },

	// list of functions Wit.ai can execute
	['fetch-weather']({sessionId, context}) {
		// Here we can place an API call to a weather service
    console.log('context ', context);
		if (context.loc) {
      return new Promise((resolve, reject) => {
  			getWeather(context.loc) // loc is the property given in the wit.ai story
        .then(function (forecast) {
          context.forecast = forecast || 'I\'m unsure of the weather'
          console.log('forecast ', forecast)
          resolve(context);
        })
        .catch(function (err) {
         // console.log(err)
         reject(err)
        })
      })
		}

	},

	['fetch-departureTime']({sessionId, context}) {
		var departTime = " 9.40 pm"
		context.timeToDeparture = departTime
    return Promise.resolve(context);

	},

	['fetch-luggagelimit']({sessionId, context}) {
		var lugg = "50kg"
    console.log(context)
    context.luggagelim = lugg
		context.passengerClass = context.passengerData.flightClass
    return Promise.resolve(context);

	},
	['push-request']({sessionId, context, text}) {
		context.request = text;
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

// GET WEATHER FROM API
var getWeather = function (location) {
	return new Promise(function (resolve, reject) {
		var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + location + '&appid=' + Config.OPEN_WEATHER_API_KEY + '&units=metric'
		request(url, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
		    	var jsonData = JSON.parse(body)
		    	var forecast = jsonData.weather ? (jsonData.weather[0].description + ', ' +jsonData.main.temp)  : null;
		      resolve(forecast);
		    }
			})
	})
}

// CHECK IF URL IS AN IMAGE FILE
var checkURL = function (url) {
    return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}
