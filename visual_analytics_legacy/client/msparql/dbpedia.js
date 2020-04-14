import { MSPARQLMin, MSPARQL } from './base.js';
export { MDBPedia0, MDBPedia };

let url = "http://dbpedia.org/sparql";
let MDBPedia0 = new MSPARQLMin(url);
MDBPedia0.q1 = [
  "SELECT DISTINCT ?Concept",
  "WHERE {",
  "[] a ?Concept",
  "} LIMIT 100"
];

let mcall = () => console.log('query returned 22');
let MDBPedia = new MSPARQL(url, 'sparql', [mcall]);
