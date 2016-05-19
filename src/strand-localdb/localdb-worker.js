
function _handleUpgrade(e) {
			console.log(e);
			this._db = e.target.result;
			var objectStore = this._db.createObjectStore(this.entity, { keyPath:this.keyPath });
			objectStore.createIndex(this.keyPath, this.keyPath, { unique: false });
			objectStore.createIndex('name', 'name', { unique: false });
}

function _promFactory(item) {
	if (item instanceof Promise) return item;
	return new Promise(function(resolve, reject) {
		item.onsuccess = function(e) {
			resolve(e.target.result || e.result || e);
		};
		item.onerror = reject;
	});
}

function _objFactory(db, mode, operation, storeName) {
	mode = mode || 'readwrite';
	operation = operation || function(store) { return store.get(); };
	storeName = storeName || 'entity';

	var transaction = db.transaction([storeName], mode);
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
}

function _cursorFactory(store, conditionCallback) {
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
}

function all(db) {
	var o = [];
	return this._objFactory(db, 'readonly', function(store) {
		if (store.getAll) {
			return store.getAll();
		} else {
			return this._cursorFactory(store);
		}
	}.bind(this)).promise;
}

function add(db, data, entity) {
	var req = this._objFactory(db, 'readwrite', function(store) {
		if (Array.isArray(data)) {
			return data.map(function(obj) {
				return store.add(obj);
			}, this);
		} else {
			return store.add(data);
		}
	}.bind(this), entity);
	return req.promise;
}

function update(data, key, entity, updateCallback) {
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
}

function remove(key) {
	if (DataUtils.isType(key, "object")) {
		key = key[this.keyPath];
	}
	var req = this._objFactory('readwrite', function(store) {
		return store.delete(key);
	});
	return req.promise;
}

function query(key, entity) {
	if (DataUtils.isType(key, "object")) {
		key = key[this.keyPath];
	}
	return this._objFactory('readonly', function(store) {
		return store.get(key);
	}, entity).promise;
}

function count() {
	return _objFactory('readonly', function(store) {
		var idx = store.index('id');
		return idx.count();
	}).promise;
}

function deleteDB() {
	return this._promFactory(indexedDB.deleteDatabase(this.dbName));
}

/** DEBUG ONLY **/
function test(db) {
	function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b);}
	for(var i=0;i<70000;i++) {
		if (i%100===0)
			console.log(i/70000*100);
		add(db, {name:b(),id:i});
	}
	console.log('done');
}

var store = [];
var db;
var openRequest = indexedDB.open('strand-cache', 1);
_promFactory(openRequest).then(function(e) {
	db = e;
	all(e).then(function(records) {
		store = records;
		postMessage(store);
	});
}, function() { close(); });

this.addEventListener('message', function(e) {
	switch(e.data.type) {
		case "search":
			postMessage(store.filter(function(d) {
				return d.name.includes(e.data.needle);
			}));
		break;
		case "test":
			console.log('got test');
			test(db);
		break;
	}
});

StrandLib.WorkerManifest.addClass('worker');