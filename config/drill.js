var mongoose =require('mongoose');
var drill=mongoose.Schema({
	timelineid:String,
	hashcodes:[],
	nodes:{
		date:Date.now(),
		week:String,
		description:String,
		links:[]
			},
	references:[]

});


module.exports=mongoose.model('drill',drill);