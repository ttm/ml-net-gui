const s = require('mongodb-stitch-browser-sdk')
const auth = require('./mong_auth.js')

const client = s.Stitch.initializeDefaultAppClient(auth.app)
const db = client.getServiceClient(s.RemoteMongoClient.factory, auth.cluster).db(auth.db)

// usage:
// mong.db.collection(mong.auth.collections.test).insertOne({AAAA: 'llll'})
module.exports = { client, db, auth }
