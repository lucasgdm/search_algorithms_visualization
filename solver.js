

function sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
    Breadth first search
*/
async function bfs(g, callbackSolving, callbackSolved, id) {
    let queue = new Queue();

    queue.enqueue(g.start);

    let stats = {maxAgendaSize: 1, elementsProcessed: 1, execTime: .0};
    let sleepAccum = .0, start = .0, end = .0, delta = .0;
    do {
        start = window.performance.now();

        // ----- CORE ALGORITHM ITERATION -----
        pos = queue.dequeue();
        neighbors = g.listNeighbors(pos);
        for (let j = 0; j < neighbors.length; j++) {
            ne = neighbors[j];
            if (g.get(ne.r, ne.c).visitedVal == NOT_VISITED) {
                g.get(ne.r, ne.c).prev = pos;
                g.get(ne.r, ne.c).visitedVal = VISITED;
                queue.enqueue(ne);

                if (ne.r == g.end.r && ne.c == g.end.c) {
                    //currentQueue = nextQueue = [];
                    queue.clear();
                    break;
                }
            }
        }
        g.get(pos.r, pos.c).visitedVal = PROCESSED;
        // ===== END CORE ALGORITHM ITERATION =====

        // update stats
        stats.maxAgendaSize = Math.max(queue.length(), stats.maxAgendaSize);
        stats.elementsProcessed++;
        // add execution time
        end = window.performance.now();
        delta = end - start;
        stats.execTime += delta;
        // check if execution was interrupted
        if (id != currentRunId)
            return null;
        // sleep
        sleepAccum += sleepMult * delta;
        if (sleepAccum > 15) {
            callbackSolving(g);
            await sleepAsync(sleepAccum);
            sleepAccum = 0;
        }
    } while (queue.length() > 0);

    callbackSolved(g);

    return stats;
}

/*
    Depth first search
*/
async function dfs(g, callbackSolving, callbackSolved, id) {
    let stack = [];

    stack.push(g.start);
    let stats = {maxAgendaSize: 1, elementsProcessed: 1, execTime: .0};
    let sleepAccum = .0, start = .0, end = .0, delta = .0;
    while (stack.length > 0) {
        start = window.performance.now();

        // ----- CORE ALGORITHM ITERATION -----
        pos = stack.pop();
        neighbors = g.listNeighbors(pos);
        for (let j = 0; j < neighbors.length; j++) {
            ne = neighbors[j];
            if (g.get(ne.r, ne.c).visitedVal == NOT_VISITED) {
                g.get(ne.r, ne.c).prev = pos;
                g.get(ne.r, ne.c).visitedVal = VISITED;
                stack.push(ne);

                if (ne.r == g.end.r && ne.c == g.end.c) {
                    stack = [];
                    break;
                }
            }
        }
        g.get(pos.r, pos.c).visitedVal = PROCESSED;
        // ===== END CORE ALGORITHM ITERATION =====

        // update stats
        stats.maxAgendaSize = Math.max(stack.length, stats.maxAgendaSize);
        stats.elementsProcessed++;
        // add execution time
        end = window.performance.now();
        delta = end - start;
        stats.execTime += delta;
        // check if execution was interrupted
        if (id != currentRunId)
            return null;
        // sleep
        sleepAccum += sleepMult * delta;
        if (sleepAccum > 15) {
            callbackSolving(g);
            await sleepAsync(sleepAccum);
            sleepAccum = 0;
        }
    }

    callbackSolved(g);

    return stats;
}

/*
    A* and Best-first
    The last parameter is a string that controls which algorithm and
    heuristic are used.
    examples of possible values:
    'astar euclid' -> a* with euclidean heuristic
    'bestf manhattan' ->  best first with manhattan heuristic
    'astar none' -> a* without heuristic, aka. Dijkstra
*/
async function genericSearch(g, callbackSolving, callbackSolved, id, params) {
    let heuristicFunc = function (a) {return 0;};
    let cmpFunc = function (a, b) {return 0;};
    let heuristics = {};
    let cmps = {};

    cmps["astar"] = function (a, b) {
        return a.g + a.h - (b.g + b.h);
    };
    cmps["bestf"] = function (a, b) {
        return a.h - b.h;
    };

    heuristics["mindist"] = function (a, b) {
        let dx = Math.abs(a.c - b.c);
        let dy = Math.abs(a.r - b.r);
        let min = Math.min(dx, dy);
        return min*root + Math.abs(dx-dy);
    };
    heuristics["euclid"] = function (a, b) {
        let dx = a.c - b.c;
        let dy = a.r - b.r;
        return Math.sqrt(dx*dx + dy*dy);
    };
    heuristics["manhattan"] = function (a, b) {
        let dx = Math.abs(a.c - b.c);
        let dy = Math.abs(a.r - b.r);
        return dx+dy;
    };
    heuristics["none"] = function (a, b) {
        return 0;
    };

    let [algoParam, heuristicParam] = params.split(' ');
        cmpFunc = cmps[algoParam];
        heuristicFunc = heuristics[heuristicParam];

    let pq = new PQueue(cmpFunc);

    pq.enqueue({r: g.start.r, c: g.start.c, g: 0, h: heuristicFunc(g.start, g.end)});

    let stats = {maxAgendaSize: 1, elementsProcessed: 1, execTime: .0};
    let sleepAccum = .0, start = .0, end = .0, delta = .0;
    while (pq.length() > 0) {
        start = window.performance.now();

        // ----- CORE ALGORITHM ITERATION -----
        pos = pq.dequeue();
        if (pos.g < g.get(pos.r, pos.c).w) {
            // update previous pointer and cost
            g.get(pos.r, pos.c).w = pos.g;
            g.get(pos.r, pos.c).prev = pos.prev;
            // reached the end?
            if (pos.r == g.end.r && pos.c == g.end.c) {
                pq.clear();
                break;
            }
            // add neighbors to agenda
            neighbors = g.listNeighbors(pos);
            for (let j = 0; j < neighbors.length; j++) {
                ne = neighbors[j];
                if (g.get(ne.r, ne.c).visitedVal != PROCESSED) {
                    ne.g = pos.g + ne.w;
                    ne.h = heuristicFunc(ne, g.end);
                    ne.prev = pos;
                    g.get(ne.r, ne.c).visitedVal = VISITED;
                    pq.enqueue(ne);
                }
            }
            g.get(pos.r, pos.c).visitedVal = PROCESSED;
            stats.elementsProcessed++;
        }
        // ===== END CORE ALGORITHM ITERATION =====

        // update stats
        stats.maxAgendaSize = Math.max(pq.length(), stats.maxAgendaSize);
        // add execution time
        end = window.performance.now();
        delta = end - start;
        stats.execTime += delta;
        // check if execution was interrupted
        if (id != currentRunId)
            return null;
        // sleep
        sleepAccum += sleepMult * delta;
        if (sleepAccum > 15) {
            callbackSolving(g);
            await sleepAsync(sleepAccum);
            sleepAccum = 0;
        }
    }

    callbackSolved(g);

    return stats;
}
