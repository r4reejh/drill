var mongoose =require('mongoose');
var hashcode=mongoose.Schema({
	hashname:String,
	drills:[]	
});

module.exports=mongoose.model('hashcode',hashcode);
