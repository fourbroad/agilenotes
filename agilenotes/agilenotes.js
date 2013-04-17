/**
 * Module dependencies.
 */

var express = require('express'), 
    http = require('http'),
    RedisStore = require('connect-redis')(express),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Model = require("./lib/model"),
    MSG = require("./config/global_message").GLOBAL_MSG;

var agilenotes = express();

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function(user, done) {
	done(null, user.username);
});

passport.deserializeUser(function(username, done) {
	var providers =agilenotes.get("providers"); 
	var provider = providers.getProvider(Model.ADMIN_DB);
	provider.findOne({username:username, type:Model.USER},null,null,function(error,user){
		done(error, user);
	});
});

//Use the LocalStrategy within Passport.
//Strategies in passport require a `verify` function, which accept
//credentials (in this case, a username and password), and invoke a callback
//with a user object. In the real world, this would query a database;
//however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
    function(username, password, done) {
    	// asynchronous verification, for effect...
    	process.nextTick(function () {
    		// Find the user by username. If there is no user with the given
    		// username, or the password is not correct, set the user to `false` to
    		// indicate failure and set a flash message. Otherwise, return the
    		// authenticated `user`.
    		var providers =agilenotes.get("providers"); 
    		var provider = providers.getProvider(Model.ADMIN_DB);
    		provider.findOne({username:username, type:Model.USER}, null, null, function(error,user){
    			if (error) { return done(error); }
    			if (!user | user == null) { return done(null, false, 'Unknown user ' + username ); }
    			if (user.password != password) { return done(null, false,  'Invalid password'); }
    			return done(null, user);
    		});
    	});
    }
));

agilenotes.configure(function() {
	agilenotes.set('port', process.env.PORT || 8080);
	// agilenotes.set('views', __dirname + '/views');
	// agilenotes.set('view engine', 'jade');
	agilenotes.use(express.favicon());
	agilenotes.use(express.logger('dev'));
	agilenotes.use(express.bodyParser());
	agilenotes.use(express.methodOverride());
	agilenotes.use(express.cookieParser());
	agilenotes.use(express.session({secret:'123456',store: new RedisStore}));
	agilenotes.use(passport.initialize());
	agilenotes.use(passport.session());
	agilenotes.use(agilenotes.router);
	agilenotes.use(express.static(__dirname + '/public'));
	
	agilenotes.set('passport', passport);
	
	// Authorization mode: include,inherit,current.
	agilenotes.set('ou_authz', "include"); 
	agilenotes.set('group_authz', "inherit");
	agilenotes.set('role_authz', "inherit");
});
agilenotes.configure('development', function() { 
	agilenotes.use(express.logger()); 
	// this is the error handler, uncomment #1 to see it in action 
	agilenotes.use(express.errorHandler({ 
		dumpExceptions: true, 
		showStack : true 
	})); 
}); 

agilenotes.configure('production', function() { 
	// this is the error handler for the production env 
	agilenotes.use(express.errorHandler({ 
		dumpExceptions: false, 
		showStack: false  
	})); 
}); 

require('./routes')(agilenotes);

http.createServer(agilenotes).listen(agilenotes.get('port'), function() {
	console.log("Express server listening on port " + agilenotes.get('port'));
});
