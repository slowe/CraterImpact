// Define one global variable - constructor
var CraterImpact;

(function(E) {

	// Very basic YAML parser. Only deals with simple key/value pairs
	function YAML2JSON(str,format,a,z){
		var newdata = {};
		if(typeof str==="string"){
			str = str.replace(/\r/,'');
			str = str.split(/[\n]/);
		}else return newdata;
		if(typeof a!=="number") a = 1;
		if(typeof z!=="number") z = str.length;

		var idx;
		for(var i = a; i < z; i++){
			if(str[i] == "---") continue;
			var idx = str[i].indexOf(":");
			if(idx > 0) newdata[str[i].substr(0,idx)] = str[i].substr(idx+1).replace(/^[\t\s]*/,"");
		}
		return newdata;
	}
	
	// Define our main function
	CraterImpact = function(inp){

		this.dict = {};
		this.lang = "en";

		this.parseQueryString();
		this.setValues();
		this.log('new crater',this.query)

		return this;
	}

	// Parse the query string
	CraterImpact.prototype.parseQueryString = function(){
		var r = {};
		var q = location.search;
		var key,val,i,qs;
		if(q && q != '#'){
			// remove the leading ? and trailing &
			q = q.replace(/^\?/,'').replace(/\&$/,'');
			qs = q.split('&');
			for(i = 0; i < qs.length; i++){
				key = qs[i].split('=')[0];
				val = qs[i].split('=')[1];
				if(/^[0-9\.]+$/.test(val)) val = parseFloat(val);	// convert floats
				r[key] = val;
			}
		}
		this.testmode = (r['debug']) ? true : false;
		this.query = r;

		return this;
	}

	// Set defaults if not provided
	CraterImpact.prototype.setValues = function(){
		this.value = {};
		this.value.lang = (this.query.lang) ? this.query.lang : "en";
		this.value.dist = (this.query.dist) ? this.query.dist : 0;
		this.value.diam = (this.query.diam) ? this.query.diam : 0;
		this.value.traj = (this.query.traj) ? this.query.traj : 90;
		this.value.velo = (this.query.velo) ? this.query.velo : 0;
		this.value.pjd = (this.query.pjd) ? this.query.pjd : 0;
		this.value.tgd = (this.query.tjd) ? this.query.tjd : 0;
		this.value.wlvl = (this.query.wlvl) ? this.query.wlvl : 0;
		this.value.planet = (this.query.planet) ? this.query.planet : "Earth";
		this.log('setValues',this.value)
		return this;
	}

	// Load a language file
	CraterImpact.prototype.loadLanguage = function(l){
		this.log('setLanguage',l);
		function updateLang(data,attr){
			this.log('updating with',data,attr)
			this.dict = YAML2JSON(data);
			this.updateLanguage();
			if(typeof this.onload==="function") this.onload.call(this);
		}
		E().loadFile('lang/'+l+'.yaml',updateLang,{'this':this});
	}

	// Deal with a change in language - update the DOM
	CraterImpact.prototype.updateLanguage = function(){
		this.log('updateLanguage');
		return this;
	}
	

	// Log messages
	CraterImpact.prototype.log = function(){
		//if(!this.testmode) return this;
		var args = Array.prototype.slice.call(arguments, 0);
		if(console && typeof console.log==="function") console.log('CRATER IMPACT:',args);
		return this;
	}


})(E);	// Self-closing function