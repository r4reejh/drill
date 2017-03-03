var mongoose =require('mongoose');
var drill=mongoose.Schema({
	drillname:String,
	hashcodes:[],
	published:String,
	user:String,
	nodes:[{
		date:{type:Date,default:Date.now},
		day:String,
		description:String,
	}],
	subscribers:[]
});


module.exports=mongoose.model('drill',drill);
