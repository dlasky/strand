(function(scope) {

	var _version = 1;
	var DataUtils = StrandLib.DataUtils;

	function _queryFactory(q) {

	}

	scope.LocalDB = Polymer({
		is:'mm-localdb',

		behaviors:[
			StrandTraits.Falsifiable,
		],

		properties: {
			entity:{
				type:String,
				notify:true,
				value:"entity"
			},
			dbName:{
				type:String,
				value:"mm-cache"
			},
			keyPath:{
				type:String,
				value:"id"
			},
			data:{
				type:Array,
				value:function() {
					return [];
				},
				notify:true
			},
			auto:{
				type:Boolean,
				value:true
			}
		},

		ready:function() {
			var openRequest = indexedDB.open(this.dbName, _version);
			this.listen(openRequest, 'error', '_handleError');
			this.listen(openRequest, 'success', '_handleSuccess');
			this.listen(openRequest, 'upgradeneeded', '_handleUpgrade');
			this.listen(openRequest, 'versionchange', '_handleVersion');
		},

		_handleError: function(e) {
			console.log(e);
			this.fire('error', e);
		},

		_handleSuccess: function(e) {
			console.log(e);
			this._db = e.target.result;
		},

		_handleUpgrade: function(e) {
			console.log(e);
			this._db = e.target.result;
			var objectStore = this._db.createObjectStore(this.entity, { keyPath:this.keyPath });
			objectStore.createIndex(this.keyPath, this.keyPath, { unique: false });
		},

		add:function(data) {
			var transaction = this._db.transaction([this.entity], 'readwrite');
			var prom = new Promise(function(resolve, reject) {
				var objStore = transaction.objectStore(this.entity);
				if (DataUtils.isType(data, "array")) {
					data.forEach(function(obj) {
						objStore.add(obj);
					});
				} else if (DataUtils.isType(data, "object")) {
					objStore.add(data);
				}
				transaction.oncomplete = resolve;
				transaction.onerror = reject;
			}.bind(this));
			return prom;
		},

		//TODO bind to array slices as well as the utility methods

		update:function(data, query) {

		},

		remove:function(key) {
			if (DataUtils.isType(key, "object")) {
				key = key[this.keyPath];
			}
			var transaction = this._db.transaction([this.entity], 'readwrite');
			var prom = new Promise(function(resolve, reject) {
				var objStore = transaction.objectStore(this.entity);
				objStore.delete(key);
				transaction.oncomplete = resolve;
				transaction.onerror = reject;
			}.bind(this));
		},

		query: function(query) {
			var transaction = this._db.transaction([this.entity], 'readonly');
			var objStore = transaction.objectStore(this.entity);
			var cusorReq = objectStore.openCursor();
			var prom = new Promise(function(resolve, reject) {
				cursorReq.onsucess = function() {
					var cursor = cursorReq.result;
					var dt = [];

				};
				cursorReq.onerror = reject;
			}.bind(this));
		},

		all: function() {
			var transaction = this._db.transaction([this.entity], 'readonly');
			var objStore = transaction.objectStore(this.entity);
			// var query =
		}
	});
}(window.Strand = window.Strand || {}));
