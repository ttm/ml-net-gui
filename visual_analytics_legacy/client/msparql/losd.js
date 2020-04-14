import { MSPARQL } from './base.js';
import { mlosdheaders } from './losdauth.js';
export { MLOSD };

class MLOSD_ extends MSPARQL {
  constructor () {
    super(
      'https://api.data.world/v0/sparql/rfabbri/linked-open-social-data',
      // does not allow to query from the browser on the public endpoint: ...
      // 'https://rfabbri.linked.data.world/sparql/linked-open-social-data',
      'losd',
      [() => console.log('losd comeback')],
      // ... thus has to use authorization (just register in data.world):
      mlosdheaders
    );
    this.prefix = 'PREFIX po: <http://purl.org/socialparticipation/po/> ';
    this.mkDefaultQueries();
  }
  query (querystring) {
    let q = this.prefix + querystring;
    // query with post
    console.log('before query: ' + q, this.url);
    this.queryEndpoint(q);
  }
  mkDefaultQueries () {
    this.q1 = [
      "SELECT ?s ?n WHERE {",
       "?s a po:Snapshot .",
       "?s po:name ?n .",
      "}",
    ].join(' ');
    this.q2 = `PREFIX : <https://rfabbri.linked.data.world/d/linked-open-social-data/>
      PREFIX po: <http://purl.org/socialparticipation/po/>
      SELECT (COUNT(DISTINCT ?author) as ?c) WHERE {
        ?author a po:Participant . 
    }`;
  }
}

let MLOSD = new MLOSD_();
