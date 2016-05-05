(function(scope) {

	var _version = 1;
	var DataUtils = StrandLib.DataUtils;

	scope.LocalDB = Polymer({
		is:'strand-localdb',

		behaviors:[
			StrandTraits.Falsifiable,
		],

		properties: {
			entity:{
				type:String,
				notify:true,
				value:"entity"
			},
			recordCount:{
				type:Number,
				notify:true
			},
			dbName:{
				type:String,
				value:"strand-cache"
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
			meta:{
				type:Object,
				value:function() { return {count:0}; },
				notify:true
			},
			search:{
				type:String,
				value:"",
				notify:true,
				observer:"_searchChanged"
			},
			auto:{
				type:Boolean,
				value:true
			}
		},

		ready:function() {
			var openRequest = indexedDB.open(this.dbName, _version);
			this._promFactory(openRequest).then(this._handleSuccess.bind(this), this._handleError.bind(this));
			this.listen(openRequest, 'upgradeneeded', '_handleUpgrade');
			this.listen(openRequest, 'versionchange', '_handleVersion');
		},

		delete: function() {
			return this._promFactory(indexedDB.deleteDatabase(this.dbName));
		},

		_handleError: function(e) {
			console.log(e);
			this.fire('error', e);
		},

		_handleSuccess: function(e) {
			console.log(e);
			this._db = e;
			this.count().then(function(c) {
				this.set('meta.count',c);
			}.bind(this));
			this.all().then(function(d) {
				this._raw = d;
				this.set('data',d);
			}.bind(this));
		},

		_searchChanged: function() {
			if (this._raw) {
				var search = this.search || '';
				this.set('data', this._raw.filter(function(o) {
					return o.name.toLowerCase().includes(search.toLowerCase());
				},this));
			}
		},

		_handleUpgrade: function(e) {
			console.log(e);
			this._db = e.target.result;
			var objectStore = this._db.createObjectStore(this.entity, { keyPath:this.keyPath });
			objectStore.createIndex(this.keyPath, this.keyPath, { unique: false });
			objectStore.createIndex('name', 'name', { unique: false });
		},

		_promFactory: function(item) {
			if (item instanceof Promise) return item;
			return new Promise(function(resolve, reject) {
				item.onsuccess = function(e) {
					resolve(DataUtils.getPathValue('target.result',e) || DataUtils.getPathValue('result',e) || e);
				};
				item.onerror = reject;
			});
		},

		_objFactory: function(mode, operation, storeName) {
			mode = mode || 'readwrite';
			operation = operation || function(store) { return store.get(); };
			storeName = storeName || this.entity;

			var transaction = this._db.transaction([storeName], mode);
			var store = transaction.objectStore(storeName);
			var req = operation(store);
			if (Array.isArray(req)) {
				prom = Promise.all(req.map(this._promFactory));
			} else {
				prom = this._promFactory(req);
			}

			return {
				store: store,
				transaction: transaction,
				promise: prom
			};
		},

		_cursorFactory: function(store, conditionCallback) {
			//rewrite this to not return the promise maybe?
			conditionCallback = conditionCallback || function(o) { return true; };
			return new Promise(function(resolve, reject) {
				var o = [];
				var c = store.openCursor();
				c.onsuccess = function(e) {
					var cursor = e.target.result;
					if (cursor) {
						if (conditionCallback(cursor.value)) o.push(cursor.value);
						cursor.continue();
					} else {
						resolve(o);
					}
				};
				c.onerror = reject;
			});
		},

		add:function(data, entity) {
			var req = this._objFactory('readwrite', function(store) {
				if (Array.isArray(data)) {
					return data.map(function(obj) {
						return store.add(obj);
					}, this);
				} else {
					return store.add(data);
				}
			}.bind(this), entity);
			return req.promise;
		},

		test: function() {
			function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b);}
			for(var i=0;i<70000;i++) {
				this.add({name:b(),id:i});
			}
		},

		//TODO bind to array slices as well as the utility methods

		update:function(data, key, entity, updateCallback) {
			updateCallback = updateCallback || function(result, data) {
				return DataUtils.copy({}, result, data);
			};
			if (key) {
				return this.query(key, entity).then(function(result) {
					var dt = updateCallback(result, data);
					return this._objFactory('readwrite', function(store) {
						return store.put(dt);
					}).promise;
				}.bind(this));
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

		_search: function(text, index) {
			index = index || 'name';
			var o = [];
			var prom = new Promise(function( resolve, reject) {

				this._objFactory('readonly', function(store) {
					var idx = store.index(index);
					idx.openCursor().onsuccess = function(event) {
						var cursor = event.target.result;
						if (cursor) {
							if (cursor.key.indexOf(text) !== -1) {
								o.push(cursor.value);
							}
							cursor.continue();
						} else {
							resolve(o);
						}
					};
					return store.get('name');
				});
			}.bind(this));
			return prom;
		},

		query: function(key, entity) {
			if (DataUtils.isType(key, "object")) {
				key = key[this.keyPath];
			}
			return this._objFactory('readonly', function(store) {
				return store.get(key);
			}, entity).promise;
		},

		count: function() {
			return this._objFactory('readonly', function(store) {
				var idx = store.index('id');
				return idx.count();
			}).promise;
		},

		all: function() {
			var o = [];
			return this._objFactory('readonly', function(store) {
				//if (store.getAll) {
				if (false) {
					return store.getAll();
				} else {
					return this._cursorFactory(store);
				}
				
			}.bind(this)).promise;
		}
	});
}(window.Strand = window.Strand || {}));
