var mongoose =require('mongoose');
var drill=mongoose.Schema({
	drillname:String,
	hashcodes:[],
	user:String,
	nodes:[{
		date:{type:Date,default:Date.now},
		week:String,
		description:String,
		links:[]
	}],
	subscribers:[]
});


module.exports=mongoose.model('drill',drill);
