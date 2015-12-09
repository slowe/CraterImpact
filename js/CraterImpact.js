// Define one global variable - constructor
var CraterImpact;

(function(E) {

	var wide = 0;
	var tall = 0;

	function height(el){
		if(!el) return 0;
		if('getComputedStyle' in window) return parseInt(window.getComputedStyle(el, null).getPropertyValue('height'));
		else return parseInt(el.currentStyle.height);	
	}

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
			if(idx > 0) newdata[str[i].substr(0,idx)] = str[i].substr(idx+1).replace(/^[\t\s]*/,"").replace(/^\"(.*)\"$/,"$1");
		}
		return newdata;
	}
	
	// Define our main function
	CraterImpact = function(inp){

		this.dict = {};
		this.lang = "en";
		this.gmap = false;

		this.parseQueryString();
		this.setValues();
		if(this.query.lang) this.lang = this.query.lang;
		this.log('new crater',this.query);

		// Hide header and footer if screen is too small
		if(tall < 600){
		//	E('#header').css({'display':'none'});
		//	E('#footer').css({'display':'none'});
		}
		
		// Open the acknowledgements
		E('#ACK a').on('click',{me:this},function(e){
			E('#acknowledgements').css({'display': 'block'});
			var h = height(E('#ACK_inner').e[0]);
			E('#ACK_inner').css({'top':((tall-h)/2)+'px'});
		});

		// Add close buttons to modal dialogs
		var m = E('.modal-inner');
		for(var i = 0; i < m.e.length; i++){
			var el = E(m.e[i]);
			el.html('<div class="close"><button>&times;</button></div>'+el.html())
		}
		// Attach events to close buttons
		E('.modal-inner .close button').on('click',function(e){
			E(e.currentTarget).parent().parent().parent().css({'display': 'none'});
		});
		
		var _obj = this;
		// We'll need to change the sizes when the window changes size
		window.addEventListener('resize',function(e){ _obj.resize(); });
		this.resize();

		return this;
	}

	CraterImpact.prototype.resize = function(){
		var el,h;
		wide = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		tall = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		// Update main panel
		var els = ['#impactCalc','#ImpactCalc_Input','#Content_Wrapper','.modal-inner']
		for(var i = 0; i < els.length; i++){
			el = E(els[i]);
			for(var j = 0; j < el.e.length; j++){
				h = height(el.e[j]);
				if(isNaN(h)) h = 10;
				if(h > 0 && tall > h) E(el.e[j]).css({'top':((tall-h)/2)+'px'});
			}
		}

		// Update acknowledgement popup
		el = E('#ACK_inner');
		h = height(el.e[0]);
		if(h > 0 && tall > h) el.css({'top':((tall-h)/2)+'px'});
		
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
		this.value.tgd = (this.query.tgd) ? this.query.tgd : 0;
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
		E().ajax('lang/'+l+'.txt',{'complete':updateLang,'this':this});
	}

	// Deal with a change in language - update the DOM
	CraterImpact.prototype.updateLanguage = function(){
		this.log('updateLanguage');
		E('#AppTitle a').html(this.str('lblTitle'))
		E('#ACK a').html(this.str('lbAcknow'));
		return this;
	}
	
	CraterImpact.prototype.str = function(str){
		return (this.dict[str]) ? this.dict[str] : "UNKNOWN KEY";
	}
	
	// Log messages
	CraterImpact.prototype.log = function(){
		//if(!this.testmode) return this;
		var args = Array.prototype.slice.call(arguments, 0);
		if(console && typeof console.log==="function") console.log('CRATER IMPACT:',args);
		return this;
	}


})(E);	// Self-closing function