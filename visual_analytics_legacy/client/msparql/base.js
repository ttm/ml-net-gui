export { MSPARQLMin, MSPARQL };

class MSPARQLMin {
  constructor (url) {
    this.url = url;
  }
  queryEndpoint (query) {
    this.q = query;
    if (typeof query !== 'string') {
      this.q = query.join(' ');
    }
    console.log(this.q);
    return HTTP.get(
      this.url, { params: {query: this.q, format: 'json', timeout: 9999999 } },
      (error, result) => {
        window.mres_ = result;
        window.mres__ = JSON.parse(result.content);
        window.sparqlres = window.mres__.results.bindings;
        window.merror = error;
        return result;
      }
    );
  }
}

let mcall = () => console.log('query returned');

class MSPARQL {
  constructor (url, storagevar='sparqlres', callfuncs=[mcall], headers='') {
    this.url = url;
    this.storagevar = storagevar;
    this.callfuncs = callfuncs;
    this.headers = headers;
  }
  askEndpoint (query) {
    this.q = query;
    if (typeof query !== 'string') {
      this.q = query.join(' ');
    }
    return HTTP.get(
      this.url,
      {
        params: { query: this.q, format: 'json' },
        headers: this.headers,
      },
      (error, result) => {
        window[this.storagevar + '__'] = result;
        let foo = JSON.parse(result.content);
        window[this.storagevar + '_ask'] = foo.boolean;

        this.callfuncs.forEach( f => {
          f();
        });
      }
    );
  }
  queryEndpoint (query) {
    this.q = query;
    if (typeof query !== 'string') {
      this.q = query.join(' ');
    }
    console.log(this.q);
    return HTTP.get(
      this.url,
      {
        params: { query: this.q, format: 'json' },
        headers: this.headers,
      },
      (error, result) => {
        window[this.storagevar + '__'] = result;
        let foo = JSON.parse(result.content);
        window[this.storagevar + '_'] = foo;
        window[this.storagevar] = foo.results.bindings;
        window[this.storagevar + '_error'] = error;
        this.callfuncs.forEach( f => {
          f();
        });
      }
    );
  }
  queryEndpointSync (query) {
    this.q = query;
    if (typeof query !== 'string') {
      this.q = query.join(' ');
    }
    console.log(this.q);
    return JSON.parse( HTTP.get(
      this.url,
      {
        params: { query: this.q, format: 'json' },
        headers: this.headers,
      }
    ));
  }
}
