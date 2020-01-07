// global
global.log = require('./utils/myLog.js');
global.lg = ((object)=>{
	log.log(object);
})

global.projectPath = __dirname;

// require
const express = require('express');
const expHbs = require('express-handlebars');
const expHbsSec = require('express-handlebars-sections');
const expSession = require('express-session');
const numeral = require('numeral');
const moment = require('moment');
const fileUpload = require('express-fileupload');


// load a locale
numeral.register('locale', 'vi', {
	delimiters: {
		thousands: ',',
		decimal: '.'
	},
	currency: {
		symbol: 'VNĐ'
	}
});
numeral.locale('vi');
moment.locale('vi');


// app
const app = express();

app.use(express.static('static'));

app.use(express.json());
app.use(express.urlencoded({
	extended: true
})
);


app.use(expSession(
{
	secret: 'keyboard cat', 
	cookie: { maxAge: 60000*60 },
	resave: false,
	saveUninitialized: true,
})
);

app.use(fileUpload({
	createParentPath: true
}));



app.engine('html', expHbs({
	defaultLayout: 'main.html',
	partialsDir: __dirname + '/views/partials/',
	helpers: {

		section: expHbsSec(),

		cashConvert: function (number){
			// return numeral(number).format('0,0 $');
			return numeral(number).format('0,0 $');
		},
		dmyConvert: function(datetime){

			return moment(datetime).format('D/M/Y');
		},
		datetimeConvert: function(datetime, format){
			// console.log(moment(datetime).format(format));
			return moment(datetime).format(format);
		},

		relativeDateTimeConvert: function(datetime){

			let a = moment();
			let b = moment(datetime);
			let diff = b.diff(a, 'seconds');
			// console.log(diff);

			if(diff > 0 && diff > 86400){
				// more than 1 day
				// console.log('case 1');
				return moment(datetime).format('D/M/Y, HH:mm');
			}
			else if(diff < 0 || (diff > 0 && diff <= 86400 && diff > 180)){
				// less than 1 day
				return b.from(a);
			}

		},

		remainSeconds: function(datetime){
			let a = moment();
			let b = moment(datetime);
			let diff = b.diff(a, 'seconds');
			// console.log(diff);

			return diff;
		},

		ratePointConvert: function(rawPoint){

			if(!rawPoint){
				return '0';
			}

			if(rawPoint > 0){
				return '+' + rawPoint;
			}
			else{
				return '' + rawPoint;
			}
		},

		shortenName: function(longName){
			if(!longName){
				return '';
			}

			if(longName.length >= 40){
				longName = longName.substring(0, 35).concat('...');
			}

			return longName;
		},

		maskenName: function(longName){
			if(!longName){
				return '';
			}

			let tokens = longName.split(' ');
			if(tokens != null && tokens.length > 1){
				longName = tokens[tokens.length - 1];
			}
			if(longName.length > 7){
				longName = longName.substring(longName.length - 7);
			}

			longName = '***' + longName;
			return longName;
		},

		ifeq: function(a, b, options){

			if (a === b) {
				return options.fn(this);
			}
			return options.inverse(this);
		},

		accTypeConvert: function(typeNum){
			let typeName = 'unknown';

			if(typeNum === 1){
				typeName = 'Bidder';
			}
			else if(typeNum === 2){
				typeName = 'Seller';
			}
			else if(typeNum === 3){
				typeName = 'Admin';
			}

			return typeName;
		},

		percentConvert: function(part, total){
			return '' + Math.round(part/total*100) + '%';
		}


	},
	
})
);
app.set('view engine', 'html');



// client get, post
app.get('/', function(req, res){

	res.redirect('/home');
})


// app middleware
app.use(async function(req, res, next){

	// pass authen info
	if(req.session.isAuthen === true){
		res.locals.userId = req.session.account.Id,
		res.locals.userName = req.session.account.Name,
		res.locals.userType = req.session.account.AccType,
		res.locals.isAuthen = true;
	}

	// pass catagory list
	const cataList = await require('./models/cataModel').all();
	res.locals.cataList = cataList;

	next();
})

// home
const homeRouter = require('./routes/homeRouter');
app.use('/home', homeRouter);

// authentication
const authenRouter = require('./routes/authenRouter');
app.use('/authen', authenRouter);

// product
const proRouter = require('./routes/proRouter');
app.use('/product', proRouter);

// // catagory
// const cataRouter = require('./routes/cataRouter');
// app.use('/cata', cataRouter);

// account
const accRouter = require('./routes/accRouter');
app.use('/acc', accRouter);


app.use(function(req,res){
	res.render('error/error.html',{
		isLayoutSimple: true,
		title: '404 Not Found',
		description: 'Sorry, an error has occured, Requested page not found!',
	});
	// res.status(404).render('404.jade');
});


// listen
const port = 3000;
app.listen(port, function(){
	log.log(`Server is running on: localhost:${port}`);
})



