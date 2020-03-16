class DistanceBasedLayout:
    def __init__(self, graph):
        self._initializePositions()
        self._findSolution()

    def _initializePositions(self):
        # self.nodes = n.random.random( (self.graph.number_of_nodes(), 3))
        pass

    def _findSolution(self):
        pass



class IteratedDistanceBasedLayout(DistanceBasedLayout):
    def __init__(self, graph, nit=10):
        self.nit = nit
        DistanceBasedLayout.__init__(self, graph)

    def _findSolution(self):
        # use self.nit
        pass

class GeometricDistanceBasedLayout(DistanceBasedLayout):
    def __init__(self, graph):
        self.nit = nit
        DistanceBasedLayout.__init__(self, graph)

    def _findSolution(self):
        # use self.nit
        pass

