'use strict'

// Mine Sweeper
var gBoard;
// Keeps track of game counters
var gState;
// Constants of the game board difficulty
var gLevel = {
    DIFF: 'HARD',
    SIZE: 12,
    MINES: 28
};
// Constants of the cell types
const MINE = 'mine';
const NUM = 'number';

// Constants of the time counter
var gSecsInterval;
var gTimePassed;

// Scores global
var gScores;

// TODO YARON   V    Use consts for cell types
//              V    Better remove the ‘blank’ and use ‘number’ : 0 
//              ??    142-151 should better reuse code
//              V    expandRevealed should use negs loop
//              V    Lines 263-267 code duplication
//              V    Nice usage of localStorage but could be more reusable 
//                   (assign to an object than only once strigify and localStorage assignment)

// TODO >>>> (*next lines are to shorten the code not effect gameplay*) <<<<
//      >>>> make a function to check if marked and remove (marked and hidden and hiddennumber and adjust counters <<<<
//      >>>> will probably need another function (get element from coors) <<<<
//      >>>> also another function to remove marked and revealed <<<<

///////// *** Initializes The Game
function initGame() {
    // Resets the timer interval if it was running, and HTML texts
    if (gSecsInterval) clearInterval(gSecsInterval);
    gSecsInterval = undefined;
    gState = { markedAllCount: 0, markedMinesCount: 0, isOver: false };
    gTimePassed = 0;
    document.querySelector('.gameOver').innerText = '';
    document.querySelector('.gameTimer').innerText = '';

    // Define highscores in localStorage if it's the first game'
    if (localStorage['MineScores'] === undefined) {
        gScores = {
            EASY: [{
                name: 'Trumpizi',
                timeScore: 2016
            },
            {
                name: 'Clintonizi',
                timeScore: 2016
            }
            ],
            MEDIUM: [{
                name: 'Trumpmed',
                timeScore: 2016
            },
            {
                name: 'Clintonmed',
                timeScore: 2016
            }
            ],
            HARD: [{
                name: 'Trumpard',
                timeScore: 2016
            },
            {
                name: 'Clintonard',
                timeScore: 2016
            }
            ],
        }

    } else gScores = JSON.parse(localStorage['MineScores']);

    // Adjusts difficulty setting if it was chosen already this session. 
    // If not, it stays on Hard. Updates DOM.
    if (sessionStorage.gLevel) gLevel = JSON.parse(sessionStorage.gLevel);
    var selector = '';

    if (gLevel.DIFF === 'HARD') selector = 'hardButton';
    else if (gLevel.DIFF === 'MEDIUM') selector = 'mediumButton';
    else if (gLevel.DIFF === 'EASY') selector = 'easyButton';
    document.querySelector('#' + selector).classList.add('chosenDifficulty');

    // Loads the board
    buildBoard(gLevel.SIZE, gLevel.MINES);
    renderBoard(gBoard, '.gameBoard');
    // Loads  the scores board with current scores from localStorage
    renderScores(false);
} // *** End of initGame

///////// *** Builds The Model -> Board With Given Size(SIZE*SIZE) And Number Of Mines (MINES)
/////////     Puts An Object In Every Cell Of The Model
function buildBoard(size, minesNum) {
    // get an array of all the mines coords
    var minesCoords = getMinesCoords(size, minesNum);
    // build game board and put an X where a mine should be
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            // cell counter runs from 0-15
            var cellCounter = i * size + j;
            // if found a match - put a mine in the cell and shift the minesCoords array,
            // else put a blank cell
            if (cellCounter === minesCoords[0]) {
                board[i][j] = {
                    type: MINE,
                    isRevealed: false,
                    isMarked: false
                };
                minesCoords.shift();
            } else {
                board[i][j] = {
                    type: NUM,
                    isRevealed: false,
                    isMarked: false
                };
            }
        }
    }
    // assign numbers to cells neighbouring mines
    setMinesNegsCount(board);

    gBoard = board;
} // *** End of buildBoard

///////// *** Returns An Array With The Random Coords (numbers 0 to [SIZE^2 - 1]) Of Where Mines Should Be Put
function getMinesCoords(size, minesNum) {
    var minesCoords = [];
    var tempNums = [];
    // build array to pull numbers from
    for (var l = 0; l < size * size; l++) {
        tempNums.push(l);
    }
    // pull numbers by random index, as many as specified by MINES then sort new array
    for (var k = 0; k < minesNum; k++) {
        var nextMineCoord = tempNums.splice(getRandomInt(0, tempNums.length - 1), 1);
        minesCoords.push(nextMineCoord[0]);
    }
    minesCoords.sort(function (a, b) {
        return a - b;
    });

    return minesCoords;
} // *** End of getMinesCoords

///////// *** Changes The Cell (which is an obj) To Display Number Of Neighbouting Mines (if there are any)
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            // only check neighbours this for cells that dont have mines in them
            if (board[i][j].type !== MINE) {
                board[i][j].num = countNegs(board, i, j);
            }
        }
    }
} // *** End of setMinesNegsCount

///////// *** Counts The Number of Neighbouring Mines Of A Given Cell
function countNegs(board, cellI, cellJ) {
    var negsCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            // dont check middle cell or out of the gameboard
            if ((i === cellI && j === cellJ) ||
                (i < 0 || i > board.length - 1) ||
                (j < 0 || j > board.length - 1)) continue;
            if (board[i][j].type === MINE) negsCount++;
        }
    }
    return negsCount;
} // *** End of countNegs

///////// *** Renders The Board To DOM
function renderBoard(board, elSelector) {
    var strHtml = '';
    // this variable assigns a running-number (counter) #id to all cells in the HTML table,
    // so their coords will be recognizable later on 
    var tdId = 0;
    board.forEach(function (cells, i) {
        strHtml += '<tr>';
        cells.forEach(function (cell, j) {
            // differernt HTML tags depending on cell.type
            switch (cell.type) {
                case MINE:
                // case 'blank':
                    strHtml += '<td id="' + tdId + '" onclick="cellClicked(this)" ' +
                        'oncontextmenu="cellMarked(this);return false;" ' +
                        'class="hidden ' + cell.type + '"></td>';
                    break;
                case NUM:
                    if (!cell.num) {
                         strHtml += '<td id="' + tdId + '" onclick="cellClicked(this)" ' +
                        'oncontextmenu="cellMarked(this);return false;" ' +
                        'class="number num' + cell.num + ' hidden"></td>';
                    } else {
                        strHtml += '<td id="' + tdId + '" onclick="cellClicked(this)" ' +
                            'oncontextmenu="cellMarked(this);return false;" ' +
                            'class="number num' + cell.num + ' hidden"><span class="hiddennumber">' + cell.num + '</span></td>';
                    }
            }
            tdId++;

        });
        strHtml += '</tr>';
    });
    // print into the HTML element
    var elMat = document.querySelector(elSelector);
    elMat.innerHTML = strHtml;
} // *** End of renderBoard

///////// *** Updates Model And DOM After Every Click On A Cell
function cellClicked(elCell) {
    // Checks if game is over already, or if cell is flagged -> Do Not reveal!
    if (gState.isOver || elCell.classList.contains('marked')) return;
    // if this is the first click (left or right) in the game -> start timer
    if (!gSecsInterval) startTime();

    // get cell coords by #id
    var cellId = elCell.id;
    var cellI = parseInt(cellId / gLevel.SIZE);
    var cellJ = (cellId % gLevel.SIZE);
    var currModelCell = (gBoard[cellI][cellJ]);
    // updates to make if cell is a number
    if (currModelCell.type === NUM && currModelCell.num > 0 && !currModelCell.isRevealed) {
        currModelCell.isRevealed = true;
        elCell.firstElementChild.classList.remove('hiddennumber');
        elCell.classList.remove('hidden');
        // updates to make if cell is a mine
    } else if (currModelCell.type === MINE) {
        currModelCell.isRevealed = true;
        elCell.classList.remove('hidden');
        elCell.classList.add('exploded');
        // if a mine was clicked the game is over!
        setTimeout(function () {
            checkGameOver(true);
        }, 300);
        // updates to make if cell is empty
    } else if (!currModelCell.isRevealed ) {
        elCell.classList.remove('hidden');
        // expands the revealed cells
        expandRevealed(cellI, cellJ);
        currModelCell.isRevealed = true;
    }
} // *** End of cellClicked

///////// *** Starts The Time Counter In Model And DOM
function startTime() {
    var elGameTimer = document.querySelector('.gameTimer');
    gSecsInterval = setInterval(function () {
        gTimePassed++;
        updateTime(elGameTimer);
    }, 100);
} // *** End of startTime

///////// *** Updates The Time Counter In Model And DOM
function updateTime(elGameTimer) {
    if (gTimePassed > 0) {
        elGameTimer.innerHTML = gTimePassed / 10 + '<span class="secondsSmall"> seconds</span>';
    } else {
        elGameTimer.innerText = '';
    }
} // *** End of updateTime

///////// *** Expands The Revealed Blank Cells if A Blank Cell Was Clicked
function expandRevealed(cellI, cellJ) {
    // stop conditions for recursion
    if (cellI < 0 || cellI > gLevel.SIZE - 1 || // out of board
        cellJ < 0 || cellJ > gLevel.SIZE - 1 || // out of board
        gBoard[cellI][cellJ].isRevealed      || // already revealed
        gBoard[cellI][cellJ].isMarked        || // is flagged
        gBoard[cellI][cellJ].type === MINE   )  return; // is a mine
    //get cellId from current indexes
    var cellId = cellI * gLevel.SIZE + cellJ;
    //get cell DOM element by cellId
    var elCell = document.getElementById(cellId);

    // if a number -> reveal and update Model and DOM
    if (gBoard[cellI][cellJ].type === NUM && gBoard[cellI][cellJ].num > 0) {
        gBoard[cellI][cellJ].isRevealed = true;
        elCell.classList.remove('hidden');
        elCell.firstElementChild.classList.remove('hiddennumber');

        // if a blank cell -> reveal and update Model and DOM -> then go into recursion to expand more
    } else {
        gBoard[cellI][cellJ].isRevealed = true;
        elCell.classList.remove('hidden');
        for (var i = cellI - 1; i <= cellI + 1; i++) {
            for (var j = cellJ - 1; j <= cellJ + 1; j++) {
                expandRevealed(i, j);
            }
        }
    }
} // *** End of expandRevealed

///////// *** Updates Model And DOM After Every Left-Click On A Cell
function cellMarked(elCell) {

    // Checks if game is over already
    if (gState.isOver) return;
    // if this is the first click (left or right) in the game -> start timer
    if (!gSecsInterval) startTime();

    // get cell coords by #id
    var cellId = elCell.id;
    var cellI = parseInt(cellId / gLevel.SIZE);
    var cellJ = (cellId % gLevel.SIZE);
    var currModelCell = (gBoard[cellI][cellJ]);

    // don't do anything if cell is already cleared
    if (!currModelCell.isRevealed) {
        // make opposite updates if cell is marked already or not
        if (!currModelCell.isMarked) {
            currModelCell.isMarked = true;
            // global counter of total marked cells
            gState.markedAllCount++;
            elCell.classList.add('marked');
            // global counter of only marked mines
            if (currModelCell.type === MINE) gState.markedMinesCount++;
        } else {
            currModelCell.isMarked = false;
            gState.markedAllCount--;
            elCell.classList.remove('marked');
            if (currModelCell.type === MINE) gState.markedMinesCount--;
        }
    }
    // check if game was won (all AND only mines are marked)
    checkGameOver();
    // console.log('gState.markedCount',gState.markedMinesCount);
    // console.log('gState.markedAllCount',gState.markedAllCount);

    return false;
} // *** End of cellMarked

///////// *** Checks If The Game Is Over By Either 1 Of 2 Conditions
function checkGameOver(isMineDetonated) {
    // checks if a mine clicked
    if (isMineDetonated) {
        reportGameOver('GAME OVER');
        // checks if all AND only mines were marked
    } else if (gState.markedAllCount === gLevel.MINES && gState.markedMinesCount === gLevel.MINES) {
        reportGameOver('Congratulations! You Won');
        // Check if a new high score
        if (checkNewScore()) {
            // Render scores board with the new score
            renderScores(true);
        }
    }
} // *** End of checkGameOver

///////// *** Announces Result Of Game And Reveals  the Board
function reportGameOver(res) {
    // stops timer
    clearInterval(gSecsInterval);
    // reveals whole board and announce result
    revealBoard();
    gState.isOver = true;
    var elGameOver = document.querySelector('.gameOver');
    elGameOver.innerText = res;
} // *** End of reportGameOver

///////// *** Reveals The Whole Board
function revealBoard() {
    removeSelectorAll('hidden');
    removeSelectorAll('hiddennumber');
    removeSelectorAll('marked');
} // *** End of revealBoard

///////// *** Removes A Class From All HTML Elements
function removeSelectorAll(selector) {
    var elNodeList = document.querySelectorAll('.' + selector);
    for (var i = 0; i < elNodeList.length; i++) {
        elNodeList[i].classList.remove(selector);
        // if (selector === 'marked') {
        //     elNodeList[i].classList.add('wasMarked');
        // }
    }

} // *** End of removeSelector

///////// *** Changes Difficulty Setting As Was Chosen By The Player
function changeDifficulty(elButton) {
    if (elButton.classList.contains('chosenDifficulty')) return;
    else {
        // Checks which difficulty was chosen and updates sessionStorage (thus updating the Model later)
        switch (elButton.id) {
            case 'easyButton':
                sessionStorage.gLevel = JSON.stringify({ DIFF: 'EASY', SIZE: 6, MINES: 4 });
                break;
            case 'mediumButton':
                sessionStorage.gLevel = JSON.stringify({ DIFF: 'MEDIUM', SIZE: 9, MINES: 12 });
                break;
            case 'hardButton':
                sessionStorage.gLevel = JSON.stringify({ DIFF: 'HARD', SIZE: 12, MINES: 28 });
        }
        // Some of the updates to DOM (another one inside initGame())
        var elPrevDifficulty = document.querySelector('.chosenDifficulty');
        if (elPrevDifficulty) elPrevDifficulty.classList.remove('chosenDifficulty');

        // Resets the game if the difficulty was changed
        initGame();
    }
} // *** End of changeDifficulty

///////// *** toggle The Rules
function toggleRules() {
    document.querySelector('.rulesDropDown').classList.toggle('show');
} // *** End of toggleRules

///////// *** Checks if there's a new high score
function checkNewScore() {
    var isNewScore = true;
    var scores = gScores[gLevel['DIFF']];

    // Add new score if less than 5 scores
    if (scores.length < 5) return isNewScore;
    // Checks if a new score if already there are 5 scores
    isNewScore = scores.some(function (score) {
        return (gTimePassed / 10 < score.timeScore);
    });

    return isNewScore;
} // *** End of checkNewScore

///////// *** Renders The Scores Board To DOM
function renderScores(shouldUpdateScores) {

    // Updates localStorage only if it's a new score
    if (shouldUpdateScores) getNewScores();

    var strHtml = '';
    var scores = gScores[gLevel['DIFF']];

    for (var i = 0; i < scores.length; i++) {
        strHtml += '<tr>';
        strHtml += '<td>#' + (i + 1) + '</td><td>' + scores[i].name +
            '</td><td> ' + scores[i].timeScore +
            '<span class="secondsSmall"> seconds</span></td>';
        strHtml += '</tr>';
    }

    // print into the HTML element
    var elMatHeader = document.querySelector('.scoresDifficulty');
    elMatHeader.innerHTML = 'Difficulty: ' + gLevel.DIFF;
    var elMat = document.querySelector('.scoreBoard');
    elMat.innerHTML = strHtml;
} // *** End of renderScores

///////// *** Gets the details of the new high score from user and update the localStorage
function getNewScores() {
    var newScoreName = prompt('Enter your name: (up to 10 characters)');
    while (newScoreName.length > 10) {
        newScoreName = prompt('The name you entered was too long. Enter your name: (up to 8 characters)');
    }
    var scores = gScores[gLevel['DIFF']];

    var newScores = scores.reduce(function (acc, b) {
        if (gTimePassed / 10 < b.timeScore) {
            acc.push({ name: newScoreName, timeScore: gTimePassed / 10 });
            gTimePassed = Infinity;
            acc.push(b);
        } else acc.push(b);
        return acc;
    }, []);
    if (newScores.length > 5) newScores.pop();

    gScores[gLevel['DIFF']] = newScores;
    localStorage['MineScores'] = JSON.stringify(gScores);
} // *** End of getNewScores

///////// *** toggle The Rules
function toggleLeaderboard() {
    document.querySelector('.scoresDropDown').classList.toggle('show');
} // *** End of toggleRules

// For debugging -> just reveals the numbers, doesn't affect the game
function revealNumbersTEST() {
    removeSelectorAll('hiddennumber');
}