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
			this._connection = indexedDB.open(this.db, _version);
			this.listen(this._connection, 'error', '_handleError');
			this.listen(this._connection, 'success', '_handleResult');
			this.listen(this._connection, 'upgradeneeded', '_handleUpgrade');
			this.listen(this._connection, 'versionchange', '_handleVersion');
		},
		_handleUpgrade: function() {
			var objectStore = db.createObjectStore(this.entity, { keyPath:this.keyPath });
			objectStore.createIndex('name');
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
