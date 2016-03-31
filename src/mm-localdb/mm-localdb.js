(function(scope) {

	var _version = 1;
	var DataUtils = StrandLib.DataUtils;

	scope.LocalDB = Polymer({
		is:'mm-localdb',

		behaviors:[
			StrandTraits.Falsifiable,
		],

		properties: {
			entity:{
				type:String,
				notify:true
			},
			query:{
				type:String,
				notify:true
			},
			db:{
				type:String,
				value:"mm-cache"
			},
			keyPath:{
				type:String,
				value:"id"
			},
			auto:{
				type:Boolean,
				value:true
			}
		},

		ready:function() {
			this._req= indexedDB.open(this.db, _version);
			this.listen(this._req, 'error', '_handleError');
			this.listen(this._req, 'success', '_handleResult');
			this.listen(this._req, 'upgradeneeded', '_handleUpgrade');
			this.listen(this._req, 'versionchange', '_handleVersion');
		},

		_handleError: function() {

		},

		_handleResult: function() {

		},

		_handleUpgrade: function() {
			var objectStore = this._req.result.createObjectStore(this.entity, { keyPath:this.keyPath });
			objectStore.createIndex(this.keyPath, this.keyPath, { unique: false });
		},

		add:function(data) {
			var transaction = this._connection.transaction([this.entity], 'readwrite');
			var prom = new Promise(function(resolve, reject) {
				var objStore = transaction.objectStore(this.entity);
				if(DataUtils.isType(data, "object")) {
					data.forEach(function(obj) {
						objStore.add(obj);
					});
				}
				transaction.oncomplete = resolve;
				transaction.onerror = reject;
			})
			return prom;
		},

		//TODO bind to array slices as well as the utility methods

		update:function(data, query) {

		},
		remove:function(data) {

		},
		query: function(query) {

		}
	});
}(window.Strand = window.Strand || {}));
