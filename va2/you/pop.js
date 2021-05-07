console.log('yeyah 2')
// test if popup script can:
//  1) load libs such as graphology
//  2) i/o mongo
//  3) scrape fb
//  4) chrome storage
document.getElementById('abut').addEventListener('click', async () => {
  // alert('yeah pop')

  const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })

  window.chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['contentScript_ok.js']
    // function: () => {
    //   const graph = new Graph()
    //   graph.addNode('one', { name: 'aname' })
    //   graph.addNode('two', { name: 'nothername' })
    //   graph.addUndirectedEdge('one', 'two')
    //   console.log(graph.export())
    // }
  })
})
