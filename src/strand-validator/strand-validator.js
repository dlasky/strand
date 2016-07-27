/**
 * @license
 * Copyright (c) 2016 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/
(function (scope) {

	scope.Validator = Polymer({
		is: "strand-validator",

		behaviors: [
			StrandTraits.Refable,
			StrandTraits.Validatable,
			StrandTraits.DomGettable
		],

		properties: {
			message:{
				type:String,
				value:""
			},
			whitespace:{
				type:String,
				value:"",
				reflectToAttribute:true
			}
		}

	});

})(window.Strand = window.Strand || {});
