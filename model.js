
const root = Math.sqrt(2);
const adj = [[0, 1, 1], [1, 0, 1], [0, -1, 1], [-1, 0, 1],
            [-1, -1, root], [1, -1, root], [1, 1, root], [-1, 1, root]];


function Grid(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.mat = new Array(cols*rows);
    for (let i = 0; i < cols*rows; i++)
        this.mat[i] = {val: 0, visitedVal: 0, prev: {x: -1, y: -1}, w: 1e10};
    this.start = {r:0, c:0};
    this.end = {r:0, c:0};
    this.isInside = function (r, c) {
        return c >= 0 && c < cols
            && r >= 0 && r < rows;
    }
    this.set = function (r, c, v) {
        if (this.isInside(r, c))
            this.mat[cols*r + c].val = v;
    }
    this.get = function (r, c) {
        return this.mat[cols*r + c];
    }
    this.print = function () {
        out = "";
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                out += (this.get(i, j).val == 0 ? ' ' : '*');
            }
            out += '\n';
        }
        console.log(out);
    }
    this.clear = function () {
        for (let i = 0; i < cols*rows; i++) {
            this.mat[i].visitedVal = NOT_VISITED;
            this.mat[i].prev = {x: -1, y: -1};
            this.mat[i].w = 1e10;
        }
    }
    this.listNeighbors = function (pos) {
        let list = [];
        for (let i = 0; i < adj.length; i++) {
            let next = {r: pos.r + adj[i][0], c: pos.c + adj[i][1], w: adj[i][2]};
            if (this.isInside(next.r, next.c) && this.get(next.r, next.c).val == 0)
                list.push(next);
        }
        return list;
    }
}

function PQueue(cmp) {
    this.arr = [];
    this.parent = function (i) { return (i-1)>>1; }
    this.childL = function (i) { return i*2+1; }
    this.childR = function (i) { return i*2+2; }
    this.cmp = cmp;
    this.siftDown = function (i) {
        let max = 0;
        let cl = this.childL(i);
        let cr = this.childR(i);
        if (cr < this.arr.length)
            max = this.cmp(this.arr[cl], this.arr[cr]) < 0 ? cl : cr;
        else if (cl < this.arr.length)
            max = cl;
        else return;
        if (this.cmp(this.arr[i], this.arr[max]) > 0) {
            let aux = this.arr[i];
            this.arr[i] = this.arr[max];
            this.arr[max] = aux;
            this.siftDown(max);
        }
    }
    this.siftUp = function (i) {
        let p = this.parent(i);
        while (i != 0 && this.cmp(this.arr[i], this.arr[p]) < 0) {
            let aux = this.arr[p];
            this.arr[p] = this.arr[i];
            this.arr[i] = aux;
            i = p;
            p = this.parent(i);
        }
    }
    this.dequeue = function () {
        if (this.arr.length == 0) return null;
        item = this.arr[0];
        this.arr[0] = this.arr.pop();
        this.siftDown(0);
        return item;
    }
    this.enqueue = function (item) {
        this.arr.push(item);
        this.siftUp(this.arr.length-1);
    }
    this.length = function () {
        return this.arr.length;
    }
    this.clear = function () {
        this.arr = [];
    }
}

function Queue() {
    this.arr = [];
    this.i = 0;

    this.dequeue = function () {
        if (this.i == this.arr.length) return null;
        let element = this.arr[this.i++];
        if (this.i > 256) {
            this.arr = this.arr.slice(this.i, this.j);
            this.i = 0;
        }
        return element;
    }
    this.enqueue = function (item) {
        this.arr.push(item);
    }
    this.length = function () {
        return this.arr.length - this.i;
    }
    this.clear = function () {
        this.arr = [];
        this.i = 0;
    }
}
