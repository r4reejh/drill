var mongoose =require('mongoose');
var userschema=mongoose.Schema({
	userdetails:{
	firstname:String,
	username:String,
	password:String,
	emailid:String,
	phno:String,
	github:String
	}
	drills:[]
});


module.exports=mongoose.model('user',userschema);