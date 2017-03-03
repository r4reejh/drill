var express = require('express');
var passport= require('passport')
var router = express.Router();

var User=require('../models/user');//NOT REQUIRED YET, MAYBE REQUIRED IN FUTURE
var D = require('../models/drill');//SCHEMA FOR TRANSACTION
var H = require('../models/hashcode');//SCHEMA FOR IP FILTERING

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.ejs');
});

router.get('/login', function(req, res, next) {
  res.render('login.ejs', { message: req.flash('loginMessage') });
});

router.get('/signup', function(req, res) {
  res.render('signup.ejs', { message: req.flash('loginMessage') });
});

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/profile',
  failureRedirect: '/signup',
  failureFlash: true,
}));

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true,
}));

/*router.get('/profile',isLoggedIn,function(req,res){
	D.find({'user':req.user.email},function(err,drills){
		res.render('profile.ejs',{user:req.user.userdetails,drill:drills});
	});
});*/

router.get('/profile',function(req,res){
	res.render('profile.ejs');
});

router.post('/create_drill',function(req,res){
	var x=req.body;
	console.log(x);
	var new_drill=new D();
	try{
	new_drill.drillname=x["name"];
	new_drill.user=req.user.email;
	new_drill.nodes.push({day:"Day 1",description:x["description"]});
	new_drill.save(function(err,obj){
			if(err)
			console.log(err);
			addHashes(x["hashes"],obj.id);
			var user=req.user;
			user.userdetails.drills.push(obj.id);
			user.save(function(err,data){
				//USER NEEDS TO BE LOGGED IN AGAIN, TO REFLECT DATABASE UPDATES
				req.login(user,function(err){
					console.log(req.user);
					//---------UNCOMMENT ONCE EJS AVAILABLE---------------------
					//res.render('drill.ejs',{drill:obj});
					res.send('success');
				});
			});
	});
	}
	catch(err){
		console.log(err);
	}
});


router.post('/add_node',function(req,res){
	var x=req.body;
	D.findOne({id:x.id},function(err,obj){
		obj.nodes.push({day:x.day,description:x.description});
		obj.save(function(err,doc){
		res.render('drill.ejs',{drill:doc});
	});
});
});

router.post('/edit_node',function(req,res){
	var x=req.body;
	var dayid=x.day;
		D.findOneAndUpdate({id:x.id,'nodes.$.day': dayid},{$set: {'nodes.$.description': x.description,'nodes.$.links':x.links}},{ new: true }, function(err,doc){
				console.log("node is updated");
				doc.save(function(err,obj2){
					res.render('drill.ejs',{drill:doc});
				});
		});
	});

router.post('/signup2',function(req,res){
var x=req.body;
User.findOneAndUpdate({email:x.email},{$set:{'userdetails.firstname':x.firstname,'userdetails.phno':x.phonenumber,'userdetails.github':x.github}},function(err,doc){
console.log("user details added");
doc.save(function(err,obj2){
					res.redirect('profile.ejs');
				});
});
});

router.post('/publish',function(req,res){
var x=req.body;
D.findOneAndUpdate({id:x.id},{$set:{published:"TRUE"}},{new:true},function(err,doc){
	console.log("drill published set to true");
	doc.save(function(err,obj2){
		res.render('drill.ejs',{drill:dox});

	});
	});
});

router.get('/drill/:id',function(req,res){
	var id=req.params.id;
	D.findOne({'id':id},function(err,obj){
		res.render('drill.ejs',{drill:obj});
	});
});

//---------SEARCH SECTION-----------------------------------------------
router.post('/search',function(req,res){
	var key=req.body.key;
	H.findOne({'hashname':{$regex:key,$options:'i'}},function(err,obj){
		if(err)
		console.log(err);
		else{
			res.render('search_results.ejs',{drills:obj.drills});
		}	
	});
});


//----------------SUBSCRIBE---------------------------------------------
router.post('/subscribe/:drill_id',function(req,res){
	var ds=req.params.drill_name;
	var user=req.user;
	D.findOne({'id':us},function(err,drill){
		user.subscribed.push(drill.id);
		drill.subscribers.push(user.id);
		user.save(function(err,obj){
			if(err)
			console.log('err');
		});
		user.save(function(err,obj){
			if(err)
			console.log('err');
		});
	});
});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
      return next();
  res.redirect('/');
}

//------------------INSERTS TAGS OR PUSHES DRILL IDS INTO HASHDB--------
function addHashes(hashes,drill_id){
	hashes.forEach(function(item){
		H.findOne({'hashname':item},function(err,obj){
			if(err)
			console.log(err)
			if(!obj){
				var new_hash=new H();
				new_hash.hashname=item;
				new_hash.drills.push(drill_id);
				new_hash.save(function(err,obj){
					if(err)
					console.log(err);
				});
			}
		});
	});
}
