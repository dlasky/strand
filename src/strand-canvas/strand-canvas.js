(function (scope) {
	scope.Canvas = Polymer({
		
		is:'strand-canvas',

		properties: {
			width:{
				type:Number,
				value:100,
			},
			height:{
				type:Number,
				value:100
			},
			context:{
				type:Object,
				value:null
			},
			type:{
				type:String,
				value:'2d'
			}

		},

		ready: function() {
			this.context = this.$.canvas.getContext(this.type);
		}
	});
})(window.Strand = window.Strand || {});