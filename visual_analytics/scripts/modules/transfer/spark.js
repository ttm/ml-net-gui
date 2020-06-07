const superagent = require('superagent')

const losdheaders = require('./losdheaders.js')

class MSPARQLMin2 {
  constructor (url) {
    this.url = url
  }

  queryEndpoint (query) {
    this.q = query
    if (typeof query !== 'string') {
      this.q = query.join(' ')
    }
    console.log(this.q)
    superagent
      .get(this.url)
      .query({ query: this.q, format: 'json', timeout: 9999999 })
      .then(result => {
        this.mres_ = result
        this.mres__ = JSON.parse(result.text)
        this.sparqlres = this.mres__.results.bindings
      })
      .catch(error => {
        this.merror = error
        console.log('error making SparQL request:', error)
      })
  }
}

const url = 'http://dbpedia.org/sparql'
const MDBPedia0 = new MSPARQLMin2(url)
MDBPedia0.q1 = [
  'SELECT DISTINCT ?Concept',
  'WHERE {',
  '[] a ?Concept',
  '} LIMIT 100'
]

const sparqlCall = (url, query, callback, headers) => {
  if (typeof query !== 'string') {
    query = query.join(' ')
  }
  superagent
    .get(url)
    .query({ query, format: 'json' })
    .set(headers)
    .then(result => {
      const mres__ = JSON.parse(result.text)
      const sparqlres = mres__.results.bindings
      callback(sparqlres)
    })
}

const dummyQueries = {
  0: [
    'SELECT ?s ?n WHERE {',
    '?s a po:Snapshot .',
    '?s po:name ?n .',
    '}'
  ].join(' '),
  1: `PREFIX : <https://rfabbri.linked.data.world/d/linked-open-social-data/>
      PREFIX po: <http://purl.org/socialparticipation/po/>
      SELECT (COUNT(DISTINCT ?author) as ?c) WHERE {
        ?author a po:Participant . 
    }`
}

const losdCall = (query, callback) => {
  if (typeof query === 'object') {
    query = query.join(' ')
  }
  if (Object.keys(dummyQueries).includes(String(query))) {
    query = dummyQueries[query]
  }
  const query_ = [
    'PREFIX : <https://rfabbri.linked.data.world/d/linked-open-social-data/>',
    'PREFIX po: <http://purl.org/socialparticipation/po/>',
    query
  ]
  sparqlCall(
    'https://api.data.world/v0/sparql/rfabbri/linked-open-social-data',
    query_.join(' '),
    callback,
    losdheaders.losdheaders
  )
}

// const getNetMembersLinks = (netid, callback) => {
const getNetMembersLinks = (netid, call = console.log) => {
  const qmembers = `SELECT DISTINCT ?p ?n WHERE {
    ?s po:snapshotID '${netid}' .
    ?p a po:Participant .
    ?p po:snapshot ?s .
    ?p po:observation ?o .
    ?o po:name ?n .
  }`
  const qfriendships = `SELECT DISTINCT ?p1 ?p2 WHERE {
    ?f a po:Friendship .
    ?f po:snapshot ?s .
    ?s po:snapshotID '${netid}' .
    ?f po:member ?p1, ?p2 .
    FILTER(?p1 != ?p2)
  }`
  losdCall(qmembers, (members) => {
    losdCall(qfriendships, (friendships) => {
      call({ members, friendships })
    })
  })
}

module.exports = { MSPARQLMin2, MDBPedia0, sparqlCall, losdCall, getNetMembersLinks }
