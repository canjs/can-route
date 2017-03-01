var stealTools = require("steal-tools");

stealTools.export({
	steal: {
		main: ["can-route", "can-define/map/map"],
		config: __dirname + "/package.json!npm"
	},
	outputs: {
		"+amd": {},
		"+standalone": {
			modules: ["can-route", "can-define/map/map"],
			exports: {
				"can-namespace": "can"
			}
		}
	}
}).catch(function(e){
	
	setTimeout(function(){
		throw e;
	},1);
	
});
