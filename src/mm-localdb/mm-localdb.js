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

		_promFactory: function(item) {
			return new Promise(function(resolve, reject) {
				item.onsuccess = function(e) {
					resolve(e.target.result || e);
				}
				item.onerror = reject;
			});
		},

		_objFactory: function(mode, operation, args) {
			mode = mode || 'readwrite';
			operation = operation || function() {}
			var transaction = this._db.transaction([this.entity], mode);
			var store = transaction.objectStore(this.entity);
			var req = operation(store, args);
			if (Array.isArray(req)) {
				prom = Promise.all(req.map(this._promFactory))
			} else {
				prom = this._promFactory(req);
			}

			return {
				store: store,
				transaction: transaction,
				promise: prom
			};
		},

		add:function(data) {
			var req = this._objFactory('readwrite', function(store) {
				if (Array.isArray(data)) {
					return data.map(function(obj) {
						return store.add(obj);
					});
				} else {
					return store.add(data);
				}
			});
			return req.promise;
		},

		//TODO bind to array slices as well as the utility methods

		update:function(data, key) {
			if (key) {
				return this.query(key).then(function(result) {
					var dt = DataUtils.copy({}, result, data);
					return this._objFactory('readwrite', function(store) {
						return store.put(dt);
					}).promise
				});
			}
			return this._objFactory('readwrite', function(store) {
				return store.put(data);
			}).promise;
		},

		remove:function(key) {
			if (DataUtils.isType(key, "object")) {
				key = key[this.keyPath];
			}
			var req = this._objFactory('readwrite', function(store) {
				return store.delete(key);
			});
			return req.promise;
		},

		query: function(key) {
			if (DataUtils.isType(key, "object")) {
				key = key[this.keyPath];
			}
			return this._objFactory('readonly', function(store) {
				return store.get(key);
			}).promise;
		},

		all: function() {
			return this._objFactory('readonly', function(store) {
				return store.getAll();
			}).promise;
		}
	});
}(window.Strand = window.Strand || {}));
