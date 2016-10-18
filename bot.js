'use strict'

var Config = require('./config')
var FB = require('./connectors/facebook')
var wit = require('./services/wit').getWit()

// LETS SAVE USER SESSIONS
var sessions = {}

var findOrCreateSession = function (fbid) {

 var sessionId
  // console.log('sessions: ', sessions)
  // DOES USER SESSION ALREADY EXIST?
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // YUP ( have fbid => return sessionId which is date)
      sessionId = k
      console.log('user exists:', fbid)
    }
  })

  // Create user when no fbid in sessions and passengerData new qr code
  if (!sessionId) {
    sessionId = new Date().toISOString()
    sessions[sessionId] = {
      fbid: fbid,
      context: {
        _fbid_: fbid
      }
    }
    console.log('user does not exists, created session for ', fbid)
  }

  return sessionId
}

var read = function (sender, message, announceMsg) {

  if(sender === Config.FB_PAGE_ID)
    return

  if (message === 'hello') {

    const reply = 'Hi there, how may I help you today?'
    FB.newMessage(sender, reply)
    .then(() => null).catch(err => console.error( 'Error messaging', sender, ':', err.stack || err ))

  } else {

  	// Let's find or create a session for the user
    var sessionId = findOrCreateSession(sender)
    if(!sessionId){
      const reply = 'Hi there, how may I help you today?'
      FB.newMessage(sender, reply)
      .then(() => null).catch(err => console.error( 'Error messaging', sender, ':', err.stack || err ))
      return;
    }

  		// Wit.ai bot engine reads - then runs all actions incl send (as in wit.ai story) until no more
      // See ./services/wit.js, params in runActions below are available in methods

  		wit.runActions(
  			sessionId,                   // :sessionId:, the user's current session by id
  			message,                     // :text:, the user's message
  			sessions[sessionId].context  // :context:, the user's session state
  		)
      // End story for now - don't update context with callbacks
      .then(context => {
  				// Wit.ai ran all the actions in cycle, now it needs more messages
  				console.log('Waiting for further messages')

  				// Based on the session state, you might want to reset the session
    				// Example:
    				// if (context['done']) {
    				// 	delete sessions[sessionId]
    				// }

  				// Updating the user's current session state
  				sessions[sessionId].context = context

      }).catch((err) => {
        console.error('Oops! Got an error from Wit: ', err.stack || err);
      })
    }
 }



module.exports = {
	findOrCreateSession: findOrCreateSession,
	read: read,
}
