const s = require('mongodb-stitch-browser-sdk')
const auth = require('./mong_auth.js')

const client = s.Stitch.initializeDefaultAppClient(auth.app)
const db = client.getServiceClient(s.RemoteMongoClient.factory, auth.cluster).db(auth.db)

// usage:
// mong.db.collection(mong.auth.collections.test).insertOne({AAAA: 'llll'})
// db.collection(collectionName).updateOne({ owner_id: client.auth.user.id }, { $set: { number: 40 } }, { upsert: true })
// db.collection(collectionName).find({ owner_id: client.auth.user.id }, { limit: 100 }).asArray()
//
// const collectionName = 'nets'
// client.auth.loginWithCredential(new s.AnonymousCredential()).then(user =>
//   db.collection(collectionName).updateOne({ owner_id: client.auth.user.id }, { $set: { number: 40 } }, { upsert: true })
// ).then(() =>
//   db.collection(collectionName).find({ owner_id: client.auth.user.id }, { limit: 100 }).asArray()
// ).then(docs => {
//   console.log('Found docs', docs)
//   console.log('[MongoDB Stitch] Connected to Stitch')
// }).catch(err => {
//   console.error(err)
// })
module.exports = { client, db, auth }
