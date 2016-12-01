/**
 * @license
 * Copyright (c) 2016 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/
(function (scope) {

	scope.ScrollbarCanvas = Polymer({
		is: "strand-scrollbar-canvas",

		behaviors: [
			StrandTraits.Refable
		],

		properties: {
			direction:{
				type:String,
				value:'vertical'
			},
			target:{
				
			}
		}

	});

})(window.Strand = window.Strand || {});
