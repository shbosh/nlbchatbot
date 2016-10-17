'use strict'

var Config = require('./config')
var FB = require('./connectors/facebook')
var wit = require('./services/wit').getWit()

// LETS SAVE USER SESSIONS
var sessions = {}

var findOrCreateSession = function (fbid, passengerData) {

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
  if (!sessionId && passengerData) {
    sessionId = new Date().toISOString()
    sessions[sessionId] = {
      fbid: fbid,
      flightId: passengerData.flightDate + passengerData.flightNum,
      context: {
        _fbid_: fbid,
        passengerData
      }
    }
    console.log('user does not exists, created session for ', fbid)
  }

  if (passengerData) {
    sessionId = new Date().toISOString()
    sessions[sessionId] = {
      fbid: fbid,
      flightId: passengerData.flightDate + passengerData.flightNum,
      context: {
        _fbid_: fbid,
        passengerData
      }
    }
    console.log('user already exists, created new session for ', fbid)
  }
  return sessionId
}

var read = function (sender, message, passengerData, announceMsg) {

  if(sender === Config.FB_PAGE_ID)
    return

  // if(announceMsg) {
  //   // Send message to all users with same flight id
  //   Object.keys(sessions).forEach(k => {
  //     const sessionObj = sessions[k];
  //     // if (sessionObj.flightId === announceMsg.flightId) {
  //     //   FB.newMessage(sessionObj.fbid, announceMsg.msg)
  //     // }
  //     if (announceMsg.posttype == "flightdelay") {
  //       FB.newMessage(sessionObj.fbid, "Dear passenger, your flight has been delayed to " + announceMsg.val + ". We are sorry for any inconvenience caused.");
  //     } else if (announceMsg.posttype == "startflight") {
  //       FB.newMessage(sessionObj.fbid, "Welcome "+ sessionObj.context.passengerData.fullName+" to Singapore Airlines. Anytime you need assistance from our flight attendants, please type 'Request: <Your Request>'");;
  //     } else if (announceMsg.posttype == "endflight") {
  //       const quickreplies =[
  //         {"content_type":"text","title":"Leave feedback.","payload":"I would like to leave some feedback."},
  //         {"content_type":"text","title":"No thanks.","payload":"No thanks, goodbye!"}
  //       ]
  //       FB.newMessage(sessionObj.fbid, "We have reached your destination. Have a great trip! We would appreciate it a lot if you can leave us some feedback.", null, quickreplies);
  //     }
  //   })
  // }

  // else if (message === 'hello') {
  //
  //   const reply = 'Hi there, how may I help you today?'
  //   FB.newMessage(sender, reply)
  //   .then(() => null).catch(err => console.error( 'Error messaging', sender, ':', err.stack || err ))
  //
  // }
  // else {
  //
  // 	// Let's find or create a session for the user
    var sessionId = findOrCreateSession(sender, passengerData)
    // if(!sessionId){
    //   const reply = 'Hi there, how may I help you today?'
    //   FB.newMessage(sender, reply)
    //   .then(() => null).catch(err => console.error( 'Error messaging', sender, ':', err.stack || err ))
    //   return;
    // }

  		// Wit.ai bot engine reads - then runs all actions incl send (as in wit.ai story) until no more
      // See ./services/wit.js, params in runActions below are available in methods

  		wit.runActions(
  			sessionId,                   // :sessionId:, the user's current session by id
  			message,                     // :text:, the user's message
  			// sessions[sessionId].context  // :context:, the user's session state
  		)
      // End story for now - don't update context with callbacks
      // .then(context => {
  				// Wit.ai ran all the actions in cycle, now it needs more messages
  				// console.log('Waiting for further messages')

  				// Based on the session state, you might want to reset the session
    				// Example:
    				// if (context['done']) {
    				// 	delete sessions[sessionId]
    				// }

  				// Updating the user's current session state
  				// sessions[sessionId].context = context

      // }).catch((err) => {
      //   console.error('Oops! Got an error from Wit: ', err.stack || err);
      // })
  // }
}



module.exports = {
	findOrCreateSession: findOrCreateSession,
	read: read,
}
