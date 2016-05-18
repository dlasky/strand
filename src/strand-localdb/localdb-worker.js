
var _handleUpgrade = function(e) {
			console.log(e);
			this._db = e.target.result;
			var objectStore = this._db.createObjectStore(this.entity, { keyPath:this.keyPath });
			objectStore.createIndex(this.keyPath, this.keyPath, { unique: false });
			objectStore.createIndex('name', 'name', { unique: false });
};

var _promFactory = function(item) {
	if (item instanceof Promise) return item;
	return new Promise(function(resolve, reject) {
		item.onsuccess = function(e) {
			resolve(e.target.result || e.result || e);
		};
		item.onerror = reject;
	});
};

var _objFactory = function(db, mode, operation, storeName) {
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
};

var _cursorFactory = function(store, conditionCallback) {
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
};

var all = function(db) {
	var o = [];
	return this._objFactory(db, 'readonly', function(store) {
		if (store.getAll) {
			return store.getAll();
		} else {
			return this._cursorFactory(store);
		}
	}.bind(this)).promise;
};

var add =function(db, data, entity) {
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
};

/** DEBUG ONLY **/
var test = function(db) {
	function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b);}
	for(var i=0;i<70000;i++) {
		if (i%100===0)
			console.log(i/70000*100);
		add(db, {name:b(),id:i});
	}
	console.log('done');
};

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