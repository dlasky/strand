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
			auto:{
				type:Boolean,
				value:true
			}
		},

		ready:function() {
			console.time('open');
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
			objectStore.createIndex('name', 'name', { unique: false });

			//METADATA FOR FT SEARCH
			var metaStore = this._db.createObjectStore('meta', {keyPath:'one'});
			metaStore.createIndex('one', 'one', {unique:true});
			metaStore.createIndex('two', 'two', {unique:true});
		},

		_promFactory: function(item) {
			return new Promise(function(resolve, reject) {
				item.onsuccess = function(e) {
					resolve(e.target.result || e);
				}
				item.onerror = reject;
			});
		},

		_objFactory: function(mode, operation, storeName) {
			mode = mode || 'readwrite';
			operation = operation || function(store) { return store.get(); }
			storeName = storeName || this.entity;

			var transaction = this._db.transaction([storeName], mode);
			var store = transaction.objectStore(storeName);
			var req = operation(store);
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

		add:function(data, entity, ignoreMeta) {
			var req = this._objFactory('readwrite', function(store) {
				if (Array.isArray(data)) {
					return data.map(function(obj) {
						if (!ignoreMeta)
							this.addMeta(obj.name, obj.id);
						return store.add(obj);
					}, this);
				} else {
					if (!ignoreMeta)
						this.addMeta(data.name, data.id);
					return store.add(data);
				}
			}.bind(this), entity);
			return req.promise;
		},

		addMeta: function(raw, resultKey) {
			raw = raw.toUpperCase();
			var chars = [].concat.apply([], Array(26))
				.map(function(_, i) { return String.fromCharCode(i+65); })
				.filter(function(c) {
					return raw.includes(c);
				})
				.map(function(c) {
					this.writeMeta(c, resultKey);
				},this);
		},

		writeMeta: function(meta, resultKey) {
			this.query(meta, 'meta').then(function(result) {
				if (result instanceof Event) {
					var o = {
						one:meta,
						keys:[resultKey]
					};
					this.add(o,'meta',true);
				} else {
					this.update(o, meta, 'meta', function(result, data) {
						result.keys.push(data);
						return result;
					});
					console.log('result',result);
				}
			}.bind(this));
		},

		//TODO bind to array slices as well as the utility methods

		update:function(data, key, entity, updateCallback) {
			updateCallback = updateCallback || function(result, data) {
				return DataUtils.copy({}, result, data);
			}
			if (key) {
				return this.query(key, entity).then(function(result) {
					var dt = updateCallback(result, data);
					return this._objFactory('readwrite', function(store) {
						return store.put(dt);
					}).promise
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

		search: function(text, index) {
			index = index || 'name';
			var o = [];
			console.time('cur')
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
							console.timeEnd('cur')
						}
					}
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

		all: function() {
			return this._objFactory('readonly', function(store) {
				return store.getAll();
			}).promise;
		}
	});
}(window.Strand = window.Strand || {}));
