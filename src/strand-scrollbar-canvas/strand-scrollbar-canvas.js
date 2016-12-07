/**
 * @license
 * Copyright (c) 2016 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/
(function (scope) {

	var Measure = StrandLib.Measure;
	var Rectangle = StrandLib.Rectangle;

	scope.ScrollbarCanvas = Polymer({
		is: "strand-scrollbar-canvas",

		behaviors: [
			StrandTraits.Refable,
			StrandTraits.DomMutable
		],

		properties: {
			VERTICAL:'vertical',
			HORIZONTAL:'horizontal',
			direction:{
				type:String,
				value:'vertical',
				observer:'_updateDirection'
			},
			target:{
				type:Object,
				observer:'_targetChanged'
			},
			observeSubtree:{
				value: true,
			},
			observeCharacterData: {
				value: true
			},
			observeAttributes:{
				value: true
			},
			ctx:{
				type:Object
			},
			nub:{
				type:Rectangle,
			}
		},

		ready: function() {
			this.ctx = this.$.canvas.context;
			this.nub = new Rectangle(0, 0, 100, 100);
			// this.nub.toCanvas(this.ctx);
			this.nub.toCanvasRounded(this.ctx, 0);
		},

		_targetChanged: function() {
			this.mutationTarget = this.target;
		},

		_updateDirection: function() {
			if (this.direction === this.VERTICAL) {
				this._height = target.offsetHeight;
				// this.width = 'auto';
			} else if (this.direction === this.HORIZONTAL) {
				this._width = target.offsetWidth;
				// this.height = 'auto';
			}
		},

		_measureTarget: function() {
			
			var rect = Measure.getBoundingClientRect(this.target);

			if (this.direction === this.VERTICAL) {
				this._height = rect.height;
				this._width = '100%';
			} else if (this.direction === this.HORIZONTAL) {
				this._width = rect.width;
				this._height = '100%';
			}
		}

	});

})(window.Strand = window.Strand || {});
