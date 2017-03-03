var mongoose =require('mongoose');
var drill=mongoose.Schema({
	drillname:String,
	hashcodes:[],
	user:String;
	nodes:[{
		date:Date.now(),
		week:String,
		description:String,
		links:[]
			}],
	references:[]
});


module.exports=mongoose.model('drill',drill);
