/**
 * Firebase Admin SDK Configuration
 * For backend/server-side operations with Firestore
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

let useMemoryMock = process.env.NODE_ENV === 'test';
let realDb = null;

// Initialize Firebase Admin using env variables, service account key, or Application Default Credentials
if (!admin.apps.length) {
    let credential;

    // Check environment variables first (ideal for cloud deployment like Render)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            });
            console.log('🔥 Initialized Firebase Admin SDK with Environment Variables');
        } catch (envErr) {
            console.log('⚠️ Failed to initialize with Environment Variables. Trying fallback methods...');
        }
    }

    if (!credential) {
        try {
            const serviceAccount = require('./ServiceAccountKey.json');
            credential = admin.credential.cert(serviceAccount);
            console.log('🔥 Initialized Firebase Admin SDK with ServiceAccountKey.json');
        } catch (err) {
            console.log('⚠️ ServiceAccountKey.json not found. Attempting Application Default Credentials...');
            try {
                credential = admin.credential.applicationDefault();
            } catch (credErr) {
                console.log('❌ Failed to load Application Default Credentials. Fallback to in-memory mock.');
                useMemoryMock = true;
            }
        }
    }

    if (!useMemoryMock) {
        try {
            admin.initializeApp({
                credential,
                projectId: firebaseConfig.projectId,
                storageBucket: firebaseConfig.storageBucket,
            });
            realDb = admin.firestore();
        } catch (initErr) {
            console.log('❌ Failed to initialize Firebase Admin. Fallback to in-memory mock.');
            useMemoryMock = true;
        }
    }
} else {
    realDb = admin.firestore();
}

// In-Memory Firestore Emulator Fallback implementation
class MemoryDocumentReference {
    constructor(collection, id) {
        this.collection = collection;
        this.id = id;
    }

    async get() {
        const data = this.collection.store[this.id];
        return {
            exists: data !== undefined,
            id: this.id,
            data: () => data
        };
    }

    async update(data) {
        if (!this.collection.store[this.id]) {
            throw new Error('Document not found');
        }
        this.collection.store[this.id] = {
            ...this.collection.store[this.id],
            ...data
        };
    }

    async delete() {
        delete this.collection.store[this.id];
    }

    async set(data) {
        this.collection.store[this.id] = data;
    }
}

class MemoryCollectionReference {
    constructor(name) {
        this.name = name;
        this.store = {}; // id -> data
        this.filters = [];
        this.limitVal = null;
    }

    where(field, operator, value) {
        const query = new MemoryCollectionReference(this.name);
        query.store = this.store;
        query.filters = [...this.filters, { field, operator, value }];
        query.limitVal = this.limitVal;
        return query;
    }

    limit(n) {
        const query = new MemoryCollectionReference(this.name);
        query.store = this.store;
        query.filters = this.filters;
        query.limitVal = n;
        return query;
    }

    doc(id) {
        const docId = id || (Date.now().toString() + Math.random().toString(36).substring(2, 7));
        return new MemoryDocumentReference(this, docId);
    }

    async add(data) {
        const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
        this.store[id] = data;
        return { id };
    }

    async get() {
        let results = [];
        for (const [id, data] of Object.entries(this.store)) {
            let matches = true;
            for (const filter of this.filters) {
                const fieldValue = data[filter.field];
                if (filter.operator === '==') {
                    if (fieldValue !== filter.value) {
                        matches = false;
                        break;
                    }
                } else if (filter.operator === 'array-contains') {
                    if (!Array.isArray(fieldValue) || !fieldValue.includes(filter.value)) {
                        matches = false;
                        break;
                    }
                }
            }
            if (matches) {
                results.push({
                    id,
                    data: () => data
                });
            }
        }
        if (this.limitVal !== null) {
            results = results.slice(0, this.limitVal);
        }
        return {
            size: results.length,
            forEach: (cb) => results.forEach(cb),
            docs: results
        };
    }
}

class MemoryFirestore {
    constructor() {
        this.collections = {};
    }

    collection(name) {
        if (!this.collections[name]) {
            this.collections[name] = new MemoryCollectionReference(name);
        }
        return this.collections[name];
    }
}

const memoryDb = new MemoryFirestore();

function wrapCollection(realCol, name) {
    return {
        where(field, operator, value) {
            if (useMemoryMock) return memoryDb.collection(name).where(field, operator, value);
            try {
                return wrapQuery(realCol.where(field, operator, value), name);
            } catch (err) {
                return handleDbError(err, name).where(field, operator, value);
            }
        },
        limit(n) {
            if (useMemoryMock) return memoryDb.collection(name).limit(n);
            try {
                return wrapQuery(realCol.limit(n), name);
            } catch (err) {
                return handleDbError(err, name).limit(n);
            }
        },
        doc(id) {
            if (useMemoryMock) return memoryDb.collection(name).doc(id);
            try {
                return wrapDocRef(realCol.doc(id), name, id);
            } catch (err) {
                return handleDbError(err, name).doc(id);
            }
        },
        async add(data) {
            if (useMemoryMock) return memoryDb.collection(name).add(data);
            try {
                return await realCol.add(data);
            } catch (err) {
                return await handleDbError(err, name).add(data);
            }
        },
        async get() {
            if (useMemoryMock) return memoryDb.collection(name).get();
            try {
                return await realCol.get();
            } catch (err) {
                return await handleDbError(err, name).get();
            }
        }
    };
}

function wrapQuery(realQuery, name) {
    return {
        where(field, operator, value) {
            if (useMemoryMock) return memoryDb.collection(name).where(field, operator, value);
            try {
                return wrapQuery(realQuery.where(field, operator, value), name);
            } catch (err) {
                return handleDbError(err, name).where(field, operator, value);
            }
        },
        limit(n) {
            if (useMemoryMock) return memoryDb.collection(name).limit(n);
            try {
                return wrapQuery(realQuery.limit(n), name);
            } catch (err) {
                return handleDbError(err, name).limit(n);
            }
        },
        async get() {
            if (useMemoryMock) return memoryDb.collection(name).get();
            try {
                return await realQuery.get();
            } catch (err) {
                return await handleDbError(err, name).get();
            }
        }
    };
}

function wrapDocRef(realDocRef, colName, docId) {
    return {
        async get() {
            if (useMemoryMock) return memoryDb.collection(colName).doc(docId).get();
            try {
                return await realDocRef.get();
            } catch (err) {
                return await handleDbError(err, colName).doc(docId).get();
            }
        },
        async set(data) {
            if (useMemoryMock) return memoryDb.collection(colName).doc(docId).set(data);
            try {
                return await realDocRef.set(data);
            } catch (err) {
                return await handleDbError(err, colName).doc(docId).set(data);
            }
        },
        async update(data) {
            if (useMemoryMock) return memoryDb.collection(colName).doc(docId).update(data);
            try {
                return await realDocRef.update(data);
            } catch (err) {
                return await handleDbError(err, colName).doc(docId).update(data);
            }
        },
        async delete() {
            if (useMemoryMock) return memoryDb.collection(colName).doc(docId).delete();
            try {
                return await realDocRef.delete();
            } catch (err) {
                return await handleDbError(err, colName).doc(docId).delete();
            }
        }
    };
}

function handleDbError(err, colName) {
    useMemoryMock = true;
    console.log(`⚠️ Firestore operation failed: "${err.message}". Switched to In-Memory mock for collection "${colName}".`);
    return memoryDb.collection(colName);
}

// Proxy wrapper for Firestore db object
const db = {
    collection(name) {
        if (useMemoryMock || !realDb) {
            return memoryDb.collection(name);
        }
        return wrapCollection(realDb.collection(name), name);
    }
};

module.exports = {
    admin,
    db,
    firebaseConfig,
};