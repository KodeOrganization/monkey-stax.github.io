//Game setup
canvas = document.getElementById("gameCanvas");
ctx = canvas.getContext("2d");

backgroundCanvas = document.getElementById("backgroundCanvas");
backgroundCtx = backgroundCanvas.getContext("2d");
backgroundCanvas.width = 515;
backgroundCanvas.height = 900;

backgroundColorInput = document.getElementById("backgroundColorInput");
blockColorInput = document.getElementById("blockColorInput");
class Game{
    constructor() {
        this.state = ""
        this.hitAudio = new Audio('assets/hit.mp3');
        this.whoaAudio = new Audio('assets/whoa.mp3');
        this.ohNoAudio = new Audio('assets/oh no.mp3');
        this.winAudio = new Audio('assets/win.mp3');
        this.loseAudio = new Audio('assets/lose.mp3');

        this.nRows = 12;
        this.nCols = 7;
        canvas.width = 515;
        canvas.height = 900;
        this.xBlockSize = canvas.width / this.nCols;
        this.yBlockSize = canvas.height / this.nRows;

        this.nValues = [4,4,4,3,3,3,2,2,2,1,1,1]
        this.speedValues = [10,10,9,8,8,7,7,6,6,5,4,3]

    }
    init(){
        this.rows = [];
        this.level = 0;

        this.gameFrame = 0;
        this.currentY = this.nRows - 1;
        this.rows.push(new BlockRow(this,this.currentY, this.nValues[this.level],this.speedValues[this.level],this.xBlockSize,this.yBlockSize));
        this.currentY--;
        this.level++;
        this.state = "playing";
        this.n = this.nValues[this.level];
        this.dyingBlocks = [];

        this.blockColor = blockColorInput.value;
        this.backgroundColor = backgroundColorInput.value;
        drawBackground();
    }
    update(){
        this.gameFrame++;
        this.rows.forEach(row => {
            row.update();
        });
        if (this.state == "killing" && this.dyingBlocks.length == 0){
            this.state = "playing";
                if (this.n == 0) {
                    this.state = ""
                    this.loseAudio.play();
                    loseGame();
                    return;
                }
            this.spawnNextRow();
        }

        }

    draw(){

        //Draw blocks
        this.rows.forEach(row => {
            row.draw();
        })
        //Draw text centered
        ctx.fillStyle = "white";
        ctx.font = "50px TruenoFont";
        ctx.textAlign = "center";
        ctx.letterSpacing = "5px";
        let y = 5 * this.yBlockSize - 20;
        let x = canvas.width / 2;
        ctx.fillText("TICKET LEVEL", x, y);

        y = 1 * this.yBlockSize - 20;
        x = canvas.width / 2;
        ctx.fillText("MAJOR PRICE", x, y);
    }

    spawnNextRow(){
        let blockRow = new BlockRow(this,this.currentY, this.n,this.speedValues[this.level],this.xBlockSize,this.yBlockSize);
        this.rows.push(blockRow);
        this.currentY--;
        this.level++;
    }
    nextBlock(){
        if (this.state == "killing") {
            return;
        }

        let lastRow = this.rows[this.rows.length - 1];
        lastRow.isMoving = false;
        if (this.rows.length > 1) {
            let row1 = this.rows[this.rows.length - 2];
            let row1Cols = [];
            row1.blocks.forEach(block => {
                row1Cols.push(block.col);
            })

            //For backwards loop
            for (let i = lastRow.blocks.length - 1; i >= 0; i--){
                let block = lastRow.blocks[i];
                let col = block.col;
                if (!row1Cols.includes(col) || col < 0 || col >= this.nCols) {
                    lastRow.kill(i);
                    this.state = "killing";
                }
            }
        } else if (this.rows.length == 1) {
            let firstRow = this.rows[0];
            for (let i = firstRow.blocks.length - 1; i >= 0; i--){
                let block = firstRow.blocks[i];
                let col = block.col;
                if ( col < 0 || col >= this.nCols) {
                    firstRow.kill(i);
                    this.state = "killing";
                }
            }
        }

        if (this.state == "killing") {
            this.ohNoAudio.play();
        } else {
            this.whoaAudio.cloneNode(true).play();
        }



        this.n = this.nValues[this.level];
        if (lastRow.blocks.length < this.n || this.n === undefined) {
            this.n = lastRow.blocks.length;
        }
        if (this.level == this.nValues.length && lastRow.blocks.length > 0) {
            this.state = ""
            this.winAudio.play();
            winGame();
            //Reset game
            //this.init();
            return;
        }
        if (this.state == "killing") {
            return;
        }
        this.spawnNextRow();
    }

}
// Block
class Block{
    constructor(parentRow,x,y,xSize,ySize,row,col) {
        this.parentRow = parentRow;
        this.xSize = xSize;
        this.ySize = ySize;
        this.x = x * this.xSize;
        this.y = y * this.ySize;
        this.row = row;
        this.col = col;
        this.isDying = false;
        this.isDead = false;
        this.reachedBottom = false;
        this.flashes = 0;
    }

    draw(){
        if (this.reachedBottom) {
            if ((this.flashes +1 )% 2 == 0) {
                return;
            }

        }
        ctx.fillStyle = this.parentRow.parentGame.blockColor;
        ctx.beginPath();
        ctx.fillRect(this.x, this.y, this.xSize, this.ySize);
        ctx.closePath();
        //Add border
        ctx.strokeStyle = "rgb(255,255,255)";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.xSize, this.ySize);
        //Draw coords
        //ctx.fillStyle = "black";
        //ctx.font = "20px Arial";
        //ctx.fillText(this.row + "," + this.col, this.x + this.size / 2 - 20, this.y + this.size / 2 + 10);
    }

    move(){
        if (this.isDying) {
            if (!this.reachedBottom){
                this.y += this.ySize;
                this.row += 1;
                if (this.y + 2 * this.ySize> canvas.height) {
                    this.reachedBottom = true;
                }
                for (let i = this.parentRow.parentGame.rows.length - 1; i >= 0; i--){
                    let row = this.parentRow.parentGame.rows[i];
                    for (let j = row.blocks.length - 1; j >= 0; j--){
                        let block = row.blocks[j];
                        if (block.col == this.col && block.row == this.row + 1) {
                            this.reachedBottom = true;
                        }
                    }
                }

            } else{
                if (this.flashes < 5) {
                    this.flashes++;
                } else {
                    this.flashes = 0;
                    this.isDead = true;
                }
            }
            return;
        }
        this.x += this.xSize * this.parentRow.direction;
        this.col += this.parentRow.direction;
    }
}
class BlockRow{
    constructor(parentGame,y,n,speed,xSize,ySize) {
        this.parentGame = parentGame;
        this.speed = speed;
        this.blocks = [];
        this.startCol = Math.floor(Math.random() * (parentGame.nCols - n));
        for (let i = 0; i < n; i++){
            this.blocks.push(new Block(this,this.startCol + i,y,xSize,ySize,y,this.startCol + i));
        }
        this.leftBlock = this.blocks[0];
        this.rightBlock = this.blocks[this.blocks.length - 1];
        this.direction = Math.random() < 0.5 ? -1 : 1;
        if (this.startCol == 0) {
            this.direction = 1;
        }
        if (this.startCol + n == parentGame.nCols) {
            this.direction = -1;
        }
        this.isMoving = true;
    }
    update(){
        if (this.parentGame.gameFrame % this.speed == 0) {
            let index = this.parentGame.rows.indexOf(this);
            if (index == this.parentGame.rows.length - 1) {
                this.parentGame.dyingBlocks.forEach(block => {
                        block.move();
                        if (block.isDead) {
                            let index = this.parentGame.dyingBlocks.indexOf(block);
                            this.parentGame.dyingBlocks.splice(index, 1);
                        }
                })
            }

            if (this.isMoving){
                this.blocks.forEach(block => {
                    block.move();
                })

                let centerLeftBlock = this.leftBlock.x + this.leftBlock.xSize / 2;
                let centerRightBlock = this.rightBlock.x + this.rightBlock.xSize / 2;

                if (centerRightBlock - this.rightBlock.xSize < 0) {
                    this.direction = 1;
                    this.parentGame.hitAudio.play();
                }
                if (centerLeftBlock + this.leftBlock.xSize > canvas.width){
                    this.direction = -1;
                    this.parentGame.hitAudio.play();
                }
            }

        }
    }
    draw(){
        this.parentGame.dyingBlocks.forEach(block => {
            block.draw();
        });
        this.blocks.forEach(block => {
            block.draw();
        })



    }

    kill(index){
        let block = this.blocks[index];
        block.isDying = true;
        this.parentGame.dyingBlocks.push(block);
        this.blocks.splice(index,1);
    }
}



const game = new Game();

document.addEventListener("touchstart", function (){
    if (game.state == "playing") {
        game.nextBlock();
    }
});

document.body.onkeyup = function(e) {
    if (e.key == " " ||
        e.code == "Space" ||
        e.keyCode == 32
    ) {
        if (game.state == "playing") {
            game.nextBlock();
        }
    }
}
function animate() {
    if (game.state != "") {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        game.update();
        game.draw();

        requestAnimationFrame(animate);
    }
}
//game.init();
//animate();
function startGame(){
    game.init();
    animate();
    startModal.style.display = "none";
}
function winGame(){

    winningModal.style.display = "flex";
    prizeText.innerHTML = prizeInput.innerHTML;
}

function loseGame(){
    losingModal.style.display = "flex";
}

function playAgain(){
    winningModal.style.display = "none";
    losingModal.style.display = "none";
    startModal.style.display = "flex";
}

startModal = document.getElementById("startModal");
prizeInput = document.getElementById("prizeInput");
winningModal = document.getElementById("winningModal");
prizeText = document.getElementById("prizeText");
losingModal = document.getElementById("losingModal");
playButton = document.getElementById("playButton");
playButton.addEventListener("click", function (){
   startGame();
});
playAgainButton = document.getElementById("playAgainButton");
playAgainButton.addEventListener("click", function (){
    playAgain();
} );
playAgainButton2 = document.getElementById("playAgainButton2");
playAgainButton2.addEventListener("click", function (){
    playAgain();
} );
function drawBackground(){
    //draw red background transparent
    backgroundCtx.fillStyle = game.backgroundColor;
    backgroundCtx.fillRect(0,0,canvas.width,canvas.height);
//Draw grid
    backgroundCtx.strokeStyle = "rgb(255,255,255)";
    backgroundCtx.lineWidth = 2;
    backgroundCtx.beginPath();
    for (let i = 0; i <= game.nRows; i++){
        backgroundCtx.moveTo(0, i * game.yBlockSize);
        backgroundCtx.lineTo(canvas.width, i * game.yBlockSize);
    }
    for (let i = 0; i <= game.nCols; i++){
        backgroundCtx.moveTo(i * game.xBlockSize, 0);
        backgroundCtx.lineTo(i * game.xBlockSize, canvas.height);
    }
    backgroundCtx.stroke();
    backgroundCtx.closePath();
}

drawBackground();

