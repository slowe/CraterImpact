(function(S) {

	function makeSlider(input,html,callback,_obj){
		var inp = S(input);
		var html5Slider = S(html);
		html5Slider.addClass('noUi-target noUi-ltr noUi-horizontal noUi-background');
		noUiSlider.create(html5Slider.e[0], {
			start: parseFloat(inp.attr('value')),
			step: parseFloat(inp.attr('step')),
			range: {
				'min': parseFloat(inp.attr('min')),
				'max': parseFloat(inp.attr('max'))
			}
		});
		html5Slider.e[0].noUiSlider.on('update', function(values, handle) {
			var value = values[handle];
			if(typeof callback==="function") callback.call((_obj ? _obj : inp.e[0]),value)
			if(handle) inp.e[0].value = value;
			else inp.e[0].value = Math.round(value);
		});
		inp.on('change', function(){
			html5Slider.e[0].noUiSlider.set([this.attr('value')]);
		});

	}

	CraterImpact.prototype.processInput = function(){

		this.updateControls();

		// Update this language
		this.loadLanguage(this.lang);

		if(this.values.planet == "Earth") S("#cpTgDensMarsMoon").css({'display':'none'});
		else S("#cpTgDens").css({'display':'none'});

		this.prepareView();
	
		// Make sliders
		makeSlider('#ProjectileSize','#ProjectileSizeSlider',this.updateDiameter,this);
		makeSlider('#ProjectileAngle','#ProjectileAngleSlider',this.updateAngle,this);
		makeSlider('#ProjectileVelocity','#ProjectileVelocitySlider',this.updateVelocity,this);
		makeSlider('#ImpactDistance','#ImpactDistanceSlider',this.updateDistance,this);
		makeSlider('#WaterDepth','#WaterDepthSlider',this.updateWater,this);

		// Add events
		S('#cpPjDens').on('change',{me:this},function(e){ e.data.me.selectPjDensity(e.currentTarget); });
		S('#cpTgDens').on('change',{me:this},function(e){ e.data.me.selectTgDensity(e.currentTarget); });
		S('#cpTgDensMarsMoon').on('change',{me:this},function(e){ e.data.me.selectTgDensityMarsMoon(e.currentTarget); });
		S('#BT_Reset').on('click',{me:this},function(e){ e.data.me.resetValues(); });
		S('#BT_Submit').on('click',{me:this},function(e){ e.data.me.validateAndSumbit(); });
		S('#BT_Help').on('click',{me:this},function(e){ e.data.me.help(); });
		return this;
	};

	//###############################################################
	/**
	The control code for the input screen and its various elements  
	which are a mixture of HTML5.0 compatible XHTML4.0
	**/
	//###############################################################
	
	var images = {};
	function loadImage(key,src){
		images[key] = { 'img': new Image() };
		images[key].img.src = src;
	}

	loadImage('imgAngle','imgs/impactAngle.png');
	loadImage('imgAngleB','imgs/impactAngleB.png');
	loadImage('leftArrow','imgs/arrowL.png');
	loadImage('rightArrow','imgs/arrowR.png');
	loadImage('pjd1','imgs/pjd1.jpg');
	loadImage('pjd2','imgs/pjd2.jpg');
	loadImage('pjd3','imgs/pjd3.jpg');
	loadImage('pjd4','imgs/pjd4.jpg');
	loadImage('imgBlank','imgs/blank.png');

	loadImage('tgd1','imgs/tgd1.jpg');
	loadImage('tgd2','imgs/tgd2.jpg');
	loadImage('tgd3','imgs/water.jpg');
	loadImage('mntn','imgs/water.jpg');
	loadImage('refl','imgs/water_u3.jpg');
	
	// Dynamically build array of speed images.
	var speedImgs = new Array();
	for (var i = 0; i <= 9; i++){
		var img = new Image();
		img.src = 'imgs/n' + i + '.png'; 
		speedImgs[i] = img;
	}

	loadImage('speedNeedle','imgs/speedNeedle1.png');
	loadImage('speedo','imgs/speedo.png');

	var input_error_title;
	var input_error_diam;
	var input_error_angle;
	var input_error_vel;
	var input_error_pjd;
	var input_error_tgd;
	var input_error_water;
	var help_title;
	var help_text;
	var help_text2;

	//==============================================
	// Called at the start to prepare the view for 
	// display
	CraterImpact.prototype.prepareView = function(){
	
		this.updateVelocity(); 
		this.updateAngle();  
		this.updateDiameter();
		this.updateWater();

		return this;
	}

	//===============================================
	// Called when the distance slider is moved to a new 
	// value.
	CraterImpact.prototype.updateDistance = function(e){
		if(!e) e = S('#ImpactDistance').attr('value');
		if(isNaN(e)) e = 0;
		this.values.dist = parseFloat(e);
		S('#DistanceAMT').html(this.values.dist +'&thinsp;km');
	}
	
	//==============================================
	// Called when the diameter slider is moved to a new 
	// value.
	CraterImpact.prototype.updateDiameter = function(e){
		if(!e) e = S('#ProjectileSize').attr('value');
		if(isNaN(e)) e = 0;
		// Set global value
		this.values.diam = parseFloat(e);
		
		// Update displayed value
		S('#ProjectileValue').html(this.values.diam + '&thinsp;m');
		
		var dv = this.values.diam/10;
		var s = dv/this.scaling;
		
		S('#Projectile_Img').css({'height':s+'px','width':s+'px','top':(159/2 - s/2)+'px'})

		DrawDiameterLine(s,131);
		return this;
	}

	//================================================
	// Draws the diameter lines for the Asteroid diameter.
	function DrawDiameterLine(width,cX,scaling){
		var c=document.getElementById("ProjectileWidth");
		var ctx=c.getContext("2d");

		canvasReset(ctx,c);

		var L = c.width/2 - width/2;
		var E = c.width/2 + width/2;

		ctx.moveTo(L,6.5);
		ctx.lineTo(E,6.5);

		ctx.lineWidth = 5;
		ctx.stroke();
		ctx.drawImage(images.leftArrow.img, L-10, 0);
		ctx.drawImage(images.rightArrow.img, E-3, 0);
	}

	//===============================================
	/**
	Resets a canvas clearing any path lines or images 
	presented. Any transforms are cleared then restored 
	so that the clearRect command does not itself become 
	transformed.
	**/
	function canvasReset(ctx, canvas){
		// Store the current transformation matrix
		ctx.save();

		// Use the identity matrix while clearing the canvas
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.beginPath();

		// Restore the transform
		ctx.restore();
	}

	//=================================================
	// Called when the angle slider is moved to a new 
	// value.
	CraterImpact.prototype.updateAngle = function(e){
		if(!e) e = S('#ProjectileAngle').attr('value');
		if(isNaN(e)) e = 90;
		this.log('updateAngle',e)
		var angleVal = parseFloat(e);
		var angleValI = 90 - angleVal; //Invert value

		var c = document.getElementById("Angle");
		var ctx = c.getContext("2d");
		
		canvasReset(ctx,c);
		 
		ctx.save();
		ctx.translate(79,104);//translate to where pivot point is
		 
		//Convert degrees to radian 
		var rad = angleValI * Math.PI / 180;
		ctx.rotate(rad);//rotate context
		 
		ctx.drawImage(images.imgAngle.img,-7,-85);//draw image

		ctx.translate(-79, -104);//translate back
		ctx.restore();//restore state
		
		ctx.drawImage(images.imgAngleB.img, 55,104);//draw image
		
		ctx.font = '14pt Arial';
		
		if (angleVal >= 10) ctx.fillText(htmlEncode(angleVal+'&deg;'), 125, 40);
		else ctx.fillText(''+angleVal, 130, 40);
		
		this.values.traj = angleVal;
		return this;
	}
	//==============================================
	// Encode some HTML and get the resulting string
	function htmlEncode(txt){
		var span = document.createElement('div');
		span.innerHTML = txt;
		return span.innerHTML;
	}
	//==============================================
	// Called when the velocity slider is moved to a new 
	// value.
	CraterImpact.prototype.updateVelocity = function(e){
		if(!e) e = S('#ProjectileVelocity').attr('value');
		if(isNaN(e)) e = 0;
		this.values.velo = parseFloat(e);
		
		var c = document.getElementById("Speedo");
		var ctx = c.getContext("2d");
		var r = 60 + this.values.velo*3;
	
		ctx.drawImage(images.speedo.img,0,0);
		
		// Split speed into two values.
		var str = "" + this.values.velo;
		var n1 = str.charAt(0);
		
		var img;
		if(str.length > 1){
			img = speedImgs[parseInt(n1)];
			//if(n1 != 9)
			ctx.drawImage(img,63,105);
			var n2 = str.charAt(1);
			img = speedImgs[parseInt(n2)];
			//if(n2 != 9)
			ctx.drawImage(img,73,105);
		}else{
			img = speedImgs[parseInt(n1)];
			//if(n1 != 9)
			ctx.drawImage(img,68,105);
		}
		
		drawImageRot(images.speedNeedle.img,62,66,32,64,r,ctx);
		ctx.restore();
		return this;
	}

	//============================================
	// Parse the XML for this page
	CraterImpact.prototype.updateLanguage = function(){

		this.log('updateLanguage');
			
		var x = this.str('inputs');
		S('#AppTitle span').html(this.delim+x);
		S("#Title").html(x);

		x = this.str('lblValue');
		S("#Slider1_Text").html(x);
		S("#Slider2_Text").html(x);
		S("#Slider3_Text").html(x);
		S("#Slider4_Text").html(x);

		S("#Slider5_Text").html(this.str('lblDistance'));
		S("#titleProjectile").html(this.str('lblAstDiam'));
		S("#titleAngle").html(this.str('lbPjAng'));
		S("#titleVelocity").html(this.str('lbPjVel'));
		S("#titlePJDensity").html(this.str('lbPjDens'));
		S("#titleTGDensity").html(this.str('lbTgDens'));
		S("#BT_Reset").html(this.str('btReset'));
		S("#BT_Submit").html(this.str('btSubmit'));

		x = this.str('lblSelect');
		S("#pjd_op0").html(x);
		S("#tgd_op0").html(x);

		S("#pjd_op1").html(this.str('lblIce'));
		S("#pjd_op2").html(this.str('lblPorRock'));
		S("#pjd_op3").html(this.str('lblDensRock'));
		S("#pjd_op4").html(this.str('lblIron'));

		S("#tgd_op1").html(this.str('lblWater'));
		S("#tgd_op2").html(this.str('lblSedRock'));
		S("#tgd_op3").html(this.str('lblIgRock'));

		help_title = this.str('help_title');
		help_text = this.str('help_text');
		help_text2=  this.str('help_text2');

		input_error_title = this.str('input_error_title');
		input_error_diam = this.str('input_error_diam');
		input_error_angle = this.str('input_error_angle');
		input_error_vel = this.str('input_error_vel');
		input_error_pjd = this.str('input_error_pjd');
		input_error_tgd = this.str('input_error_tgd');
		input_error_water = this.str('input_error_water');
		
		return this;
	}
	//==============================================
	/**
	 Rotate an item on a canvas using rotate transforms.
	 @param img The image to rotate.
	 @param x The x coordinate of the image,
	 @param y The y coordinate of the image,
	 @param width The width of the image,
	 @param height The height of the image,
	 @param deg The rotation amount in degrees,
	 @param ctx The context on which to put the image.
	 */
	function drawImageRot(img,x,y,width,height, deg,ctx){

		//Convert degrees to radian 
		var rad = deg * Math.PI / 180;

		//Set the origin to the center of the image
		ctx.translate(x + width / 2, (y + height / 2)-20);

		//Rotate the canvas around the origin
		ctx.rotate(rad);

		//draw the image    
		ctx.drawImage(img,width / 2 * (-1),((height / 2)-18) * (-1),width,height);

		//reset the canvas  
		ctx.rotate(rad * ( -1 ) );
		ctx.translate((x + width / 2) * (-1), ((y + height / 2)-20) * (-1));
		
	}

	//=============================================
	// Called when the target density list is selected.
	CraterImpact.prototype.selectTgDensity = function(tgList){
		var idx = (typeof tgList==="number" ? tgList : tgList.selectedIndex);
		var tgImg =document.getElementById("TargetImage");
		this.log('selectTgDensity',idx,tgList);

		switch(idx){
			case 1:
				S('#TargetFeature').css({'display':"none"});
				S('#WaterFeature').css({'display':"block"});
				this.updateWater();
				tgImg.src = images.tgd3.img.src;
				break;
			case 2:
				S('#TargetFeature').css({'display':"block"});
				S('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd1.img.src;
				break;
			case 3:
				S('#TargetFeature').css({'display':"block"});
				S('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd2.img.src;
				break;
			default:
				tgImg.src = images.imgBlank.img.src;
		}
		this.values.tjd = idx;
		return this;
	}

	CraterImpact.prototype.selectTgDensityMarsMoon = function(tgList){
		var idx = (typeof tgList==="number" ? tgList : tgList.selectedIndex);
		var tgImg = document.getElementById("TargetImage");
		this.log('selectTgDensityMarsMoon',idx,tgList);

		switch(idx){
				case 1:
				S('#TargetFeature').css({'display':"block"});
				S('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd2.img.src;
				break;
	
			default:
				tgImg.src = images.imgBlank.img.src;
		}
		
		this.values.tjd = 3;
		return this;
	}
	 
	//=============================================
	// Called when the target density list is selected.
	CraterImpact.prototype.selectTgDensity2 = function(x){
		var idx = x;
		var tgImg = document.getElementById("TargetImage");

		switch(idx){
			case 1:
				S('#TargetFeature').css({'display':"none"});
				S('#WaterFeature').css({'display':"block"});
				this.updateWater();
				tgImg.src = images.tgd3.img.src;
				break;
			case 2:
				S('#TargetFeature').css({'display':"block"});
				S('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd1.img.src;
				break;
			case 3:
				S('#TargetFeature').css({'display':"block"});
				S('#WaterFeature').css({'display':"none"});
				tgImg.src = images.tgd2.img.src;
				break;
			default:
				tgImg.src = images.imgBlank.img.src;
		}
		
		this.values.tjd = idx;
		return this;
	}

	//=============================================
	// Called when the target density list is selected.
	CraterImpact.prototype.selectPjDensity = function(pjList){
		var idx = (typeof pjList==="number" ? pjList : pjList.selectedIndex);
		var pjImg = document.getElementById("ProjectileImage");
		this.log('selectPjDensity',idx)
 
		switch(idx){
			case 1:
				pjImg.src = images.pjd1.img.src;
				break;
			case 2:
				pjImg.src = images.pjd2.img.src;
				break;
			case 3:
				pjImg.src = images.pjd3.img.src;
				break;
			case 4:
				pjImg.src = images.pjd4.img.src;
				break;
			default:
				pjImg.src = images.imgBlank.img.src;
		}
		
		this.values.pjd = idx;
		return this;
	}
	 
	//=============================================
	// Whe the water slider has been moved.
	CraterImpact.prototype.updateWater = function(e){
		if(!e) e = S('#WaterDepth').attr('value');
		this.values.wlvl = parseFloat(e);
		var level = this.values.wlvl/20;

		var c = document.getElementById("WaterVis");
		var ctx = c.getContext("2d");
		
		var val = (level)-13;
		
		ctx.drawImage(images.mntn.img, 0,0);
				
		var clp = 278-level;
		
		ctx.drawImage(images.refl.img, 0, level, 343, clp, 0, clp-155, 343, clp);
		
		ctx.font = '600 12pt Arial';
		
		ctx.fillText(this.values.wlvl+"m", 280, 24);
		
		return this;
	 }
	 
	//=============================================
	// Validate the entry
	CraterImpact.prototype.validateAndSumbit = function(){
		var passed = true;
		var msg = "";
	
		if(this.values.diameter <= 0){
			msg += "<li>" + this.str("input_error_diam") + "</li>";
			passed = false;
		}
		
		if(this.values.traj <= 0){
			msg += "<li>" + this.str("input_error_angle") + "</li>";
			passed = false;
		}
		
		if(this.values.velo <= 0){
			msg +="<li>" + this.str("input_error_vel") + "</li>";
			passed = false;
		}
		
		if(this.values.pjd <= 0){
			msg+= "<li>" + this.str("input_error_pjd") + "</li>";
			passed = false;
		}
		
		if(this.values.tjd <= 0){
			msg += "<li>" + this.str("input_error_tgd") + "</li>";
			passed = false;
		}
		
		if(this.values.tjd == 1 && this.values.wlvl <= 0){
			passed = false;
			msg +="<li>" + this.str("input_error_water") + "</li>";
		}
		
		if(passed == false){
			S('#dialog_text').html("<ul>" + msg + "</ul>");
			S('#validation').css({'display':'block'});
			S("#validation .title").html(input_error_title); 
			this.resize();
		}else{
			window.location = "results.html?lang=" + this.lang +"&dist=" +"&planet=" + this.values.planet +"&dist=" + this.values.dist +"&diam=" + this.values.diam + "&traj=" + this.values.traj + "&velo=" + this.values.velo + "&pjd=" + this.values.pjd + "&tjd=" + this.values.tjd + "&wlvl=" + this.values.wlvl;
		}
	}
	
	//============================================
	// Display the help window.
	CraterImpact.prototype.help = function(){
		S("#help .title").html(this.str("help_title")); 
		S('#dialog_text2').html(this.str("help_text") + "<br/><br/>" + this.str("help_text2"));
		S('#help').css({'display':'block'});
		this.resize();
		return this;
	}
	
	//==============================================
	// Resets all the input fields and globals.
	CraterImpact.prototype.resetValues = function(){
		this.log('resetValues');

		// Reset values to defaults		
		for(var v in this.defaults) this.values[v] = this.defaults[v];
		
		S("#cpPjDens").e[0].selectedIndex = 0;
		S("#cpTgDens").e[0].selectedIndex = 0;

		S('#TargetFeature').css({'display':"block"});
		S('#WaterFeature').css({'display':"none"});
		
		this.updateControls();

		return this;
	}

	//============================================
	// Set all the control values
	CraterImpact.prototype.updateControls = function(){
	
		this.log('updateControls');

		S("#ImpactDistance").attr("value", this.values.dist).trigger('change');
		S("#ProjectileSize").attr("value", this.values.diam).trigger('change');
		S("#ProjectileAngle").attr("value", this.values.traj).trigger('change');
		S("#ProjectileVelocity").attr("value", this.values.velo).trigger('change');
		S("#WaterDepth").attr("value", this.values.wlvl).trigger('change');
		S("#cpPjDens").attr('value', this.values.pjd).trigger('change'); 
		S("#cpTgDens").attr('value', this.values.tjd).trigger('change');

		if(this.values.pjd) S('#cpPjDens option:eq('+(this.values.pjd)+')').attr('selected','selected');
		if(this.values.tjd) S('#cpTgDens option:eq('+(this.values.tjd)+')').attr('selected','selected');
		this.selectTgDensity(parseInt(this.values.tjd));
		this.selectPjDensity(parseInt(this.values.pjd));
		
		return this;
	}


	//============================================
	// To pre select values in a combo box.
	// @param s The combo box to select.
	// @param i The index to select;
	function setSelectedIndex(s, i){
		s.options[i-1].selected = true;
		return;
	}
	
})(S);	// Self-closing function