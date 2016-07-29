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
			StrandTraits.LightDomGettable
		],

		listeners: {
			'changed':'_test'
		},

		properties: {
			message:{
				type:String,
				value:"This field contains a validation error"
			},
			whitespace:{
				type:String,
				value:"",
				reflectToAttribute:true
			}
		},

		_test: function() { console.log('value changed',this.value)}

	});

})(window.Strand = window.Strand || {});
