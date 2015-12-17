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

function DataProvider(){

	
	this.LANGUAGE_UK = "uk";/**For UK locale**/
	this.LANGUAGE_DE = "de";/**For German locale**/
	this.LANGUAGE_FR = "fr";/**For French locale**/
	this.LANGUAGE_PL = "pl";/**For Polish locale**/
	this.LANGUAGE_SP = "sp";/**For Spanish locale**/
	this.LANGUAGE_CY = "cy";/**For Welsh locale**/
	
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

	this.set = function set(key,value){
		this[key] = value;
	}


	/**
	 * Sets the projectile density selected index.
	 * @return A value.
	 */
	this.getCbPjDens = getCbPjDens;
	function getCbPjDens(){ return this.cbPjDens; }

	/**
	 * Gets the target density selected index.
	 * @return An  value.
	 */
	this.getCbTgDens = getCbTgDens;
	function getCbTgDens() {
		return this.cbTgDens;
	}


	/**
	 * Gets the selected depth for when water is the target.
	 * @return Stored as an eger.
	 */
	this.getSlTgDepth = getSlTgDepth;
	function  getSlTgDepth() {
		return this.slTgDepth;
	}

	/**
	 * Gets the textual description of the damage caused by the impact.
	 * @return A description contained in a .
	 */
	 this.getTxtDamage = getTxtDamage;
	function  getTxtDamage() {
		return this.txtDamage;
	}

	/**
	 * Gets the textual description of the impact.
	 * @return A  containing the description.
	 */
	 this.getTxtImpactor = getTxtImpactor;
	function  getTxtImpactor() {
		return this.txtImpactor;
	}

	/**
	 * Gets the HashMap containing the titles and values of the data 
	 * originally input by the various UI elements of the application.
	 * @return The HashMap of inputs in title, value pairs.
	 */
	 this.getDgInputs = getDgInputs;
	function  getDgInputs() {
		return this.dgInputs;
	}


	/**
	 * Gets the HashMap contain the core calculated data about the
	 * impact. The data is stored in title, values pairs.
	 * @return The HashMap containing the data.
	 */
	 this.getDgOutputs = getDgOutputs;
	function getDgOutputs() {
		return this.dgOutputs;
	}


	/**
	 * Gets a HashMap of impact energy data. It is stored in title, value pairs.
	 * @return The HashMap containing the data.
	 */
	 this.getDgEnergy = getDgEnergy;
	function getDgEnergy() {
		return this.dgEnergy;
	}


	/**
	 * Gets the HashMap of the fire ball data which contastitle value pairs.
	 * @return The HashMap of fire ball data.
	 */
	 this.getDgFirevall = getDgFirevall;
	function getDgFirevall() {
		return this.dgFirevall;
	}

	/**
	 * Get the impactor model object 
	 * @return The impactor model object.
	 */
	 this.getImpactor = getImpactor;
	function getImpactor() {
		return this.impactor;
	}

	/**
	 * Get the selected projectile diameter
	 * @return
	 */
	 this.getProjDiam = getProjDiam;
	function  getProjDiam() {
		return this.projDiam;
	}


	/**
	 * Get the projectile angle.
	 * @return
	 */
	 this.getProjAngle = getProjAngle;
	function  getProjAngle() {
		return this.projAngle;
	}

	/**
	 * Get the projectile velocity.
	 * @return
	 */
	 this.getProjVel = getProjVel;
	function  getProjVel() {
		return this.projVel;
	}

	/**
	 * Get the distance from impact.
	 * @return
	 */
	 this.getImpactDist = getImpactDist;
	function  getImpactDist() {
		return this.impactDist;
	}

	/**
	 * Get the selected depth
	 * @return
	 */
	this.getCbSelectDepthObject = getCbSelectDepthObject;
	function  getCbSelectDepthObject() {
		return this.cbSelectDepthObject;
	}
	
	
	/**
	 * Gets the selected location id. The id is an eger that related to the selected place.
	 * @return The selected place type as an eger.
	 */
	this.getCbLocation = getCbLocation;
	function  getCbLocation() {
		return this.cbLocation;
	}

	
	/**
	 * Gets the he map latitude.
	 * @return A .
	 */
	 this.getLatitude = getLatitude;
	function  getLatitude() {
		return this.latitude;
	}


	/**
	 * Gets the map longitude.
	 * @return A .
	 */
	 this.getLongitude = getLongitude;
	function  getLongitude() {
		return this.longitude;
	}


	/**
	 * Though this method the back end will instruct the front end to display
	 * an alert with a title and alert text.
	 * @param desc The alert descriptive text.
	 * @param title The alert title.
	 */
	this.displayAlert = displayAlert;
	function displayAlert( desc,  title)
	{
		//Michael you need to code this bit to link this with
		//what ever UI you decide to build.
	}

	/**
	 * Gets the currently selected language instance.
	 * @return
	 */
	 this.getSelected_language = getSelected_language;
	function getSelected_language() {
		return this.selected_language;
	}

		
}//###########################################################################
