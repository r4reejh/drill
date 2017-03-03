var express = require('express');
var passport= require('passport');
var fs=require('fs');
var router = express.Router();

var busboy = require('connect-busboy');
var formidable = require('formidable');

var User=require('../models/user');//NOT REQUIRED YET, MAYBE REQUIRED IN FUTURE
var D = require('../models/drill');//SCHEMA FOR TRANSACTION
var H = require('../models/hashcode');//SCHEMA FOR IP FILTERING
router.use(busboy());
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
  successRedirect: '/about',
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

router.get('/about',isLoggedIn,function(req,res){
	res.render('about.ejs');
});

router.post('/signup2',function(req,res){
	var x=req.body;
	var user_a=req.user;
	user_a.userdetails.github=x.github;
	user_a.userdetails.firstname=x.firstname;
	user_a.userdetails.phno=x.phonenumber;
	user_a.save(function(err,obj){
		req.login(obj,function(err){
			if(err)
			console.log(err);
			res.redirect('/profile');
		});
	});
});



router.get('/profile',function(req,res){
	res.render('profile.ejs',{user:req.user});
});

router.post('/create_drill',function(req,res){
	console.log(req.body);
	var x=req.body;
	var hashes=x["hashes"].split(',');
	console.log(x);
	var new_drill=new D();
	try{
	new_drill.drillname=x["name"];
	new_drill.user=req.user.email;
	new_drill.nodes.push({day:"Day 1",description:x["description"]});
	new_drill.save(function(err,obj){
			if(err)
			console.log(err);
			addHashes(hashes,obj.id);
			var user=req.user;
			user.userdetails.drills.push(obj.id);
			user.save(function(err,data){
				//USER NEEDS TO BE LOGGED IN AGAIN, TO REFLECT DATABASE UPDATES
				req.login(user,function(err){
					console.log(req.user);
					//---------UNCOMMENT ONCE EJS AVAILABLE---------------------
					//res.render('drill.ejs',{drill:obj});
					res.render('drill.ejs',{drill:obj});
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
	console.log(x);
	D.findById(x.id,function(err,obj){
		obj.nodes.push({day:x.day,description:x.description,links:x.links});
		obj.save(function(err,doc){
		res.render('drill.ejs',{drill:doc});
		//res.send("success");
	});
});
});



router.post('/edit_node',function(req,res){
	var x=req.body;
	var dayid=x.sequence;
	D.findById(x.id,function(err,obj){
		var c=parseInt(dayid[dayid.length-1]);
		try{
			obj.nodes[c]["description"]=x.description;
			obj.nodes[c]["links"]=x.links;
			obj.save(function(err,doc){
				//res.render('drill.ejs',{drill:doc});
				res.send("success");
			});
		}
		catch(err){
			res.send("out of bounds");
		}
		/*console.log(obj);
		res.send("ok");*/
	});
});

//---------ADD HASH---------------------
router.post('/addhashes',function(req,res){
var x=req.body;
D.findById(x.id,function(err,obj){
var s=obj.hashecodes.push[x.hash];
obj.save(function(err,data){
addHashes(x.hash,obj.id);
res.send("hash added");
});
});
});


//----------------PUBLISH-----------------------------------------------
router.post('/publish',function(req,res){
	var x=req.body;
		D.findByIdAndUpdate(x.id,{$set:{published:"TRUE"}},{new:true},function(err,doc){
			console.log("drill published set to true");
			doc.save(function(err,obj2){
				//res.render('drill.ejs',{drill:dox});
				res.send("published");
			});
		});
});

router.get('/drill/:id',function(req,res){
	var id=req.params.id;
	D.findById(id,function(err,obj){
		res.render('drill.ejs',{drill:obj});
		//res.json(obj);
	});
});

/*router.get('/drill',function(req,res){
	res.render('drill.ejs');
});*/


//---------SEARCH SECTION-----------------------------------------------
router.post('/search',function(req,res){
	var key=req.body.key;
	try{
	H.find({'hashname':{$regex:key,$options:'i'}},function(err,obj){
		if(err)
		console.log(err);
		else{
			//res.render('search_results.ejs',{drills:obj.drills});
			res.render('search.ejs');
		}	
	});
	}
	catch(err){
		console.log(err);
	}

});


//----------------SUBSCRIBE---------------------------------------------
router.post('/subscribe/:drill_id',function(req,res){
	var ds=req.params.drill_id;
	var user=req.user;
	D.findById(ds,function(err,drill){
		//console.log(drill);
		if(err)
		console.log(err);
		else if(!drill)
		res.send("invalid")
		else if(drill.published=="TRUE"){
			user.subscribed.push(drill.id);
			drill.subscribers.push(user.id);
			user.save(function(err,obj){
					if(err)
					console.log('err');
					req.login(user,function(err){
					res.send("success");
				});
			});
		}
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
