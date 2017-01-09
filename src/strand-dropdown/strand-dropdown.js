/**
 * @license
 * Copyright (c) 2015 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/
(function(scope) {

	var Rectangle = StrandLib.Rectangle,
		Measure = StrandLib.Measure,
		BehaviorUtils = StrandLib.BehaviorUtils;

	scope.Dropdown = Polymer({
		is: 'strand-dropdown',

		properties: {
			_scope: {
				type: Object,
				value: null
			},
			_panel: {
				type: Object,
				value: null
			},
			_itemRecycler: {
				type: Object,
				value: null
			},
			_target: {
				type: Object,
				value: null
			},
			_stackTarget: {
				type: Object,
				value: null
			},
			_type: {
				type: String,
				value: 'secondary'
			},
			disabled: {
				type: Boolean,
				value: false,
				reflectToAttribute: true
			},
			error: {
				type: Boolean,
				value: false,
			},
			fitparent: {
				type: Boolean,
				value: false
			},
			placeholder: {
				type: String,
				value: 'Select',
			},
			isLoading:{
				type:Boolean,
				notify: true,
				value: false
			},
			index: {
				type:Number,
				notify:true,
			},
			size: {
				type: String,
				reflectToAttribute: true
			},
			skinless: {
				type: Boolean,
				reflectToAttribute: true
			},
			initialValue: {
				type: Boolean,
				value: false
			},
			layout: {
				type: String,
				reflectToAttribute: true
			},
			data: {
				type: Array,
				notify: true,
				observer: '_dataChanged',
				value: null
			},
			value: {
				type: String,
				reflectToAttribute: true,
				notify: true,
				observer: '_valueChanged'
			},
			highlight:{
				type:String,
				notify:true,
				value:"",
				observer: '_highlightChanged'
			},
			maxItems: {
				type: Number,
				value: 10,
				observer: '_maxItemsChanged'
			},
			updateSelection:{
				type:Boolean,
				value:false
			}
		},

		behaviors: [
			StrandTraits.Resolvable,
			StrandTraits.Stylable,
			StrandTraits.KeySelectable,
			// StrandTraits.Selectable,
			StrandTraits.Stackable,
			StrandTraits.Jqueryable,
			StrandTraits.AutoTogglable,
			StrandTraits.PositionableDropdown,
			StrandTraits.Refable
		],

		observers: [
			"_checkSizing(data.length)",
		],

		listeners: {
			"itemRecycler.measuring-changed": "_checkSizing",
		},

		_searchSlot: null,
		_boundSearchSlotHandler: null,
		_widthLocked: false,
		LAYOUT_TYPE: 'dropdown',

		// created: function() {
		// },

		ready: function() {
			// Flag to suppress change events if an initial value is provided
			this.initialValue = this.hasAttribute('value');
			
			this._panel = this.$.panel;
			this._itemRecycler = this.$.itemRecycler;
			this._target = this.$.target;
			this._stackTarget = this.$.panel;
		},

		attached: function() {
			// ensure layout attribute on search field... this is stupid but no other way to
			// add layout attribute, cause 'slotchange' isn't supposed to fire when an instance is initialized
			// ...but apparantly DOES when the lightDOM is added to another instance
			this._searchSlot = this._searchSlot || this.shadowRoot.querySelector('#search');
			this._boundSearchSlotHandler = this._searchSlotChange.bind(this);
			this._searchSlot.addEventListener('slotchange', this._boundSearchSlotHandler);

			Polymer.RenderStatus.afterNextRender(this, function() {
		    	this._searchSlotChange();
			});
		},

		detached: function() {
			if (this._searchSlot && this._boundSearchSlotHandler) {
				this._searchSlot.removeEventListener('slotchange', this._boundSearchSlotHandler);
			}
		},

		_searchSlotChange: function(e) {
			// ensure we don't double set the layout due to slotchange getting caught
			var searchLightDOM = this._searchSlot.assignedNodes();
			var search = searchLightDOM[0];
			if (searchLightDOM.length && !search.layout) search.layout = this.LAYOUT_TYPE;
		},

		open: function(silent) {
			var inherited = BehaviorUtils.findSuper(StrandTraits.PositionableDropdown, 'open');

			// Ensures that we get a value for the offsetHeight of the distributed list items:
			if (this.maxItems) this._setMaxHeight(this.maxItems);
			if (!this._widthLocked) this._lockWidth();

			this.focus();
			inherited.apply(this, [silent]);
		},

		close: function(silent) {
			var inherited = BehaviorUtils.findSuper(StrandTraits.PositionableDropdown, "close");
			this._highlightedIndex = null;
			inherited.apply(this, [silent]);
		},

		reset: function() {
			this.value = null;
			this.selectedIndex = null;
			this._highlightedIndex = null;
			if(this.state === this.STATE_OPENED) this.close();
		},

		_selectItemByValue: function(value) {
			Polymer.RenderStatus.afterNextRender(this, function(){
				var valueStr = value.toString();
				var item = null;
				var index = null;

				if (!this._widthLocked) this._lockWidth();

				if (this.data) {
					item = this._getDataItemByValue(valueStr);
				} else {
					item = this._getDomByValue(valueStr);
				}

				if (item) index = this.items.indexOf(item); 
				if (index > -1 && index !== this.selectedIndex) this.selectedIndex = index;
			});
		},

		_updateSelectedItem: function(e) {
			var target = null;
			
			e.path.some(function(item, index){
				target = item;
				var tagName = item.tagName ? item.tagName : null;
				return tagName && tagName.toLowerCase() === 'strand-list-item';
			});

			var value = this._getValueFromDom(target).toString();
			
			var targetIndex = null;

			if (this.data) {
				targetIndex = this._getDataIndexFromDom(value);
			} else {
				targetIndex = this.items.indexOf(target);
			}

			if(targetIndex >= 0) {
				this.selectedIndex = targetIndex;
				if (this.state === this.STATE_OPENED) this.close();
			}
		},

		// Dom handling
		_getDomByValue: function(value) {
			return this.items.filter(function(node) {
				return node.getAttribute('value') === value || node.textContent.trim() === value;
			})[0];
		},

		_getValueFromDom: function(node) {
			return node.getAttribute('value') || node.textContent.trim();
		},

		_getDataIndexFromDom: function(value) {
			return this.data.indexOf(this._getDataItemByValue(value));
		},

		_getDataItemByValue: function(value) {
			return this.data.filter(function(item) {
				return item.name === value || item.value.toString() === value;
			})[0];
		},

		// Data handling
		_dataChanged: function(newData, oldData) {
			if (newData) {
				// reset selectedIndex for recycler scenarios
				if (this.updateSelection) {
					this.selectedIndex = null;
				} else {
					this.reset();
				}
			} else {
				// reset the GUI selection state but leave 'value' alone
				this.selectedIndex = null;
			}
		},

		_checkSizing: function () {
			if (this.data && this.data.length) {
				this.async(function () {
					this._setMaxHeight(this.maxItems);
				}, 1);
				//check to see if our value now has a match on the data array
				if (this.value && this.updateSelection) {
					this._selectItemByValue(this.value);
				}
			}
		},

		_highlightChanged: function() {
			this.notifyPath('ref.highlight', this.highlight);
		},

		// Getters
		get itemHeight() {
			var itemHeight = null;
			var items = this.items;

			if (this.items.length > 0) {
				if (!this.data) {
					itemHeight = this.items[0].offsetHeight;
				} else if (this._itemRecycler) {
					itemHeight = 0|this._itemRecycler.getHeightAtIndex(0);
				}
			}
	 		return itemHeight;
		},

		get buttonWidth() {
			return Rectangle.fromElement(this.$.target).width;
		},

		get paddingWidth() {
			return Measure.getPaddingWidth(this.$.target);
		},

		get borderWidth() {
			return Measure.getBorderWidth(this.$.target);
		},

		// General
		_valueChanged: function(newVal, oldVal) {
			if (newVal) {
				this._selectItemByValue(newVal);
			} else {
				this.reset();
			}
		},

		_selectedIndexChanged: function(newIndex, oldIndex) {
			var newIsNum = typeof newIndex === 'number';
			var oldIsNum = typeof oldIndex === 'number';
			var same = newIndex === oldIndex ? true : false;

			if (newIsNum && !same) {
				var newSelected = this.items[newIndex];
				var value = newSelected.value ? newSelected.value.toString() : newSelected.textContent.trim();
				var name = newSelected.name ? newSelected.name : newSelected.textContent.trim();

				this.value = value;
				this.error = false;

				if (this.data) {
					this.set('data.' + newIndex + '.selected', true);
				} else {
					newSelected.selected = true;
				}

				this.fire('selected', {
					item: newSelected,
					index: newIndex,
					value: value,
					name: name,
					selected: newSelected.selected
				});

				if (this.initialValue) {
					this.initialValue = false;
				} else {
					this.async(function() {
						this.fire("changed", { value:this.value });
					});
				}
			}

			if (oldIsNum && !same) {
				var oldSelected = this.items[oldIndex];

				if (this.data) {
					this.set('data.' + oldIndex + '.selected', false);
				} else {
					oldSelected.selected = false;
				}
			}

			if (this.state === this.STATE_OPENED) this.close();
		},

		_highlightedIndexChanged: function(newIndex, oldIndex) {
			var inherited = BehaviorUtils.findSuper(StrandTraits.KeySelectable, '_highlightedIndexChanged');
			if (typeof newIndex === 'number' && newIndex >= 0) {
				if (this.data) {
					this.set('data.' + newIndex + '.highlighted', true);
				} else {
					var item = this.items[newIndex];
					if (item) {
						item.setAttribute('highlighted', true);
						item.setAttribute('_keyselectable', true);
					}
				}
			}
			if (typeof oldIndex === 'number' && oldIndex >=0) {
				if (this.data) {
					this.set('data.' + oldIndex + '.highlighted', false);
				} else {
					var item = this.items[oldIndex];
					if (item) {
						item.removeAttribute('highlighted');
					}
				}
			}
			inherited.apply(this, [newIndex, oldIndex]);
		},

		_updateLabelText: function(selectedIndex, placeholder) {
			var label = this.placeholder;

			if (typeof selectedIndex === 'number') {
				var selectedItem = this.items[selectedIndex];

				label = this.data ? selectedItem.name : selectedItem.textContent.trim();
			}
			return label;
		},

		_updateTitle: function(selectedIndex) {
			if (typeof selectedIndex === 'number') {
				var selectedItem = this.items[selectedIndex];
				var title = '';

				if (selectedItem) {
					var availableArea = (this.buttonWidth + this.borderWidth) - this.paddingWidth,
						textBounds = Measure.getTextBounds(this.$.label);

					if(textBounds.width >= availableArea) {
						title = this.data ? selectedItem.name : selectedItem.textContent.trim();
					}
				}
				return title;
			}
		},

		_hideInsertionPoints: function(data) {
			if (data && data.length > 0) {
				return true;
			} else {
				return false;
			}
		},

		_lockWidth: function() {
			if (!this.fitparent && this.buttonWidth > 0 && !this.skinless) {
				this.$.target.style.width = this.buttonWidth + 'px';
			} else {
				return;
			}

			this._widthLocked = true;
		},

		_maxItemsChanged: function(newVal, oldVal) {
			this._setMaxHeight(newVal);
	 	},

	 	_setMaxHeight: function(maxItems) {
			var actualMax = Math.min(this.items.length, maxItems);
			var itemHeight = this.itemHeight || 0;

			this.$.list.style.height = itemHeight * actualMax + 'px';

			if (this.data) {
				this._itemRecycler.style.height = itemHeight * actualMax + 'px';
				this.$.list.style.overflowY = "hidden";
			}
	 	},

		_updateButtonClass: function(direction, fitparent, error, state, type) {
			var o = {};
			o.button = true;
			o.fit = fitparent;
			o.invalid = error;
			o[type] = true;
			o[state] = true;
			o.top = (direction === 'n');
			o.bottom = (direction === 's');
			return this.classBlock(o);
		},

		requestInitialization: function () {
			return this.$.itemRecycler.initialize();
		},
	});

})(window.Strand = window.Strand || {});
