# search_alorithms_visualization
Live visualization: https://lucasgdm.github.io/search_algorithms_visualization/

This is the result of a small assignment in which we had to implement a few informed search algorithms. We weren't supposed to implement a visualization, so the interface is really crude and only supports 1920x1080 monitors  

The algorithms implemented are:  
* BFS - The agenda is a queue
* DFS - The agenda is a stack
* A* and Best-first - The agenda is a priority queue where the weights are given by *f(n) = g(n) + h(n, goal)* where *f* is the distance so far and *g* is the estimated distance to reach the goal

As for the heuristics, they are better understood with an image:
![alt text](https://raw.githubusercontent.com/lucasgdm/search_algorithms_visualization/master/distances1.png)

The idea is to compare the results yielded by each heuristic function.  
While the first two heuristics are admissible, the third one isn't, and generates non optimal solutions. Among the first two, however, the Diagonal distance is as pessimistic as possible while still being admissible, which often results in fewer iterations with optimal result.   


In this particular problem, with this class of generated test cases, we end up observing the following trade-off:

```
                 ^
A* Euclidean     |    More iterations, optimal solution  
                 |  
A* Diagonal      |  
                 |  
A* Manhattan     |  
                 |  
Best-first       |    Fewer iterations, worse solution  
                 V
```
