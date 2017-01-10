/**
 * @license
 * Copyright (c) 2015 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/

(function (scope) {
	var Measure = StrandLib.Measure;

	scope.ListItem = Polymer({

		is: "strand-list-item",

		behaviors: [
			StrandTraits.Resolvable,
			StrandTraits.DomMutable,
			StrandTraits.Refable
		],

		properties: {
			selected: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				notify: true
			},
			highlighted: {
				type: Boolean,
				value: false,
				reflectToAttribute: true,
				notify: true,
			},
			observeSubtree: {
				value:true
			},
			observeCharacterData: {
				value:true
			},
			title: {
				type:String,
				value:null,
				reflectToAttribute: true
			},
			value: {
				type: String,
				value: false
			},
			// TODO: Causing inifinite loop... no ideas
			// See dropdown, where this gets set
			showPlaceholder: {
				type: Boolean,
				value: false,
				observer: '_showPlaceholderChanged'
			},
			randomWidth: {
				type: String,
				value: function(){
					return this._setRandomWidth();
				}
			}
		},

		listeners:{
			"added":"_updateTitleHandler",
			"removed":"_updateTitleHandler",
			"modified":"_updateTitleHandler",
			"mouseover":"_updateTitleHandler"
		},

		// attached: function () {
		// 	this.debounce("update-title",this.updateTitle,0);
		// },

		_updateTitleHandler: function() {
			this.debounce("update-title",this.updateTitle,0);
		},

		_setRandomWidth: function() {
			var n = 0.5;
			var width = Math.random() * (1.0 - n) + n;
			return String(Math.round(width*100) + "%");
		},

		_showPlaceholderChanged: function(newVal, oldVal) {
			console.log('_showPlaceholderChanged :: newVal: ', newVal, ' ', 'oldVal: ', oldVal);
		},

		_getStrandHighlightText: function() {
			var nodes = this.getEffectiveChildren();
			var highlight = nodes.filter(function(item) {
				return item.tagName && item.tagName.toLowerCase() === 'strand-highlight'
			})[0];
			
			if (highlight) {
				return highlight.text;
			} else {
				return false;
			}
		},

		updateTitle: function() {
			var m = StrandLib.Measure;
			var t = this._getStrandHighlightText() || this.textContent;
			var computed = m.textWidth(this, t);
			var actual = m.getBoundingClientRect(this).width - Measure.getPaddingWidth(this);
			if (computed > actual) {
				var txt = t.trim();
				if (this.title !== txt)
					this.title = txt;
			} else {
				this.title = null;
			}
		}

	});
})(window.Strand = window.Strand || {});
