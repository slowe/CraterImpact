// Define one global variable - constructor
var CraterCalcs;
var DataProvider;

(function(E) {

	//###############################################################################
	// This class holds the core data model for the crater impact application holding
	// data for target, projectile, calculated cater values, crater dimensions, 
	// fireball, Ejecta, Air Blast, Seismic activity and impact.
	// 
	// @author asscott, slowe
	// @version v2.0
	//###############################################################################

	// Format number to a number of decimal places with a given decimal_point and 
	// thousands separater.
	function number_format(number, decimals, dec_point, thousands_sep) {
		number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
		var n = !isFinite(+number) ? 0 : +number,
		prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
		sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
		dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
		s = '',
		toFixedFix = function (n, prec) {
			var k = Math.pow(10, prec);
			return '' + Math.round(n * k) / k;
		};
		// Fix for IE parseFloat(0.55).toFixed(0) = 0;
		s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
		if (s[0].length > 3) {
			s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
		}
		if ((s[1] || '').length < prec) {
			s[1] = s[1] || '';
			s[1] += new Array(prec - s[1].length + 1).join('0');
		}
		return s.join(dec);
	}

	//================================================================================
	// Crater calcs object constructor.
	CraterCalcs = function(inp,_obj){

		if(!inp) inp = {};

		// Variables used in calculations
		this.velocity;				// velocity at target surface km/s
		this.mwater;				// mass of water
		this.vseafloor;				// velocity of projectile at seafloor
		this.energy0;				// input energy before atmospheric entry
		this.energy_power;
		this.energy0_megatons;
		this.megaton_power;
		this.megaton_factor;
		this.energy_megatons;      // energy at suface in MT
		this.energy_seafloor;      // energy at seafloor (bottom of water layer)
		this.iFactor;              // intact factor >= 1, projectile lands intact
		this.dispersion;           // dispersion of pancake upon impact, 2 * semimajor axis of pancaked this.impactor
		this.delta;                // angle of the distance entered, measured from center of the earth
		this.des;                  // description of intensity
		this.wdiameter;            // diameter of crater in water
		this.sf;                   // scale factor for shock wave calculations
		this.h;                    // part of the fireball below the horizon
		this.no_radiation;         // set to true if the fireball is below horizon
		this.irradiation_time;     // time of irradiation

		// Constants
		this.PO = Math.pow(10,5);                          // ambient pressure in Pa
		this.G = (inp.G) ? inp.G : 9.8;                    // acceleration due to gravity
		this.R_earth = (inp.R) ? inp.R : 6370;             // radius of the earth in km
		this.surface_wave_v = 5;                           // velocity of surface wave in km/s
		this.melt_coeff = 8.9 * Math.pow(10,-21);          // coefficient for melt volume calc
		this.vEarth = (inp.V) ? inp.V : 1.1 * Math.pow(10,12); // volume of earth in km^3
		this.vratio;				// ratio of volume of crater to volume of earth
		this.mratio;				// ratio of melt to volume of earth
		this.mcratio;				// ratio of melt to volume of crater
		this.lEarth = (inp.l) ? inp.l : 5.86 * Math.pow(10,33);		// angular momen. of earth in (kg m^3)/sec
		this.lratio;				// ratio of proj ang. momen, to $lEarth
		this.pEarth = (inp.p) ? inp.p : 1.794 * Math.pow(10,32);		// lin. momen of earth in (kg * m) / sec
		this.pratio;				// ratio of proj lin. momen to $pEarth
		this.rhoSurface = (inp.rhoSurface) ? inp.rhoSurface : 1;			// suface density of atmosphere kg/m^3
		this.scaleHeight = (inp.scaleHeight) ? inp.scaleHeight : 8000;			// scale height of atmosphere in m
		this.dragC = 1;             // drag coefficient
		this.fp = 7;                // pancake factor
		this.valid_data =1;
		this.returnVal;
		this.freq_text;

		this.cSize; //= new Number(); //variable passed onto flash file
		this.cDepth; //= new Number(); //variable passed onto flash file

		this.impactor = new ImpactModel();//Hold the impact model data.

		/**For logging events and values for debugging purposes**/
		this.LOGTAG = "CraterImpact";
		this.obj = _obj;

		return this;
	}

	// Format to 0dp.
	CraterCalcs.prototype.nbFormat = function(number){ return number_format(number, 0, ".",","); }
	// Format to 2dp.
	CraterCalcs.prototype.nbFormat2 = function(number){ return number_format(number, 2, ".",","); }
	// Format to 5dp.
	CraterCalcs.prototype.nbFormat3 = function(number){ return number_format(number, 5, ".",","); }


	//==================================================================
	CraterCalcs.prototype.getString = function(str){
		if(!this.dict) return "";
		if(this.dict[str]) return this.dict[str];
		else return "";
	}

	//==================================================================
	// Gets the core data by performing the main calculations.
	CraterCalcs.prototype.getData = function(dataProvider_,dict,callback){
		this.dict = dict;
		this.callback = callback;
		this.dataProvider = dataProvider_;
		this.dataProvider.set('impactor',this.impactor);
		this.doCalcs();
		return this;	
	}

	//===================================================================
	// Once strings are retreived do the calcs.
	CraterCalcs.prototype.doCalcs = function(){

		//distance = 100;
		this.loadParameters();
		this.main_calculation();
	
		/*if (this.impactor.imDist < this.impactor.crDiam){
			this.impactor.imDist = this.impactor.crDiam /100;
			loadParameters();
			main_calculation();
		}*/
		this.sentData();
		return this;
	}

	//==================================================================
	// Resets all the model values to zero
	CraterCalcs.prototype.loadParameters = function(){
		//Alert.show(message, "Crater parameters");
		this.impactor.reset();
		var dp1 = this.dataProvider.get('cbPjDens');
		switch(dp1)
		{
			case 1:
				this.impactor.pjDens = 1000.0;
				break;
			case 2:
				this.impactor.pjDens = 1500.0;
				break;
			case 3:
				this.impactor.pjDens = 3000.0;
				break;
			case 4:
				this.impactor.pjDens = 8000.0;
				break;
		}//end switch
	
		var dp2 = this.dataProvider.get('cbTgDens');
		//Convert target density to a number
		switch(dp2)
		{
			case 1:
				this.impactor.tgDens = 1000.0;
				//Only water is allowed a depth
				this.impactor.tgDepth = this.dataProvider.get('slTgDepth');
				break;
			case 2:
				this.impactor.tgDens = 2500.0;
				this.impactor.tgDepth = 0;
				break;
			case 3:
				this.impactor.tgDens = 2750.0;
				this.impactor.tgDepth = 0;
				break;
		}//end switch

		this.impactor.tgType = this.dataProvider.get('cbTgDens');
	
		/////////////////////
		//ADDED BY AS
		///////////////////
		this.impactor.imDist = this.dataProvider.get('impactDist');
		this.impactor.tgDist =this.dataProvider.get('impactDist');
		this.impactor.pjAngle = this.dataProvider.get('projAngle');
		this.impactor.pjDiam = this.dataProvider.get('projDiam');
		this.impactor.pjVel = this.dataProvider.get('projVel');
	}

	//==================================================================
	// @pre:  All necessary parameters are valid, results calculated
	// @post: Displays the results to the user
	CraterCalcs.prototype.main_calculation = function(){
		this.trace("P diam "+ this.impactor.pjDiam);
		this.trace("P dens "+this.impactor.pjDens);
		this.trace("V input "+this.impactor.pjVel);
		this.trace("Target dens "+this.impactor.tgDens);
	
		this.calc_energy();
		if(this.impactor.pjDiam <= 1000.){
			this.print_atmosphere();
		}
		this.find_crater();

		if(this.impactor.abAltBurst <= 0.){

			this.find_ejecta();
			this.trace("Vel "+ this.impactor.imVel);
		
			if(this.impactor.imVel >= 15){
				this.trace("Running find thermal");
				this.find_thermal();
			}
			this.find_magnitude();
		}	

		this.air_blast();
	
	   this.trace("Energy "+this.impactor.imEnergy);
	}

	//==================================================================
	//  Retrieves from the model and packages the calculated results by 
	//  sending the data to the data provider class from where it may be 
	//  collected by he UI.
	CraterCalcs.prototype.sentData = function(){
		var InArray = new HashMap();
	
		var crf =this.standform(this.impactor.crMass);
		var cr = this.impactor.crMass;
		InArray.put(this.getString("lbImM"), this.standform(this.impactor.crMass)+"&nbsp;kg");
		InArray.put(this.getString("lbPjVel"), this.nbFormat(this.impactor.pjVel)+"&nbsp;km/s");
		InArray.put(this.getString("lbPjAng"), this.nbFormat(this.impactor.pjAngle)+"&deg;");
		InArray.put(this.getString("lbPjDens"), this.nbFormat(this.impactor.pjDens)+"&nbsp;kg/m<sup>3</sup>");
		InArray.put(this.getString("lbTgDens"), this.nbFormat(this.impactor.tgDens)+"&nbsp;kg/m<sup>3</sup>");
		InArray.put(this.getString("lbfbrad"), this.nbFormat2(this.impactor.fbRadius) + "&nbsp;km" );
	
		var Outarray = new HashMap();
	
		if(this.impactor.crDepth > 1) Outarray.put(this.getString("lbCrDepth"), this.nbFormat(this.impactor.crDepth)+"&nbsp;m" );
		if(this.impactor.crDiam > 1) Outarray.put(this.getString("lbCrDiam"), this.nbFormat(this.impactor.crDiam)+"&nbsp;m" );
		if(this.impactor.ejThickness > 0.0001) Outarray.put(this.getString("lbCrThickness"),  this.nbFormat2(this.impactor.ejThickness)+"&nbsp;m");
		if(this.impactor.abAltBurst !=0) Outarray.put(this.getString("lbAbBurst"),  this.nbFormat(this.impactor.abAltBurst)+"&nbsp;m");
		if(this.impactor.abAltBreak !=0) Outarray.put(this.getString("lbAbBreak"),  this.nbFormat(this.impactor.abAltBreak)+"&nbsp;m");
		if(this.impactor.abWindvel > 0.5) Outarray.put(this.getString("lbAbVel"),  this.nbFormat(this.impactor.abWindvel)+"&nbsp;m/s");
		else//this line and next by AS(REMOVE WHEN REAL)
			Outarray.put(this.getString("lbAbVel"),  this.nbFormat(this.impactor.abWindvel)+"&nbsp;m/s");
	
		Outarray.put(this.getString("lbAbRichter"),  this.nbFormat(this.impactor.smRichter) );
	
		if(this.impactor.abAmpl > 0) Outarray.put(this.getString("lbAbAmpl"),  this.nbFormat(this.impactor.abAmpl)+"&nbsp;dB");

		var firearray = new HashMap();
		firearray.put(this.getString("lbFbRad"), this.nbFormat2(this.impactor.fbRadius)+" km" );
		firearray.put(this.getString("lbFbDuration"),  this.nbFormat3(this.impactor.fbDuration)+" s" );
		firearray.put(this.getString("lbFbPeaktime"), this.standform(this.impactor.fbPeaktime)+" s");
	
		if(this.impactor.fbExposure != 0) firearray.put(this.getString("lbFbExp"), this.standform(this.impactor.fbExposure)+" J/m<sup>2</sup>");
	
		var nodata = new HashMap();
		//HashMap<String,String> nodata = new HashMap<String,String>();
		nodata.put(this.getString("lbNoData"), this.getString("lbNoData"));
	
		var energyarray = new HashMap();
	
		energyarray.put(this.getString("lbKE"), this.standform(this.impactor.pjEnergy)+" J");
		energyarray.put(this.getString("lbImE"), this.standform(this.impactor.imEnergy)+" J");
		energyarray.put(this.getString("lbFreq"), this.nbFormat(this.impactor.imFreq)+" yrs");
	
		this.dataProvider.set('dgInputs',InArray);
		this.dataProvider.set('dgOutputs',Outarray);
		this.dataProvider.set('dgEnergy',energyarray);
		this.dataProvider.set('dgFirevall',(this.impactor.fbRadius > 0.01 ? firearray : nodata));

		// Projectile travelling through the atmosphere
		this.impactor.imDesc = "";

		var _obj = this;	
		function buildString(str,n){
			var o = _obj.getString(str);
			return (o.indexOf("%VAL%") >= 0) ? o.replace(/%VAL%/,n) : o+' '+n;
		}
		if(this.iFactor >= 1){
			this.impactor.imDesc += buildString("projectile1",this.nbFormat(this.impactor.imVel)+" km/s")+"<br/><br/>";
			this.impactor.imDesc += buildString("projectile2",this.standform(this.impactor.imEnergy)+" J");
		}else{
			if(this.impactor.abAltBurst > 0){
				this.impactor.imDesc += buildString("projectile3",this.nbFormat(this.impactor.abAltBurst)+" m")+"<br/><br/>";
				this.impactor.imDesc += buildString("projectile4",this.nbFormat(this.impactor.imVel)+" km/s")+"<br/><br/>";
				this.impactor.imDesc += buildString("projectile5",this.standform(this.impactor.imEnergy)+" J")+"<br/><br/>";
				this.impactor.imDesc += this.getString("projectile6");	
			}else{
				this.impactor.imDesc += buildString("projectile7",this.nbFormat2(this.impactor.imVel)+" km/s")+"<br/><br/>";
			}
		}
		
		this.trace("Impact vel"+this.impactor.imVel);

		// Thermal effects and blast wave
		this.impactor.smDesc = "";
	
		if(this.impactor.fbExposure > (Math.pow(10,6) * this.megaton_factor)) this.impactor.smDesc += this.getString("expos1")+"<br/><br/>";
	
		if(this.impactor.fbExposure > (4.2 * Math.pow(10,5) * this.megaton_factor)) this.impactor.smDesc += this.getString("expos2") +"<br/><br/>";
		else if(this.impactor.fbExposure > (2.5 * Math.pow(10,5) * this.megaton_factor)) this.impactor.smDesc += this.getString("expos3")+"<br/><br/>";
		else if(this.impactor.fbExposure > (1.3 * Math.pow(10,5) * this.megaton_factor)) this.impactor.smDesc += this.getString("expos4")+"<br/><br/>";
	
		if(this.impactor.fbExposure > (3.3 * Math.pow(10,5) * this.megaton_factor)) this.impactor.smDesc += this.getString("expos5")+"<br/><br/>";
	
		if(this.impactor.fbExposure > (6.7 * Math.pow(10,5) * this.megaton_factor)) this.impactor.smDesc += this.getString("expos6")+"<br/><br/>";
	
		if(this.impactor.fbExposure > (2.5 * Math.pow(10,5) * this.megaton_factor)) this.impactor.smDesc += this.getString("expos7")+"<br/><br/>";
	
		if(this.impactor.fbExposure > (3.8 * Math.pow(10,5) * this.megaton_factor)) this.impactor.smDesc += this.getString("expos8")+"<br/><br/>";
	
	
		if(this.impactor.abOpressure > 42600) this.impactor.smDesc += this.getString("opress1")+"<br/><br/>";
		else if(this.impactor.abOpressure > 38500) this.impactor.smDesc += this.getString("opress2")+"<br/><br/>";
	
		if(this.impactor.abOpressure > 26800) this.impactor.smDesc += this.getString("opress3")+"<br/><br/>";
		else if(this.impactor.abOpressure > 22900) this.impactor.smDesc += this.getString("opress4")+"<br/><br/>";
	
		if(this.impactor.abOpressure > 273000) this.impactor.smDesc += this.getString("opress5")+"<br/><br/>";
	
		if(this.impactor.abOpressure > 121000) this.impactor.smDesc += this.getString("opress6")+"<br/><br/>";
		else if(this.impactor.abOpressure > 100000) this.impactor.smDesc += this.getString("opress7")+"<br/><br/>";
	
		if(this.impactor.abOpressure > 379000) this.impactor.smDesc += this.getString("opress8")+"<br/><br/>";
	

		////// damage descriptions:  glass, transportation, forrests

		if(this.impactor.abOpressure > 6900) this.impactor.smDesc += this.getString("opress9")+"<br/><br/>";
	
		if(this.impactor.abOpressure > 426000) this.impactor.smDesc += this.getString("opress10")+"<br/><br/>";
		else if(this.impactor.abOpressure > 297000) this.impactor.smDesc += this.getString("opress11")+"<br/><br/>";
	
		if (this.impactor.abOpressure < 6900) this.impactor.smDesc += this.getString("opress12")+"<br/><br/>";
	
		if(this.impactor.abWindvel > 62) this.impactor.smDesc += this.getString("opress13")+"<br/><br/>";
		else if(this.impactor.abWindvel > 40) this.impactor.smDesc += this.getString("opress14")+"<br/><br/>";
	
		if ((this.impactor.crDiam/2) >= (this.impactor.imDist*1000)) this.impactor.smDesc = this.getString("incrater");
	
		this.trace("Im Dist"+this.impactor.imDist);
	
		this.dataProvider.set('txtDamage',this.impactor.smDesc);
		//txDamage.text = this.impactor.smDesc;
		this.dataProvider.set('txtImpactor',this.impactor.imDesc);
		//txthis.impactor.text = this.impactor.imDesc;
	
	
		//Check if below lines are needed.
	
		//lbDamage.text = dsLanguage.lastResult.damage1+this.nbFormat.format(this.impactor.imDist)+dsLanguage.lastResult.damage2;
		//Log.i(LOGTAG,txDamage.text);
		//setCraterSize();
		//sizeCompare();
		//showMap();
	}


	//==================================================================
	// Calculates the impact energy assigning results to class global 
	// impact model.
	CraterCalcs.prototype.calc_energy = function(){
		////// mass = density * volume, volume calculated assuming the projectile to be approximately spherical
		////// V = 4/3pi(r^3) = 1/6pi(d^3)
		var alpha;
		var beta;
		var linmom;
		var angmom;
		var freq_p;

		this.impactor.crMass = ((Math.PI * Math.pow(this.impactor.pjDiam,3))/6)*this.impactor.pjDens;
		this.trace("Mass "+this.impactor.crMass); 
		this.impactor.pjEnergy = 0.5 * this.impactor.crMass * Math.pow((this.impactor.pjVel * 1000),2);
		energy0_megatons = this.impactor.pjEnergy / (4.186 * Math.pow(10,15));		////// joules to megatons conversion

		/* if(mass < 1){
			print_noimpact();
		} */
	
		this.atmospheric_entry();

		linmom = this.impactor.crMass * (this.impactor.imVel * 1000);
		angmom = this.impactor.crMass * (this.impactor.imVel * 1000) * Math.cos(this.impactor.pjAngle * Math.PI / 180) * this.R_earth;

		if(this.impactor.pjVel > (0.25 * 3 * Math.pow(10,5))){
			// relativistic effects, multiply energy by 1/sqrt(1 - v^2/c^2)
			beta = 1/ Math.sqrt(1 - Math.pow(this.impactor.pjVel,2) / 9 * Math.pow(10,10));
			this.impactor.pjEnergy *= beta;	
			linmom *= beta;
			angmom *= beta;
		}

		if(this.impactor.abAltBurst > 0){
			this.impactor.imEnergy = 0.5 * this.impactor.crMass * (Math.pow(this.impactor.pjVel * 1000,2) - Math.pow(this.impactor.imVel * 1000,2));
			this.impactor.imMegaton = this.impactor.imEnergy / (4.186 * Math.pow(10,15));		////// joules to megatons conversion
		}else{
			this.impactor.abAltBurst = 0;
			this.impactor.imEnergy = 0.5 * this.impactor.crMass * Math.pow(this.impactor.imVel * 1000,2);
			this.impactor.imMegaton = this.impactor.imEnergy / (4.186 * Math.pow(10,15));		////// joules to megatons conversion
		}//end else

		lratio = angmom / this.lEarth;
		pratio = linmom / this.pEarth;
	
		mwater = (Math.PI * Math.pow(this.impactor.pjDiam,2) / 4) * (this.impactor.tgDepth / Math.sin(this.impactor.pjAngle * Math.PI / 180)) * 1000;	
		vseafloor = this.impactor.imVel * Math.exp(-(3 * 1000 * 0.877 * this.impactor.tgDepth) / (2 * this.impactor.pjDens * this.impactor.pjDiam * Math.sin(this.impactor.pjAngle * Math.PI / 180)));
		energy_seafloor = 0.5 * this.impactor.crMass * Math.pow(vseafloor * 1000,2);
	
		this.trace( "" + vseafloor);
		this.trace("Im vel"+this.impactor.imVel);
		this.trace("Targ Dens"+this.impactor.tgDepth);
		this.trace("Pj Ang"+this.impactor.pjAngle);
	
		delta = (180 / Math.PI) * (this.impactor.imDist/this.R_earth);

	
		energy_power = Math.log(this.impactor.imEnergy)/Math.LN10;
		energy_power = Math.floor(energy_power);//formerly was a cast to int not a round
		//this.impactor.pjEnergy /= Math.pow(10,energy_power);
	
		megaton_power = Math.log(energy0_megatons)/Math.LN10;
		megaton_power = Math.floor(megaton_power);//formerly was a cast to int not a round
		energy0_megatons /= Math.pow(10,megaton_power);

		this.impactor.imFreq = 110 * Math.pow(energy0_megatons * Math.pow(10,megaton_power),0.77);
	
		/*if(this.impactor.imFreq > 1000){
			freq_p = Math.log(this.impactor.imFreq)/Math.LN10;
			freq_p = int(freq_p);
			this.impactor.imFreq /= Math.pow(10,freq_p);
		
			if($freq * 10**$freq_p < 4.5e9){
				printf("<dd>The average interval between impacts of this size somewhere on Earth during the last 4 billion years is <b>%.1f x 10<sup>%.0f</sup>years</b>", $freq, $freq_p);
			}else{
				print "<dd>The average interval between impacts of this size is longer than the Earth's age.";
				print "<dd>Such impacts could only occur during the accumulation of the Earth, between 4.5 and 4 billion years ago.";
			}
			printf("</dl>\n");
			return;
		}*/
	}

	//==================================================================
	// Calculates statistics and details regarding atmospheric entry and 
	// assigns the results within the Global impact model.
	CraterCalcs.prototype.atmospheric_entry = function(){
		var yield;		// yield strength of projectile in Pa 
		var av;			//velocity decrement factor
		var rStrength;		//strength ratio
		var vTerminal;		//m/s
		var vSurface;		//velocity of the this.impactor at surface in m/s if greater than terminal velocity
		var altitude1;
		var omega;
		var vBU;
		var tmp;
		var vFac;
		var lDisper;
		var alpha2;
		var altitudePen;
		var expfac;
		var altitudeScale;
		var integral;

		yield = Math.pow(10,(2.107 + 0.0624 * Math.pow(this.impactor.pjDens,0.5))); //yield strength of projectile in Pa
		
		av = 3 * this.rhoSurface * this.dragC * this.scaleHeight / (2 * this.impactor.pjDens * this.impactor.pjDiam * Math.sin(this.impactor.pjAngle * Math.PI / 180)); //velocity decrement factor

		rStrength = yield / Math.pow(this.rhoSurface * this.impactor.pjVel * 1000 ,2); //strength ratio

		this.iFactor = 5.437 * av * rStrength;

		if(this.rhoSurface < 1e-8){
			this.impactor.abAltBurst = 0;
			this.impactor.imVel = this.impactor.pjVel * Math.sin(this.impactor.pjAngle * Math.PI / 180);
			return;
		}


		if(this.iFactor >= 1){
			// projectile lands intact

			this.impactor.abAltBurst = 0;
			tmp = (2 * this.impactor.pjDens * this.impactor.pjDiam * this.G / (3 * this.rhoSurface * this.dragC));
			vTerminal = Math.pow(tmp,0.5);
			vSurface = this.impactor.pjVel * 1000 * Math.exp(-av);
		
			if(vTerminal > vSurface)
				this.impactor.imVel = vTerminal;
			else
				this.impactor.imVel = vSurface;
		

		}else{
			// projectile does not land intact
		
			//Alert.show("Projectile does not land");
			altitude1 = - this.scaleHeight * Math.log(rStrength);
			omega = 1.308 - 0.314 * this.iFactor - 1.303 * Math.pow((1 - this.iFactor),0.5);
			this.impactor.abAltBreak = altitude1 - omega * this.scaleHeight;
			vBU = this.impactor.pjVel * 1000 * Math.exp(- av * Math.exp(- this.impactor.abAltBreak/this.scaleHeight));		// m/s
		
			vFac = 1.5 * Math.pow((this.dragC * this.rhoSurface / (2 * this.impactor.pjDens)),0.5) * Math.exp(- this.impactor.abAltBreak / (2 * this.scaleHeight));
			lDisper = this.impactor.pjDiam * Math.sin(this.impactor.pjAngle * Math.PI / 180) * Math.pow((this.impactor.pjDens / (2 * this.dragC * this.rhoSurface)),0.5) * Math.exp(this.impactor.abAltBreak / (2 * this.scaleHeight)); 

			alpha2 = Math.pow((Math.pow(this.fp,2) - 1),0.5);
			altitudePen = 2 * this.scaleHeight * Math.log(1 + alpha2 * lDisper /(2 * this.scaleHeight));
			this.impactor.abAltBurst = this.impactor.abAltBreak - altitudePen;
			this.trace ("Projectile does not land");
		
			if(this.impactor.abAltBurst > 0){
				// this.impactor bursts in atmosphere
				expfac = 1/24 * alpha2 *(24 + 8 * Math.pow(alpha2,2) + 6 * alpha2 * lDisper / this.scaleHeight + 3 * Math.pow(alpha2,3) * lDisper / this.scaleHeight);
				this.impactor.imVel = vBU * Math.exp(- expfac * vFac);
			}else{
				altitudeScale = this.scaleHeight / lDisper;
				integral = Math.pow(altitudeScale,3) / 3 * (3 * (4 + 1/Math.pow(altitudeScale,2)) * Math.exp(this.impactor.abAltBreak / this.scaleHeight) + 6 * Math.exp(2 * this.impactor.abAltBreak / this.scaleHeight) - 16 * Math.exp(3 * this.impactor.abAltBreak / (2 * this.scaleHeight)) - 3 / Math.pow(altitudeScale,2) - 2);
				this.impactor.imVel = vBU * Math.exp(- vFac * integral);
				dispersion = this.impactor.pjDiam * Math.pow((1 + 4 * Math.pow(altitudeScale,2) * Math.pow((Math.exp(this.impactor.abAltBreak / (2 * this.scaleHeight)) - 1),2)),0.5);

			}
		}

		this.impactor.imVel /= 1000;	
	}

	//==================================================================
	// Crater based calculations to find the dimensions of the crater and 
	// its depth. Assigns the results to the class global impact model.
	CraterCalcs.prototype.find_crater = function(){
		var Cd;
		var beta;
		var anglefac;
		var vbreccia;
		var rimHeightf;

		anglefac = Math.pow((Math.sin (this.impactor.pjAngle * Math.PI / 180)),(1/3));
	
		if(this.impactor.tgType == 1){
			Cd = 1.88;
			beta = 0.22;
		}else if(this.impactor.tgType == 2){
			Cd = 1.54;
			beta = 0.165;
		}else{
			Cd = 1.6;
			beta = 0.22;
		}
		
		if(this.impactor.tgDepth != 0){
			// calculate crater in water using Cd = 1.88 and beta = 0.22
	
			wdiameter = 1.88 * (Math.pow((this.impactor.crMass / this.impactor.tgDens),1/3)) * Math.pow(( (1.61*this.G*this.impactor.pjDiam)/Math.pow((this.impactor.imVel*1000),2)),(- 0.22));
			wdiameter *= anglefac;
		
			this.impactor.tgDens = 2700;	// change target density for seafloor crater calculation
		}
	
		// vseafloor == surface velocity if there is no water
		this.impactor.crTsDiam = Cd * (Math.pow((this.impactor.crMass / this.impactor.tgDens),0.333)) * Math.pow(( (1.61*this.G*this.impactor.pjDiam)/Math.pow((vseafloor*1000),2)),(- beta));
		this.impactor.crTsDiam *= anglefac;
	
		if(this.dispersion >= this.impactor.crTsDiam)		// if crater field is formed, compute crater dimensions assuming 
			this.impactor.crTsDiam /= 2;			// impact of largest fragment (with diameter = 1/2 initial diameter)
	
		this.impactor.crTsDepth = this.impactor.crTsDiam / 2.828;

		if(this.impactor.crTsDiam*1.25 >= 3200){
			// complex crater will be formed, use equation from McKinnon and Schenk (1985)
			this.impactor.crDiam = (1.17 * Math.pow(this.impactor.crTsDiam,1.13)) / (2.8554);
			this.impactor.crDepth = 37 * Math.pow(this.impactor.crDiam,0.301);
		}else{
			//simple crater will be formed.

			//Diameter of final crater in m
			this.impactor.crDiam = 1.25 * this.impactor.crTsDiam;

			//Breccia lens volume in m^3
			vbreccia = 0.032 * Math.pow(this.impactor.crDiam,3);		// in m^3

			//Rim height of final crater in m
			rimHeightf = 0.07 * Math.pow(this.impactor.crTsDiam,4) / Math.pow(this.impactor.crDiam,3);

			//Thickness of breccia lens in m
			this.impactor.crBrecThick = 2.8 * vbreccia * ((this.impactor.crTsDepth + rimHeightf) / (this.impactor.crTsDepth * Math.pow(this.impactor.crDiam,2)));

			//Final crater depth (in m) = transient crater depth + final rim height - breccia thickness
			this.impactor.crDepth = this.impactor.crTsDepth + rimHeightf - this.impactor.crBrecThick;

		}
	
		this.impactor.crVol = (Math.PI / 24) * Math.pow((this.impactor.crTsDiam/1000),3);
		vratio = this.impactor.crVol / this.vEarth;
	
		if(this.impactor.imVel >= 12){
			this.impactor.crVolMelt = this.melt_coeff * (energy_seafloor) * Math.sin(this.impactor.pjAngle * Math.PI / 180);		// energy_seafloor = this.impactor.imEnergy if there is no water layer
			if(this.impactor.crVolMelt > this.vEarth)
				this.impactor.crVolMelt = this.vEarth;
	
			mratio = this.impactor.crVolMelt / this.vEarth;
			mcratio = this.impactor.crVolMelt / this.impactor.crVol;
		}
		this.trace("Final Crater diam "+this.impactor.crDiam);
		this.trace("Final crater depth "+this.impactor.crDepth);
		this.trace("Transient crater "+this.impactor.crTsDiam);	
	
	} ////// End o find_crater==========================================


	//==================================================================
	// Calculates statistics about the impact ejecta. Assigns the resuts 
	// to the class global impact model.
	CraterCalcs.prototype.find_ejecta = function (){
	
		var phi = (this.impactor.imDist) / (2 * this.R_earth);
		var X = (2 * Math.tan(phi)) / (1 + Math.tan(phi));
		var e = -Math.pow((0.5 * Math.pow((X - 1),2) + 0.5),0.5); // eccentricity of eliptical path of the ejecta
		var a = (X * this.R_earth* 1000) / (2 * (1 - Math.pow(e,2)));	// semi major axis of elliptical path

		var part1 = Math.pow(a,1.5) / Math.pow((this.G * Math.pow(this.R_earth* 1000,2)), 0.5);
		var term1 = 2* Math.atan( Math.pow(((1 - e)/(1 + e)),0.5) * Math.tan (phi / 2));
		var term2 = e * Math.pow((1 - Math.pow(e,2)),0.5) * Math.sin (phi)/ (1 + e * Math.cos(phi));


		this.impactor.ejFalltime = 2 * part1 * (term1 - term2);

		this.impactor.ejThickness = Math.pow(this.impactor.crTsDiam,4)/(112 * Math.pow(this.impactor.imDist * 1000,3));
		this.trace("Ejecta thickness "+this.impactor.ejThickness);

		////// compute mean fragment size
		var a2 = 2.65;
		var half_diameter = (this.impactor.crDiam/1000)/2;		// half of final crater diameter in km
		var dc = 2400* Math.pow(half_diameter,-1.62);

		this.impactor.ejFragsize = dc * Math.pow((half_diameter/this.impactor.imDist), a2);

	}////// end of find_ejecta==========================================

	//==================================================================
	// Calculates thermal statistics and assigns the results to the class 
	// global impact model.
	CraterCalcs.prototype.find_thermal = function(){
		var eta;
		var T_star;
		var sigma;
		var del;
		var f;
	
		eta = 3 * Math.pow(10,-3);			  //// factor for scaling thermal energy
		T_star = 3000;							//// temperature of fireball
		this.impactor.fbRadius = 2* Math.pow(10,-6)* Math.pow(this.impactor.imEnergy,1/3);				//// this.impactor.fbRadius is in km
		sigma = 5.67 * Math.pow(10,-8);						//// Stephan-Boltzmann constant

		this.impactor.fbExposure = (eta * this.impactor.imEnergy)/(2 * Math.PI * Math.pow(this.impactor.imDist* 1000,2));

		h = (1 - Math.cos(delta * Math.PI/180))* this.R_earth;	// h is in km, R_earthis in km	
		del = Math.acos(h / this.impactor.fbRadius);
		f = (2/Math.PI)*(del - (h/this.impactor.fbRadius)*Math.sin(del));

			if(h > this.impactor.fbRadius){
				no_radiation = 1;
				return;
			}
	
		no_radiation = 0;
		this.impactor.fbExposure *= f;

		this.impactor.fbDuration = this.impactor.fbRadius / (this.impactor.imVel);
		this.impactor.fbPeaktime = (eta * this.impactor.imEnergy)/(2 * Math.PI * Math.pow(this.impactor.fbRadius*1000,2) * sigma * Math.pow(T_star,4));

		this.megaton_factor = Math.pow(this.impactor.imMegaton,1/6);
		this.trace("Exposure "+this.impactor.fbExposure);

	}

	//==================================================================
	//  returns the richter magnitude of the seismic disturbance caused 
	//  by impact
	CraterCalcs.prototype.find_magnitude = function(){
		var Ax;
	
		this.impactor.smRichter = 0.67 * ((Math.log (energy_seafloor))/Math.LN10) - 5.87;

		if(this.impactor.imDist >= 700)
		{
																		
			Ax = 20 * Math.pow(10,(this.impactor.smRichter - 1.66 * (Math.log (delta) / Math.LN10) - 3.3));
			Ax /= 1000;  //factor for determining "effective this.impactor.smRichter" at given this.impactor.imDist

		}//end if
		else if(this.impactor.imDist >= 60)
			Ax = Math.pow(10,(this.impactor.smRichter - (0.0048*this.impactor.imDist + 2.5644)));
		else
			Ax = Math.pow(10,(this.impactor.smRichter - (0.00238*this.impactor.imDist + 1.3342)));



		this.impactor.smEffMag = (Math.log (Ax) /Math.LN10) + 1.4;
		this.impactor.smArrival = this.impactor.imDist / this.surface_wave_v;
		this.trace("Effective mag: "+this.impactor.smEffMag);
	}

	//==================================================================
	// Calculates statistics about the air blast created and assigns the 
	// results to the class global impact model.
	CraterCalcs.prototype.air_blast = function(){

		var vsound = 330;	// speed of sound in m/s
		var r_cross0 = 290;	// radius at which relationship between overpressure and distance changes (for surface burst)
		var op_cross = 75000;	// overpressure at crossover
		var r_cross;
		var z_scale;
		var r_mach;
		var energy_ktons;
		var d_scale;
		var slantRange;
		var d_smooth;
		var p_machT;
		var p_0 = 0;//=0 added by AS to stop uninitialise var error when trans from action script.
		var expFactor = 0;//=0 added by AS to stop uninitialise var error when trans from action script.
		var p_regT = 0;//=0 added by AS to stop uninitialise var error when trans from action script.

		energy_ktons = 1000 * this.impactor.imMegaton; //energy in kilotons

		slantRange = Math.pow(Math.pow(this.impactor.imDist,2) + Math.pow((this.impactor.abAltBurst/1000),2),0.5);		// for air burst, distance is slant range from explosion
		this.impactor.abShockTime = (slantRange * 1000)/vsound;	// distance in meters divided by velocity of sound in m/s

		sf = Math.pow((energy_ktons),1/3);
		d_scale = (this.impactor.imDist * 1000) / sf;

		z_scale = this.impactor.abAltBurst / sf;
		//radius at which relationship between overpressure and distance changes
		r_cross = r_cross0 + 0.65 * z_scale;
		r_mach = 550 * z_scale /(1.2 * (550 - z_scale));
		if(z_scale >= 550) r_mach = 1e30;
	

		if(this.impactor.abAltBurst > 0){

			d_smooth = Math.pow(z_scale,2) * 0.00328;
			p_machT = ((r_cross * op_cross) / 4) * (1 / (r_mach + d_smooth)) * Math.pow((1 + 3*(r_cross / (r_mach + d_smooth))),1.3);
			p_0 = 3.1423e11 / Math.pow(z_scale,2.6);
			expFactor = - 34.87 / Math.pow(z_scale,1.73);
			p_regT = p_0 * Math.exp(expFactor * (r_mach - d_smooth));
		}else{
			d_smooth = 0;
			p_machT = 0;
		}
	
		if(d_scale >= (r_mach + d_smooth)) this.impactor.abOpressure = ((r_cross * op_cross) / 4) * (1 / d_scale) * (1 + 3*Math.pow((r_cross / d_scale), 1.3));
		else if(d_scale <= (r_mach - d_smooth)) this.impactor.abOpressure = p_0 * Math.exp(expFactor * d_scale);
		else this.impactor.abOpressure = p_regT - (d_scale - r_mach + d_smooth) * 0.5 * (p_regT - p_machT)/d_smooth;
	
		this.impactor.abWindvel = ((5 * this.impactor.abOpressure) / (7 * this.PO)) * (vsound / Math.pow((1 + (6 * this.impactor.abOpressure) / (7 * this.PO)),0.5));

		////// damage descriptions:  structures

		////// sound intensity

		if(this.impactor.abOpressure > 0) this.impactor.abAmpl = 20 * (Math.log (this.impactor.abOpressure) / Math.LN10);
		else this.impactor.abAmpl = 0;
	
		this.trace("O pressure "+this.impactor.abOpressure);
	}

	//==================================================================
	// Calculates atmospheric data and assigns the results to the class 
	// global impact model.
	CraterCalcs.prototype.print_atmosphere = function(){

		//Atmospheric Entry:

		var en = 0.5 * this.impactor.pjMass * (Math.pow(this.impactor.pjVel * 1000,2) - Math.pow(this.impactor.imVel * 1000,2));
		var en_power;
		var ens_power;
		var en_mton;
		var enmton_power;

		en_mton = en / (4.186 * Math.pow(10,15)); // joules to megatons conversion

		en_power = Math.log(en)/Math.LN10;
		en_power = Math.floor(en_power);//was cast to int
		en /= Math.pow(10,en_power);

		ens_power = Math.log(this.impactor.imEnergy)/Math.LN10;
		ens_power = Math.floor(ens_power);//Was cast to int.
		this.impactor.imEnergy /= Math.pow(10,ens_power);

		enmton_power = Math.log(en_mton)/Math.LN10;
		enmton_power = Math.floor(enmton_power);//was cast to int.
		en_mton /= Math.pow(10,enmton_power);

		megaton_power = Math.log(this.impactor.imMegaton)/Math.LN10;
		megaton_power = Math.floor(megaton_power);//was cast to int.
		this.impactor.imMegaton /= Math.pow(10,megaton_power);
	
		this.trace("this.impactor pjDen "+this.impactor.pjDens);
		this.trace("this.impactor altburst "+this.impactor.abAltBurst);
		this.trace("iFactor "+ this.iFactor);
		this.impactor.imEnergy *= Math.pow(10,ens_power);
		this.impactor.imMegaton *= Math.pow(10,megaton_power);

	}

	//==================================================================
	// Convets a double to standard form.
	// @param a The double to convert.
	// @return The conerted number as a String.
	CraterCalcs.prototype.standform = function(a){
		var exponent = Math.floor(Math.log(Math.abs(a)) / Math.LN10); 

		if(a == 0) exponent = 0; //handle glitch if the number is zero

		//find mantissa (e.g. "3.47" is mantissa of 3470; need to divide by 1000)
		var tenToPower = Math.pow(10, exponent);
		var mantissa = a / tenToPower;

		this.trace("x "+mantissa+" y "+exponent+" a "+a);
		return this.nbFormat2(mantissa)+" x 10<sup>"+exponent + "</sup>";
	}

	//============================================================================
	// Write a message to the log
	CraterCalcs.prototype.trace = function(s){
		this.obj.log('CraterCalcs',s);
	}


	//###############################################################################
	/**
	 * This object holds the core data model for the crater impact application holding
	 * data for target, projectile, calculated cater values, crater dimensions, 
	 * fireball, Ejecta, Air Blast, Seismic activity and impact.
	 * 
	 * @author Andrew S Scott University of South Wales.
	 * @version v1.0
	 */
	//###############################################################################

	//=========================================================================
	/**
	 * Constructor for the impact model which sets all values to zero.
	 */
	//=========================================================================
	function  ImpactModel() {
		//target
		this.tgDens= 0;
		this.tgDepth = 0;
		this.tgDist = 0;
		this.tgType = 0;
		// Projectile
		this.pjDens = 0;
		this.pjVel = 0;
		this.pjAngle = 0;
		this.pjDiam = 0;
		this.pjMass = 0;
		this.pjEnergy = 0;
		// ---- Output variables
		// Crater calculated values
		this.crHeight = 0;
		this.crDiam = 0;
		this.crDepth = 0;
		this.crMass = 0;
		this.crWatermass = 0;
		this.crVol = 0;
		this.crVolMelt = 0;
		this.crBrecThick = 0;
		// Transient crater dimensions
		this.crTsDiam = 0;
		this.crTsDepth = 0;
		// Fireball 
		this.fbRadius = 0;
		this.fbDuration = 0;
		this.fbExposure = 0;
		this.fbFlux = 0;
		this.fbPeaktime = 0;
		this.fbEnergy = 0;
		// Ejecta
		this.ejFalltime = 0;
		this.ejThickness = 0;
		this.ejFragsize = 0;
		// Air blast
		this.abAmpl = 0;
		this.abWindvel = 0;
		this.abOpressure = 0;
		this.abDesc = "";
		this.abShockTime = 0;
		this.abAltBreak = 0;
		this.abAltBurst = 0;
		// Seismic 
		this.smRichter = 0;
		this.smArrival = 0;
		this.smEffMag = 0;
		this.smDesc = "";
		// Impact
		this.imEnergy = 0;
		this.imMegaton = 0;
		this.imFreq = 0;
		this.imDesc = "";
		this.imDist = 0;
		this.imVel = 0;

	}//========================================================================

	//=========================================================================
	/**
	 * Resets all the model values to zero
	 */
	//=========================================================================
	ImpactModel.prototype.reset = function(){
		//target
		this.tgDens=0;
		this.tgDepth = 0;
		this.tgDist = 0;
		this.tgType = 0;
		// Projectile
		this.pjDens = 0;
		this.pjVel = 0;
		this.pjAngle = 0;
		this.pjDiam = 0;
		this.pjMass = 0;
		this.pjEnergy = 0;
		// ---- Output variables
		// Crater calculated values
		this.crHeight = 0;
		this.crDiam = 0;
		this.crDepth = 0;
		this.crMass = 0;
		this.crWatermass = 0;
		this.crVol = 0;
		this.crVolMelt = 0;
		this.crBrecThick = 0;
		// Transient crater dimensions
		this.crTsDiam = 0;
		this.crTsDepth = 0;
		// Fireball 
		this.fbRadius = 0;
		this.fbDuration = 0;
		this.fbExposure = 0;
		this.fbFlux = 0;
		this.fbPeaktime = 0;
		this.fbEnergy = 0;
		// Ejecta
		this.ejFalltime = 0;
		this.ejThickness = 0;
		this.ejFragsize = 0;
		// Air blast
		this.abAmpl = 0;
		this.abWindvel = 0;
		this.abOpressure = 0;
		this.abDesc = "";
		this.abShockTime = 0;
		this.abAltBreak = 0;
		this.abAltBurst = 0;
		// Seismic 
		this.smRichter = 0;
		this.smArrival = 0;
		this.smEffMag = 0;
		this.smDesc = "";
		// Impact
		this.imEnergy = 0;
		this.imMegaton = 0;
		this.imFreq = 0;
		this.imDesc = "";
		this.imDist = 0;
		this.imVel = 0;

	}//=========================================================================

	//##############################################################
	/**
	JavaSctipt has not hash map functionality, because true hash 
	maps require access to the memory locations of objects. However, 
	JavaScript does not even provide functionality that replacates 
	the behaviour of Hash maps. Hence this library does.
	**/
	//##############################################################

	function HashMap(obj){
		this.length = 0;
		this.items = {};
		for (var p in obj) {
			if (obj.hasOwnProperty(p)) {
				this.items[p] = obj[p];
				this.length++;
			}
		}

		/**
		Put an item in the hash tablle
		**/
		HashMap.prototype.put = function(key, value){
			var previous = undefined;
			if (this.hasItem(key)) previous = this.items[key];
			else this.length++;
		
			this.items[key] = value;
			var ky = this.hasItem(key) ? this.items[key] : undefined;
			return previous;
		}

		/**
		Get an item from the hash table.
		**/
		HashMap.prototype.get = function(key) {
			var itm = this.items[key];
			var ky = this.hasItem(key) ? this.items[key] : undefined;
			return ky;
		}

		/**
		Check if hash has item allready.
		**/
		HashMap.prototype.hasItem = function(key){
			return this.items.hasOwnProperty(key);
		}

		/**
		Remove an item from the table.
		**/
		HashMap.prototype.remove = function(key){
			if (this.hasItem(key)) {
				previous = this.items[key];
				this.length--;
				delete this.items[key];
				return previous;
			}else{
				return undefined;
			}
		}

		/**
		Return the keys in an array.
		**/
		HashMap.prototype.keys = function(){
			var keys = [];
			for (var k in this.items) {
				if (this.hasItem(k)) keys.push(k);
			}
			return keys;
		}

		/**
		Return the values in an array.
		**/
		HashMap.prototype.values = function(){
			var values = [];
			for (var k in this.items) {
				if (this.hasItem(k)) values.push(this.items[k]);
			}
			return values;
		}

		/**
		Each function allows the object to be used in a for each loop.
		**/
		HashMap.prototype.each = function(fn) {
			for (var k in this.items) {
				if (this.hasItem(k)) fn(k, this.items[k]);
			}
		}

		/**
		Clears the contents of the HashMap table.
		**/
		HashMap.prototype.clear = function(){
			this.items = {}
			this.length = 0;
		}
	}//##############################################################

	//###########################################################################
	/**
	 * Provides a link between the underlying calculation and the front end UI
	 * features. All communication with the back end is done though this class.
	 * It is also the class to go though when getting the results of an impact.
	 * 
	 * In this class are a collection of getter and setter methods which should 
	 * erface with the UI. 
	 * 
	 */
	//###########################################################################

	DataProvider = function(){
	
		this.selected_language;
	
		this.latitude;
		this.longitude;
	
		//Input fields//
		this.cbPjDens;/**Projectile Density selected index (combo box in ui)**/
		this.cbTgDens;/**Target Density selected index (combo box in ui)**/
		this.slTgDepth;/**Selected depth when water is the target (slider in ui)**/
		this.cbSelectDepthObject;/**Not actually crater depth but selected landmark on Crater depth screen (a como box)**/
	
		this.cbLocation;/**The selected location if a default location is selected**/
	
		this.projDiam;/**Projectile Diamiter**/
		this.projAngle;/**Projectile Angle**/
		this.projVel;/**Projectile velolcity**/
		this.impactDist;/**Distance from Impact**/
	
		//Output Fields//
		this.txtDamage;/**Description of damage caused by seismic activity**/
		this.txtImpactor;/**Description of the impact**/
	
		//Outputs for Results Tables in key value pairs//
		this.dgInputs;/**The values input HMAP**/
		this.dgOutputs;/**The core of the calculated results HMAP**/
		this.dgEnergy;/**Energy created by impact HMAP**/
		this.dgFirevall;/**Fire ball results HMAP**/
	
		this.impactor;/**The populated impact data model**/

		// Set the value for a key
		this.set = function(key,value){ this[key] = value; console.log(key,value)}
		// Get the value for a key
		this.get = function(key,value){ return this[key]; }

		return this;
	}//###########################################################################


})(S);	// Self-closing function