class PyServer {
  theInit () {
    this.download = this.downloadInitialData(); // continues when receiving the answer
  }
  downloadInitialData () {
    let nodes = ['asd', 4, [33.4, 'tyu']];
    let links = [1,2,3,4];
    // ajax call or sparql TTM
    let data = {
      layout: 'spring',
      dim: 2,
      nodes: nodes,
      links: links,
      first: true,
      l0: [],
    };
    let af = (err, res) => {
      this.__mdata = res;
    }
    this.mkAjax('/mGadget/', data, af)
  }
  mkAjax (path, dataobj, afunc) {
    let turl = 'http://localhost:5000' + path
    HTTP.post(
      turl,
      { data: dataobj } ,
      afunc
    )
  }
}


