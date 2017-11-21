
const NOT_VISITED = 0;
const VISITED = 1;
const PROCESSED = 2;

var screenCanvas;
var canvas;
var grids = [];
var ppc = 1;
var interactive = 1;
var selectedIndex = 0;
var currentRunId;
var solverLock = 0;
var sleepMult = 1;
var inputCnt = 1;

var caseNames = ["DFS-idiosyncrasy"];
var stringCases = [
"10 10\n"+
"**********\n"+
"*****----*\n"+
"****--**-*\n"+
"***--***-*\n"+
"*#******-$\n"+
"********-*\n"+
"********-*\n"+
"********-*\n"+
"*--------*\n"+
"**********\n"

];

// Integer random belonging to [a, b)
function rand(a, b) {
    return Math.floor(Math.random()*(b-a)) + a;
}

function stopRunningAndCall(func) {
    if (solverLock) {
        currentRunId = Math.random();
        setTimeout(() => {stopRunningAndCall(func)}, 50);
        return;
    }
    func();
}

async function _run(tr, algo) {
    solverLock = 1;
    grids[selectedIndex].clear();
    let stats;
    switch (algo) {
        case 'bfs':
            stats = await bfs(grids[selectedIndex], drawMidSolution, drawEndSolution, currentRunId);
            break;
        case 'dfs':
            stats = await dfs(grids[selectedIndex], drawMidSolution, drawEndSolution, currentRunId);
            break;
        default:
            stats = await genericSearch(grids[selectedIndex], drawMidSolution, drawEndSolution, currentRunId, algo);
            break;
    }
    if (stats) {
        let cost = pathCost(grids[selectedIndex]);
        let effectiveCost = (cost.straight + root*cost.diag).toFixed(2);
        console.log("straight moves:", cost.straight, "diagonal moves:", cost.diag);
        tr.getElementsByTagName('td')[2].innerHTML = stats.maxAgendaSize;
        tr.getElementsByTagName('td')[3].innerHTML = stats.elementsProcessed;
        tr.getElementsByTagName('td')[4].innerHTML = effectiveCost;
            //""+cost.straight+" + " +cost.diag+ " &#x221a;2" + " = "+effectiveCost;
        tr.getElementsByTagName('td')[5].innerHTML = stats.execTime.toFixed(2);
        console.log(stats);
    }
    solverLock = 0;
}

function updateSpeed() {
    sleepMult = 11 - document.getElementById("speed").value;
    sleepMult = Math.pow(2, sleepMult);
    console.log("delay:", sleepMult);
}

function run(e, algo) {
    let tr = e.target.parentNode.parentNode;
    stopRunningAndCall(() => {_run(tr, algo)});
}

function _readInput(inputString) {
    let lines = inputString.split('\n');
    let dimens = lines[0].split(' ');
    let g = new Grid(parseInt(dimens[0]), parseInt(dimens[1]));
    for (let i = 0; i < g.rows; i++) {
        for (let j = 0; j < g.cols; j++) {
            g.get(i, j).val = lines[i+1][j] == '-' ? 1 : 0;
            if (lines[i+1][j] == '#') {
                g.start.r = i;
                g.start.c = j;
            }
            if (lines[i+1][j] == '$') {
                g.end.r = i;
                g.end.c = j;
            }
        }
    }
    return g;
}

function readInput(evt) {
    let files = evt.target.files;
    for (let i = 0; i < files.length; i++) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let g = _readInput(e.target.result);
            addTestCase('Input '+inputCnt++, g);
            useCase(grids.length-1);
        }
        reader.readAsText(files[i]);
    }
}

function clearTable() {
    let trs = document.getElementsByTagName('tr');
    for (let i = 1; i < trs.length; i++) {
        let tds = trs[i].getElementsByTagName('td');
        tds[2].innerHTML = "";
        tds[3].innerHTML = "";
        tds[4].innerHTML = "";
        tds[5].innerHTML = "";
    }
}

function useCase(index) {
    stopRunningAndCall(() => {
        grids[index].clear();
        selectedIndex = index;
        drawMidSolution(grids[index]);
        clearTable();
    });
}

function addTestCase(name, g) {
    let div = document.createElement("div");
    div.classList.add("opt");
    div.innerHTML = name;
    grids.push(g);
    let a = grids.length - 1;
    div.addEventListener('click', function() {
        useCase(a);
    });
    document.getElementById("list").appendChild(div);
}

function _recurBisection(g, ac, bc, ar, br, min, dir) {
    if (br-ar <= min || bc-ac <= min)
        return;
    let r = rand(ar, br+1);
    let c = rand(ac, bc+1);
    r -= r%2;
    c -= c%2;
    if (dir) {
        for (let i = ar; i <= br; i++)
            g.set(i, c, 1);
        _recurBisection(g, ac, c-1, ar, br, min, 1-dir);
        _recurBisection(g, c+1, bc, ar, br, min, 1-dir);
        g.set(r, c+1, 0);
        g.set(r, c  , 0);
        g.set(r, c-1, 0);
    } else {
        for (let i = ac; i <= bc; i++)
            g.set(r, i, 1);
        g.set(r, c, 0);
        _recurBisection(g, ac, bc, ar, r-1, min, 1-dir);
        _recurBisection(g, ac, bc, r+1, br, min, 1-dir);
        g.set(r+1, c, 0);
        g.set(r  , c, 0);
        g.set(r-1, c, 0);
    }
}

function _generateMazeBisec(rows, cols) {
    let g = new Grid(rows, cols);

    _recurBisection(g, 0, cols-1, 0, rows-1, 0, 1);

    let starts = [[1, 1], [2, 1], [1, 2], [2, 2]];

    for (let i = 0; i < starts.length; i++) {
        let s = starts[i];
        if (g.get(s[0], s[1]).val == 0) {
            g.start.r = s[0]; g.start.c = s[1];
            break;
        }
    }
    for (let i = 0; i < starts.length; i++) {
        let s = starts[i];
        if (g.get(rows-1-s[0], cols-1-s[1]).val == 0) {
            g.end.r = rows-1-s[0]; g.end.c = cols-1-s[1];
            break;
        }
    }

    return g;
}

function generateMazeBisec() {
    for (let i = 0; i < 5; i++) {
        addTestCase("Bisection " + (i+1), _generateMazeBisec(30+30*i, 30+30*i));
    }
}

function generateEmptyGrid() {
    let g = new Grid(20, 20);
    g.start = {r: 1, c: 1};
    g.end = {r: 14, c: 18};
    addTestCase("Empty", g);
}


function pathCost(g) {
    cost = {straight: 0, diag: 0};
    let prev;
    let pos = g.end;
    while (!(pos.r == g.start.r && pos.c == g.start.c)) {
        prev = g.get(pos.r, pos.c).prev;
        if (pos.r == prev.r || pos.c == prev.c)
            cost.straight++;
        else
            cost.diag++;
        pos = prev;
    }
    return cost;
}

function drawPath(g) {
    let ctx = canvas.getContext('2d');
    let pos = g.get(g.end.r, g.end.c).prev;
    ctx.fillStyle = '#9739ef';
    while (!(pos.r == g.start.r && pos.c == g.start.c)) {
        ctx.fillRect(pos.c*ppc, pos.r*ppc, ppc, ppc);
        pos = g.get(pos.r, pos.c).prev;
    }
}

function drawSolutionSoFar(g) {
    canvas.width = g.cols * ppc;
    canvas.height = g.rows * ppc;

    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#464646';
    for (let i = 0; i < g.rows; i++)
        for (let j = 0; j < g.cols; j++)
            if (g.get(i, j).val == 1)
                ctx.fillRect(j*ppc, i*ppc, ppc, ppc);
    ctx.fillStyle = '#3a3';
    for (let i = 0; i < g.rows; i++)
        for (let j = 0; j < g.cols; j++)
            if (g.get(i, j).visitedVal == VISITED)
               ctx.fillRect(j*ppc, i*ppc, ppc, ppc);
    ctx.fillStyle = '#56ea8a';
    for (let i = 0; i < g.rows; i++)
        for (let j = 0; j < g.cols; j++)
            if (g.get(i, j).visitedVal == PROCESSED)
               ctx.fillRect(j*ppc, i*ppc, ppc, ppc);

    ctx.fillStyle = '#367ced';
    ctx.fillRect(g.start.c*ppc, g.start.r*ppc, ppc, ppc);
    ctx.fillStyle = '#f49e42';
    ctx.fillRect(g.end.c*ppc, g.end.r*ppc, ppc, ppc);
}

function drawOnScreen() {
    if (screenCanvas.width != screenCanvas.clientWidth ||
        screenCanvas.height != screenCanvas.clientHeight) {
        screenCanvas.width = screenCanvas.clientWidth;
        screenCanvas.height = screenCanvas.clientHeight;
    }
    let ctx2 = screenCanvas.getContext('2d');
    ctx2.mozImageSmoothingEnabled = false;
    ctx2.webkitImageSmoothingEnabled = false;
    ctx2.msImageSmoothingEnabled = false;
    ctx2.imageSmoothingEnabled = false;
    ctx2.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
    sy = screenCanvas.height / canvas.height;
    sx = screenCanvas.width / canvas.width
    if (sx < sy) {
        let remaining = screenCanvas.height - sx*canvas.height;
        ctx2.drawImage(canvas, 0, remaining/2, sx*canvas.width, sx*canvas.height);
    } else {
        let remaining = screenCanvas.width - sy*canvas.width;
        ctx2.drawImage(canvas, remaining/2, 0, sy*canvas.width, sy*canvas.height);
    }
}

function drawMidSolution(g) {
    drawSolutionSoFar(g);
    drawOnScreen();
}

function drawEndSolution(g) {
    drawSolutionSoFar(g);
    drawPath(g);
    drawOnScreen();
}

function main() {
    canvas = document.createElement("canvas");
    screenCanvas = document.getElementById("mainCanvas");
    console.log("canvas dimensions:", screenCanvas.clientWidth, screenCanvas.clientHeight);
    screenCanvas.width = screenCanvas.clientWidth;
    screenCanvas.height = screenCanvas.clientHeight;

    screenCanvas.getContext('2d').mozImageSmoothingEnabled = false;
    screenCanvas.getContext('2d').webkitImageSmoothingEnabled = false;
    screenCanvas.getContext('2d').msImageSmoothingEnabled = false;
    screenCanvas.getContext('2d').imageSmoothingEnabled = false;
    canvas.getContext('2d').mozImageSmoothingEnabled = false;
    canvas.getContext('2d').webkitImageSmoothingEnabled = false;
    canvas.getContext('2d').msImageSmoothingEnabled = false;
    canvas.getContext('2d').imageSmoothingEnabled = false;
    /* Add grids to the list of options */
    generateMazeBisec();
    generateEmptyGrid();

    for (let i = 0; i < stringCases.length; i++) {
        let g = _readInput(stringCases[i]);
        addTestCase(caseNames[i], g);
    }

    drawMidSolution(grids[0]);
    updateSpeed();
}


window.onload = main;


function save() {
    open(canvas.toDataURL());
}
