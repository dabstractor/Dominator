if (typeof Techknow == 'undefined') {
	var Techknow = {};
}
Techknow.Helpers = (function(){

	/* Helper Functions
	 */
	 var Helpers = {};

	 Helpers.getTopParent = function(obj) {
	 	while (
	 			typeof obj.hasParent == "function"
	 		&& 	typeof obj.getParent == "function"
	 		&&  obj.hasParent()
	 	) { obj = obj.getParent(); }
	 	return obj;
	 }

	 Helpers.emptyfn = function() {};

	 Helpers.safeCopy = function(item) {
	 	if (typeof item == 'object') {
	 		if (item instanceof Array) {
	 			return item.slice();
	 		} else {
	 			var newItem = {};
	 			for (var i in item) {
		 			if (item.hasOwnProperty(i)) {
		 				newItem[i] = Helpers.safeCopy(item[i]);
		 			}
	 			}
	 		}
	 	}
	 	return item;
	 }

	 Helpers.flatMerge = function() {
		var args = Helpers.safeCopy(Array.prototype.slice.call(arguments));
		var final = Helpers.safeCopy(args.pop()) || {};
	 	while (args.length >= 1) {
	 		var arg = Helpers.safeCopy(args.pop());
	 		for (var i in arg) {
 				final[i] = Helpers.safeCopy(arg[i]);
	 		}
	 	}
	 	return final;
	 };


	Helpers.getWhatBy = function( what, prop, id, obj ) { // helper fn to find any property of any obj by any unique id
	 	obj = obj || this; // you can use this with .call() or by passing a ref to the object in
	 	var index = Helpers.getIndexOfWhatBy( what, prop, id, obj ); // could have said getIndexOfWhatBy.apply( this, args ) but this way is easier to read
	 	return obj[what][index] || false; // if index doesn't exist, that means it's set to false
	};

	Helpers.getIndexOfWhatBy = function( what, prop, id, obj ) { 
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		// this function relies on the programmer retaining a reference to the original object
		// ecma 6 will have .findIndex() that does what we want without a reference, but for now we'll settle
		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		obj = obj || this; // you can use this with .call() or by passing a ref to the object in
		switch ( typeof prop ) {
			case "number": // if prop is a number, that means the end user only specified an index, so just return that index. this is a convenience feature that prevents us from writing a ton of different functions
			return prop;
			case "object": // if it's an array,  we can use .indexOf but we'll need a fallback for objects, or be strict about remembering to 
				var i = obj[what].indexOf(prop);
					return i;
			break;
			case "string" :
				for ( var i=0;i<obj[what].length;i++ ) {
					if ( obj[what][i][prop] === id ) {
						return i;
					}
				}
			return null; // nothing was returned, so let's go home empty-handed
		}
	}

	Helpers.uid = function() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
			  .toString(16)
			  .substring(1);
		}
		return s4() + s4();
	}
	
	RegExp.escape = function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	};	


	return Helpers;
})();

 $.fn.parseNode = function() { // this builds a Dominator-style node object from any dom node
 	if (typeof this[0].attributes == "undefined") {
 		console.error("This does not appear to be a DOM element");
 		return null;
 	}
 	var attributes = this[0].attributes,
 		node = {
 			tag: this[0].tagName.toLowerCase(),
 			attr: {},
 			// styles: this.getAllStyles(),
 			listeners: {},
 			children: [],
 			text: null
 		};

	 	for (var i in attributes) {
	 		if (attributes.hasOwnProperty(i)) {
	 			node.attr[attributes[i].name] = attributes[i].value;
	 		}
	 	}

	 	node.text = this.text().trim();

	 	this.children().each(function() {
	 		node.children.push($(this).parseNode());
	 	});

 	return node;
 }

/*
 */
 $.fn.getAllStyles = function() { // I got this from stackoverflow, gonna make it my bitch
 	var styles = {};
 	var styleChunks = this.css("cssText").split(";");
 	for ( var i = 0; i < styleChunks.length; i++ ) {
 		var split = styleChunks[i].split(":");
 		if ( split[0] && split[1] )
	 		styles[split[0].trim()] = split[1].trim();
 	}
    return styles;
 }


 Techknow.Dominator = (function(){

	/* Dominator Class -- for extension only
	 * used by declaring Class.prototype = new Dominator;
	 * only reason I'm doing this is to keep my code extra dry --
	 * I'm just extrapolating common functionality
	 */
	 var Dominator = function(obj) {
		// do as little as possible here, then call init. We want init to be called by the child class once defaults are applied
		obj = obj || {};
		this.init(obj);
	 }

	/* Dominator init
	 *
	 */
	 Dominator.prototype.init = function(obj) {

	 	obj = obj || {};
		var track = (typeof arguments[1] == "undefined") ? true : arguments[1]; // optional second parameter says whether or not to tag this element

		console.log( "this.defaultConfig.structure:", this.defaultConfig.structure );
		// this.structure = obj.structure;
		this.structure = Techknow.Helpers.flatMerge( obj.structure || obj.children, this.defaultConfig.structure || [] );
		this.styles    = Techknow.Helpers.flatMerge( obj.styles, this.defaultConfig.styles || {} );
		this.insert    = Techknow.Helpers.flatMerge( obj.insert, this.defaultConfig.insert || {});
		this.attr      = Techknow.Helpers.flatMerge( obj.attr, this.defaultConfig.attr || {});
		this.onOpen    = this.onOpen || Techknow.Helpers.emptyfn;
		this.onClose   = this.onClose || Techknow.Helpers.emptyfn;
	 	this.uid       = track ? Techknow.Helpers.uid() : 0;

	 	// These properties exist in this layer for station positioning purposes.
		this.my              = obj.my		|| this.defaultConfig.my;
		this.at              = obj.at 	 	|| this.defaultConfig.at;
		this.moveLeft		 = obj.moveLeft || this.defaultConfig.moveLeft;			
		this.moveTop		 = obj.moveTop  || this.defaultConfig.moveTop;					
		this.target          = obj.target	|| obj.refid    || this.defaultConfig.target;


	 	if ( track ) {
		   	for (var tag in this.structure) {
		 		this.structure[tag].attr = Techknow.Helpers.flatMerge(
		 			{ "data-techknow-id": this.uid },
		 			this.structure[tag].attr || {}
				);
		 	} 
	 	}
		// do all the setup stuff here
	 }

	/* Helpers.buildNode -- helper function
	 * @param structure - an object that represents a node (set) to be built
	 *				-- it takes a tag name as a key, and just three possible properties, all of them flat objects (key/value pairs):
	 *				-- attr, styles, children
	 *
	 * @param multi - optional second parameter that is designed to be used internall
	 *				-- we only want the main function call to return
	 *				-- a singular element in most cases, but we want all of its child processes
	 *				-- to return all of their properties, not just 1 (running same fn recursively)
	 */
	 Dominator.prototype.buildNode = function(multi,self) { //reusable recursive function to go with helpers
	 	var self = self || this;
	 	var selfClosers = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"] ;
	 	var isSelfClosing = false;
		// builds out jquery structure with attributes specified from multidimensional object structured just like sassquatch -- simple!
		// accepts array
		// returns array
		// optional second parameter that is designed to be used internally.
		// the idea here is that we only want the main function call to return
		// a singular element in most cases, but we want all of its children
		// to return all of their properties, not just 1 (running same fn recursively)

		var structure = this.structure || this.children || [];
		var elems = []; // container for elements generated

		// loop throug the main structure array, just in case we want to pass multiple items to inert into the same base scope
		for ( var i = 0; i < structure.length; i++ ) {
			for (var j = 0; j < selfClosers.length;j++) { // check to make sure it's not a tag that should self-close
				isSelfClosing = ( structure[i].tag == selfClosers[j] ) ? true : isSelfClosing;
			}
			if (isSelfClosing) var $elem = jQuery("<" + structure[i].tag + " />"); // make it a self-closer if it's supposed to be
			else var $elem = jQuery("<" + structure[i].tag + "></" + structure[i].tag + ">") // build the jquery tag we're working with at this level of recursion $elem.attr(attr).css(styles);

			$elem.css(structure[i].styles || {}).attr(structure[i].attr || {}); // set its attributes and styles

			if ( typeof structure[i].text == "string" && structure[i].text.trim().length > 0 ) {
				$elem.text(structure[i].text);
			}
			
			if ( typeof structure[i].listeners == "object" ) {
				// let's build out some listeners...
				for (var j in structure[i].listeners) { // this whole loop can be extrapolated to another function if we choose
					var listener = structure[i].listeners[j]
					var data = (typeof listener.data == "string" || !listener.data)
						? eval(listener.data || "self")
						: listener.data;

					$elem.listen(
						(listener.event || "click") + " " + this.uid + " ", // tack on the uid so we can look it up -- this is sort of a hack but I don't see why it won't work
						listener.target || null,
						data            || self,
						listener.action || function() {}
					);
				}
			}

			if ( structure[i].children instanceof Array ) {
				var subNode = Dominator.prototype.buildNode.call({structure:structure[i].children},true,self);
				for ( var j = 0; j <= subNode.length; j++ ) {
					$(subNode[j]).appendTo($elem);
				}
			}

			elems.push( $elem );

		}
		return elems.length == 1 ? elems[0] : elems;
	 }


	 /**************************** Dominator.position ************************************
	 *
	 * Type 	 :  Method
	 *
	 * Objective : Positions the node based on the My and At property 
	 *
	 ***********************************************************************/
	 Dominator.prototype.position = function( obj ){

	 	if(!(this.my && this.at)) return;
	 	obj = obj || {};

 		//graceful fallback
 		this.my       = obj.my 		 || this.my;
 		this.at       = obj.at 		 || this.at;
 		this.moveLeft = obj.moveLeft || this.moveLeft;
 		this.moveTop  = obj.moveTop  || this.moveTop;
 		this.target   = obj.target   || this.target;

 		var my       = this.my;
 		var at       = this.at;
 		var moveLeft = this.moveLeft;
 		var moveTop  = this.moveTop;
 		var target   = this.target;

	 	// dialog
	 	var $this        = this.getDomInstance();
	 	
	 	$this.style.left = 0; // we can't assume that it has never been positioned before
	 	$this.style.top  = 0;

	 	var dialogLeft   = $this.offsetLeft;
	 	var dialogTop    = $this.offsetTop;
			 	
	 	// target
	 	var $target    = jQuery(target)[0];
	 	var targetLeft = $target.offsetLeft;
	 	var targetTop  = $target.offsetTop;

	 	// Nailed the Left
	 	$this.style.left = targetLeft		// from the target's left side,
	 		+ ( $target.clientWidth * (at[0]/100) )  // add the given percentage of the target's width, then
	 		- ( $this.clientWidth * (my[0]/100) )	 // subtract the given percentage of the station's width, and
	 		- dialogLeft
	 		+ moveLeft;						// don't forget to subtract our original offset.

		var hidden = $this.hidden;

	 	$this.style.top = targetTop	 // do the same for the top
		 	+ ( $target.clientHeight * (at[1]/100) )
		 	- ( $this.clientHeight * (my[1]/100) )
		 	- dialogTop
		 	+ moveTop;
	 }

	
	
	 Dominator.prototype.render = function() {

	 	this.destroy();
		var elems = this.buildNode();

		//handle where to insert
		$.fn.emptyfn = Techknow.Helpers.emptyfn;
		var action = "emptyfn";
		var target = "";

		for (var i in this.insert) {
			switch (i) {
				case "into" 		: action = "appendTo"; break;
				case "after" 		: action = "insertAfter"; break;
				case "before" 		: action = "insertBefore"; break;
				case "atTheStartOf" : action = "prependTo"; break;
				case "atTheEndOf" 	: action = "appendTo"; break;
			}
			target = this.insert[i];
			break;
		}
		for ( var i = 0; i < elems.length; i++ ) {
			// elems[i][0].hidden = true;
			jQuery.fn[action].call( $(elems[i]), target ); // call appropriate function
		}



		//end insert stuff
		this.onOpen();
		// this.position();

		var el = this.getDomInstance();

		if (typeof el != 'undefined') {
			el.hidden = false;
		}

		return this;
	 }


	

	
	 Dominator.prototype.destroy = function() {
	 	jQuery("html").findByListener(this.uid).neglect();
	 	jQuery(this.getDomInstance()).remove();
	 }

	 Dominator.prototype.getSelector = function() {
	 	return '[data-techknow-id="' + this.uid + '"]';
	 }

	 Dominator.prototype.getDomInstance = function() {
		return jQuery(this.getSelector())[0];
	 }

	 Dominator.prototype.defaultConfig = {

 		insert: {
	 		into: 'body',
 		},
	 	structure: [
	 	{
	 		tag: 'div',
	 		attr: {
	 			class: 'dominator'
	 		},
	 	}],
		styles: {},
 		attr: {},
		my: null,
		at: null,

	 }
	
	return Dominator;

})();
