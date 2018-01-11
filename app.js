var env = require('dotenv-extended');
env.config();
var builder = require('botbuilder');
var restify = require('restify');

// BLOATWARE

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

server.post('/api/messages', connector.listen());
//LUIS


var temp ;
var userStore = [];
var t = [];

var bot = new builder.UniversalBot(connector, [
    (session, args, next) => {
        console.log("Root");

  // session.userData={};
    // session.send("Reset");
     //ResetAllData
           // If first time user it asks for nickname otherwise alknowledges him/her
         if (typeof session.userData.ch == 'undefined') {           //change this to 'undefined' before publishing
               session.userData.ch = 1;
               builder.Prompts.text(session, "Looks like its your first time talking to me. Enter you nickname please ;) ");
           } else {
               session.send(`Hi ${session.userData.main.nick}`);
               next();
           }
       },
       (session, results, next) => {
                               session.send(`Your ID is ${session.message.address.user.id}.`);
           //If first time user, then it adds main and admin in its userData and calls admin to store this new user
           if (results.resumed == 0) {
               session.userData.main = {
                   name: session.message.address.user.name,
                   id: session.message.address.user.id,
                   botID: session.message.address.bot.id,
                   nick: session.message.text,
                   friends: {},
                   allTransactions: [],
                   request:[],
                   friendList:{}
               }
               session.userData.allmembers={'try':'try'};
               session.userData.admin = {
                   id: 'mid.$cAANymzWWjpZlYbJdLlfMGr4uvQay',
                   channelId: 'facebook',
                   user: {
                       id: '1644696952249900',
                       name: 'Yash Kothari'
                   },
                   conversation: {
                       isGroup: false,
                       id: '1644696952249900-888854587943715'
                   },
                   bot: {
                       id: '888854587943715',
                       name: 'HiPot'
                   },
                   serviceUrl: 'https://facebook.botframework.com'
               };
               bot.beginDialog(session.userData.admin, "*:/addMember", session.message.address);
           }
           
               session.userData.temp={ id: 'mid.$cAANym6HgnpFlYbBXHlfMGsTunrGu',
                               channelId: 'facebook',
                               user: { id: '', name: '' },
                               conversation: { isGroup: false, id: '' },
                               bot: { id: '888854587943715', name: 'HiPot' },
                               serviceUrl: 'https://facebook.botframework.com' };
   
   
           session.beginDialog('superRoot');
               
       }

       
           
    
])
.endConversationAction('endConversationAction', 'Ok, goodbye!', {
    matches: /^goodbye$/i
}
    )
;


var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

bot.dialog('superRoot',[
    (session, results, next) => {   
     //      console.log("session.userData.main.friendList", session.userData.main.friendList);
                   console.log("superRoot");

     //      console.log("session.userData.allmembers", session.userData.allmembers);
           builder.Prompts.choice(session, "What do you want to do ?", "add friend|lend|borrow|requestcheck|query");
   
       },
       (session, results, next) => {
           var res = results.response.entity;
           switch (res) {
               
                   case 'requestcheck':

                 session.beginDialog('rc');
                   break; 
                   case 'lend':
                   session.beginDialog('transaction','lend');
                   break;
              case 'borrow':
                   session.beginDialog('transaction','borrow');
                   break;
   
               case 'add friend':
                   session.beginDialog('addFriend');
                   break;
               
                   case 'query':
                   session.beginDialog('query');
                   break;
               default:
                   console.log("YOU ARE WRONG");
           }
       }
])
.cancelAction('cancelAction', 'Ok', {
    matches: /^nevermind$|^cancel$|^cancel.*order/i
}
    )
    .endConversationAction('endConversationAction', 'Ok, goodbye!', {
    matches: /^goodbye$/i
}
    )
    .reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$/i
}

    )
.triggerAction({
    matches: 'gotomain'
});
bot.dialog('query',[
    function(session){
                   builder.Prompts.choice(session, "What Query?", "FriendList|Last5Trans|TransWithFriend");
                
    },function(session,results){
        switch(results.response.entity){
                   case 'FriendList':
                   session.beginDialog('printFriends');
                   break;
                   case 'Last5Trans':
                   session.beginDialog('Last5Transaction');
                   break; 
                   case 'TransWithFriend':
                   session.beginDialog('printTransWithFriend');
                   break;
                   default:              session.send("Wrong input");
                   session.replaceDialog('superRoot', { reprompt: true });

                   
                }

              }
    
]);


bot.dialog('Last5Transaction',[
    function(session){
        console.log("Last5Transaction");
        var l = session.userData.main.allTransactions.length;
        var i;
        for(i=0;i<Math.min(l,5);i++)
        {
            var te=session.userData.main.allTransactions[i];
         session.send(`${te.b}ed ${te.c} ${te.a}`);
        }
                           session.replaceDialog('superRoot', { reprompt: true });
    }
])
.triggerAction({
    matches: 'alltransactions'
});


var i=0;
bot.dialog('rc', [
    function (session) {
        console.log("rc");
        if (session.userData.main.request[0] != null) {
            session.beginDialog('*:/printRequest', session.userData.main.request[0]);
            session.userData.main.request.shift();
        }
        else
         {  session.send(`No transaction approval requests for you `);
              session.replaceDialog('superRoot', { reprompt: true });}
    }, function (session) {
        if (session.userData.main.request[0] != null) {
            session.beginDialog('*:/printRequest', session.userData.main.request[0]);
            session.userData.main.request.shift();
        }
        else
            session.replaceDialog('superRoot', { reprompt: true });
    }, function (session) {
        if (session.userData.main.request[0] != null) {
            session.beginDialog('*:/printRequest', session.userData.main.request[0]);
            session.userData.main.request.shift();
        }
        else
            session.replaceDialog('superRoot', { reprompt: true });
    }, function (session) {
        if (session.userData.main.request[0] != null) {
            session.beginDialog('*:/printRequest', session.userData.main.request[0]);
            session.userData.main.request.shift();
        }
        else
            session.replaceDialog('superRoot', { reprompt: true });
    }, function (session) {
        if (session.userData.main.request[0] != null) {
            session.beginDialog('*:/printRequest', session.userData.main.request[0]);
            session.userData.main.request.shift();
            session.replaceDialog('superRoot', { reprompt: true });
        }
        else
            session.replaceDialog('superRoot', { reprompt: true });
    }

])
    .cancelAction('cancelAction', 'Ok', {
    matches: /^nevermind$|^cancel$|^cancel.*order/i
}
    )
    .endConversationAction('endConversationAction', 'Ok, goodbye!', {
    matches: /^goodbye$/i
}
    )
    .reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$/i
}

    )
 .triggerAction({
    matches: 'pendingrequest'
});
/*
when we chose lend option , we are switched to this botDialog "lend".In this first we add name of our friend if
he is in our database then bot asks for amount and then returns to the root dialog...
*/

bot.dialog('printTransWithFriend', [
    function (session,args) {
        Object.keys(session.userData.main.friendList).forEach(function (key) {
            session.send(`${session.userData.main.friendList[key].name} : ${key} ->${session.userData.main.friendList[key].balance}`);
        });
        builder.Prompts.text(session, "Which friend?");
    },
    function (session, results) {
        var l = session.userData.main.friends[results.response].transaction.length;
        var i = 0;
        for (i = 0; i < Math.min(l, 5); i++)
         {var te=session.userData.main.friends[results.response].transaction[i];
         session.send(`${te.b}ed ${te.a}`);
         }
         session.replaceDialog('superRoot', { reprompt: true });
    }
]);

bot.dialog('transaction', [
    function (session,args) {
        console.log("transaction");
        session.userData.type=args;
        builder.Prompts.text(session, 'To whom');//would be from whom in case of borrowing
    },
    (session, results) => {
        session.userData.whom = results.response;
        if (session.userData.main.friends[results.response] != null) {
            session.userData.temp.user.id = session.userData.main.friends[results.response].friendID;
            session.userData.temp.user.name = session.userData.main.friends[results.response].friendName;
            session.userData.temp.conversation.id = session.userData.temp.user.id + '-888854587943715';
            builder.Prompts.text(session, 'How much');
        } else {
            session.send(`friend not found`);
            session.beginDialog('transaction',session.userData.type);
        }
    },
    (session, results) => {
        var t = {
            a: results.response,
            b: session.userData.type,
            c: session.userData.whom
        };
        bot.beginDialog(session.userData.temp, "*:/addRequest", { a: session.message.address, b: t });

        session.replaceDialog('superRoot', { reprompt: true });
    }
])
    .cancelAction('cancelAction', 'Ok', {
    matches: /^nevermind$|^cancel$|^cancel.*order/i
}
    )
    .endConversationAction('endConversationAction', 'Ok, goodbye!', {
    matches: /^goodbye$/i
}
    )
    .reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$/i
}

    );

bot.dialog('/addRequest', [
    function (session, args) {
        console.log("addRequest");
        if( session.userData.main.friendList[args.a.user.id]!= null)
         {
             session.userData.main.request.push({ address: args.a, data: args.b });
                     bot.beginDialog(args.a, "*:/replyTransaction", 'true');
         }
         else
         {
                     bot.beginDialog(args.a, "*:/replyTransaction", 'false');
         }
        
        session.endDialog();
    }
]);


bot.dialog('printFriends', [
    function (session, args) {
        console.log("printFriend");

        Object.keys(session.userData.main.friendList).forEach(function (key) {

            session.send(`${session.userData.main.friendList[key].name} : ${key} ->${session.userData.main.friendList[key].balance}`);
        });
        session.replaceDialog('superRoot', { reprompt: true });

    }
])
 .triggerAction({
    matches: 'friendlist'
});

bot.dialog('/replyTransaction', [
    function (session, args) {
        console.log("replyTransaction");
        if (args == 'true')
            session.send("You will be notified once the transaction is approved.");
        else
            session.send("You are not added as his/her friend.Inform him/her to add you as a friend.");
        session.replaceDialog('superRoot');
    }
]); 
/*

1)results contain address user and {a:Real name , b:transactionType,c:nick name}
            stores results in rep 
            ask user whether to approve transaction or not
            if yes then adds to transaction in friends array and also in all transaction array
*/


bot.dialog('/printRequest', [
    function (session, results) {
        session.userData.rep = results;
        console.log("printRequest");
        //     console.log(`${results.}`);
      //  console.log(results.address.user.name);   
      if(results.data.a != null)
      {  session.send(`${results.address.user.name}  ${results.data.b} ${results.data.a} `);
        builder.Prompts.choice(session, 'want to add ?', 'yes|no');
    }
     else
                    session.replaceDialog('superRoot');
            
    },
    function (session, results, next) {
        session.userData.yt = results.response.entity;
        if (results.response.entity == 'yes') {

      //      console.log(session.userData.rep.data.b);

            var temp = {};

            Object.keys(session.userData.rep.data).forEach(function (key) {
                temp[key] = session.userData.rep.data[key];
            });

            
            if (session.userData.rep.data.b == 'lend')
                temp.b = 'borrow';
            else
                temp.b = 'lend';
            var p = temp.c;
        //    console.log(temp.b, session.userData.rep.data.b);
            var temp2 = {
                a: temp.a,
                b: temp.b,
                c: session.userData.main.friendList[session.userData.rep.address.user.id].name
            };
            session.userData.main.friends[session.userData.main.friendList[session.userData.rep.address.user.id].name].transaction.unshift(temp2);
            session.userData.main.allTransactions.unshift(temp2);
            if(temp.b=='lend')
                session.userData.main.friendList[session.userData.rep.address.user.id].balance +=parseInt(temp.a);
               else
                session.userData.main.friendList[session.userData.rep.address.user.id].balance -=parseInt(temp.a);
        }
 bot.beginDialog(session.userData.rep.address, "*:/requestReply", { a: session.userData.yt , b: session.userData.rep.data, c: session.message.address.user });
            session.endDialog();

    }

])
 .triggerAction({
    matches: 'pendingrequest'
});

// If transaction has been approved then add transaction to friends trans array and alltrans array
bot.dialog('/requestReply', [
    function (session, args) {
        console.log("requestReply");
        if (args.a == 'yes') {
          //  console.log ("Friends",session.userData.main.friends);
         //   console.log("c.id",args.c.id);
            session.userData.main.friends[args.b.c].transaction.unshift(args.b);
            session.userData.main.allTransactions.unshift(args.b);
            if(args.b.b=='lend')                  
                session.userData.main.friendList[args.c.id].balance +=parseInt(args.b.a);
               else
                session.userData.main.friendList[args.c.id].balance -=parseInt(args.b.a);
            session.send(`Your transaction of ${args.b.b}ing ${args.b.a} with  ${args.b.c} (${args.c.name}) has been approved by the user.`)
        }
        else
            session.send(`Your transaction of ${args.b.b}ing ${args.b.a} with  ${args.b.c} (${args.c.name}) has been declined by the user.`)
        session.replaceDialog('superRoot');
    }
]);


/*

-this bot adds member using bot service ,only if the opposite user whom we want to add is using the service
  ina allmember object.'
 */
 
bot.dialog('/addMember', [
    function (session, args, next) {
        console.log("addMember");
        session.userData.allmembers[args.user.id] = args.user.name;
        session.endDialog();
    }
]);

/*  
First prompt asks for nickname.
The result of this prompt is being stored nm property of user. 
then we ask for ID by a prompt.
This ID is stored in nmid propperty of user.
Then we are starting checkifexist dialog in admin and and pass (session.message.address and nmid ) as arguments
then dialog is returned to root.
*/

bot.dialog('addFriend', [
    function (session, args, next) {
        console.log("addFriend");

        builder.Prompts.text(session, 'Enter nickname');
    },
    function (session, results, next) {
        session.userData.nm = results.response;
        builder.Prompts.text(session, 'Enter id');
    },
    function (session, results) {
        session.userData.nmid = results.response;
        bot.beginDialog(session.userData.admin, "*:/checkifexist", {
            a: session.message.address,
            b: session.userData.nmid
        });
        
        session.replaceDialog('superRoot', { reprompt: true });

    }

])
    .cancelAction('cancelAction', 'Ok', {
    matches: /^nevermind$|^cancel$|^cancel.*order/i
}
    )
    .endConversationAction('endConversationAction', 'Ok, goodbye!', {
    matches: /^goodbye$/i
}
    )
    .reloadAction('startOver', 'Ok, starting over.', {
    matches: /^start over$/i
}
    );

/*
 Send reply to user weather the person he is trying to is present or not
*/

bot.dialog('/checkifexist',
    function (session, args, next) {
        console.log("checkifexist");
        bot.beginDialog(args.a, "*:/sendResponse", session.userData.allmembers[args.b]);
        session.endDialog();
    }
    );

/*

If the user exists on platform then it adds him to his main.friends else send a message asking that his friend register.
*/

bot.dialog('/sendResponse',
    function (session, args, next) {
        console.log("sendResponse");
        if (!(args == null)) {
            session.userData.main.friends[session.userData.nm] = {};
            session.userData.main.friends[session.userData.nm].friendName = args;
            session.userData.main.friends[session.userData.nm].friendID = session.userData.nmid;
            session.userData.main.friends[session.userData.nm].transaction = [];            

            
            session.send(`${args} added as ${session.userData.nm}`);
            session.userData.main.friendList[session.userData.nmid] = {name:session.userData.nm,balance:0};
        } else {
            session.send("Person you are trying to add isn't registered. How to register ? Just tell him/her to message me once :) ");
        }
        session.endDialog();
    }
    );
    
  bot.dialog('/help',
      function (session) {
            session.send("Cancel Query : cancels your current dialog and goes back to the parent dialog in stack :)");
            session.send("Goodbye Query : simply ends our conversation with our bot :)");
            session.send("start over Query : starts your dialog again :)");
                  session.endDialog();
      }

)
.triggerAction({
    matches: 'help'
});

bot.dialog('/userid',
    function(session){
        session.send(`Your ID is ${session.message.address.user.id}.`);
        session.endDialog();
        }
        
    )
.triggerAction({
    matches: 'userid'
});
    
