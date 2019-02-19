/// <reference path='../node_modules/phaser3-docs/typescript/phaser.d.ts'/>
import 'phaser';

import {BootScene} from "./BootScene";
import {HEIGHT, WIDTH} from "./config";
import {TextButton} from "./TextButton";

let isGameSceneLaunched = false;

const bootScene = {
    key: 'loader',
    active: true,
    preload: bootPreload,
    create: bootCreate,
    update: bootUpdate,
};

const gameScene = {
    key: 'game',
    active: false,
    visible: false,
    preload: preload,
    create: create,
    update: update,
};

const hudScene = {
    key: 'hud',
    active: false,
    visible: false,
    preload: hudPreload,
    create: hudCreate,
    update: hudUpdate,
};

const config: GameConfig = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {y: 200},
        },
    },
    // hud rendered after game to ensure controls are visible
    scene: [BootScene, gameScene, hudScene],
};

class State {
    public player: Phaser.Physics.Arcade.Sprite;
    public score: number = 0;
    public scoreText: Phaser.GameObjects.Text;
    public stars: any; // Phaser.Physics.Arcade.StaticGroup;
    public bombs: Phaser.Physics.Arcade.StaticGroup;
    public gameOver: boolean = false;
}

/* tslint:disable-next-line max-classes-per-file */
class Sfx {
    public blaster: Phaser.Sound.BaseSound;
    public explode: Phaser.Sound.BaseSound;
    public background: Phaser.Sound.BaseSound;

    public constructor(game) {
        game.load.audio('blaster', 'assets/blaster.mp3');
        game.load.audio('explode', 'assets/explosion.mp3');
        game.load.audio('background', 'assets/oedipus_ark_pandora.mp3');
    }
}

window.addEventListener("load", () => {
    /* tslint:disable-next-line no-unused-expression */
    new Phaser.Game(config);
    resize();
});

function resize() {
    const canvas = document.querySelector("canvas");
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const gameRatio = WIDTH / HEIGHT;

    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    } else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}

window.addEventListener('resize', () => resize());

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('ground90', 'assets/platform90.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude',
        'assets/dude.png',
        {frameWidth: 32, frameHeight: 48},
    );
    this.load.image('white', 'assets/white.png');

    this.state = new State();
    this.sfx = new Sfx(this);
}

function create() {
    const state: State = this.state;

    // position at center by default
    // this.add.image(400, 300, 'sky');
    // or by setting origin manually

    // tile the sky so it fills the background
    for (let x = 0; x < 2; ++x) {
        for (let y = 0; y < 2; ++y) {
            this.add.image(x * 800, y * 600, 'sky').setOrigin(0, 0);
        }
    }

    // platforms

    // a group of static physics objects - i.e. can't move, not affected by forces
    const platforms = this.physics.add.staticGroup();

    // ground
    // refresh needed after scale to tell the physics world about the change
    platforms.create(800, 1100, 'ground').setScale(4).refreshBody();

    // individual platforms
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    platforms.create(1200, 220, 'ground');
    platforms.create(1200, 400, 'ground');
    platforms.create(100, 900, 'ground');
    platforms.create(400, 950, 'ground');

    // rotated 90 degrees
    // not supported with Arcade physics so have to hack it by updating body (eek!) haven't got it perfect
    const hackedPlatform = platforms.create(800, 700, 'ground').setOrigin(0, 0);
    hackedPlatform.setAngle(90);
    const temp = hackedPlatform.body.width;
    hackedPlatform.body.width = hackedPlatform.body.height;
    hackedPlatform.body.height = temp;
    hackedPlatform.body.x = hackedPlatform.x;
    hackedPlatform.body.y = hackedPlatform.y;

    // or the simple way - use a rotated image (!) not ideal, waste of download, but will this work?
    platforms.create(100, 700, 'ground90');

    // player

    // physics.add... creates a dynamic physics 'body' by default
    state.player = this.physics.add.sprite(100, 450, 'dude');
    state.player.setBounce(0.2);
    state.player.setCollideWorldBounds(true);

    // higher value = quicker fall
    state.player.setGravityY(300);

    // colliders can take optional callbacks, but we don't need this against platforms
    this.physics.add.collider(state.player, platforms);

    this.anims.create({
        key: 'left',
        // n.b. 'dude' was loaded as a sprite sheet, not an image
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20,
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1,
    });

    /*const particles = this.add.particles('white');
    const emitter = particles.createEmitter({
        speed: 100,
        scale: {start: 1, end: 0},
        blendMode: 'ADD',
    });
    emitter.startFollow(player);*/

    // camera & world

    this.physics.world.setBounds(0, 0, 1600, 1200);
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(state.player, true);

    // don't scroll within 50px of edge
    this.cameras.main.setDeadzone(50, 50);

    // stars

    state.stars = this.physics.add.group({
        key: 'star',
        repeat: 11, // group has 1 item in by default, so repeating 11 times gives 12 items in total
        setXY: { x: 12, y: 0, stepX: 70 },
    });

    state.stars.children.iterate((child) => {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(state.stars, platforms);

    this.physics.add.overlap(state.player, state.stars, collectStar, null, this);

    // score

    state.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    // bombs (baddies)

    state.bombs = this.physics.add.group();

    this.physics.add.collider(state.bombs, platforms);

    this.physics.add.collider(state.player, state.bombs, hitBomb, null, this);

    // add a bomb every 10 seconds (mean!)
    this.time.addEvent({
        delay: 5000,
        loop: true,
        callback: addBomb,
        callbackScope: this,
    });

    // sounds

    this.sfx.blaster = this.sound.add('blaster');
    this.sfx.explode = this.sound.add('explode');

    this.sfx.background = this.sound.add('background', {loop: true});
    this.sfx.background.volume = 0.2;
    this.sfx.background.play();

    //  Being mp3 files these take time to decode, so we can't play them instantly
    //  Using setDecodedCallback we can be notified when they're ALL ready for use.
    //  The audio files could decode in ANY order, we can never be sure which it'll be.

    // this.sound.setDecodedCallback([ state.blaster ], () => { console.log('sound ready') }, this);

    // sound controls

    const button = new TextButton(this, 100, 400, '123', { fill: '#0f0'}, () => {
        // todo - do something
    });
}

function update() {
    const state: State = this.state;
    const cursors = this.input.keyboard.createCursorKeys();
    if (cursors.left.isDown) {
        state.player.setVelocityX(-160);

        state.player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        state.player.setVelocityX(160);

        state.player.anims.play('right', true);
    } else {
        state.player.setVelocityX(0);

        state.player.anims.play('turn');
    }

    if (cursors.up.isDown) {
        if (state.player.body.touching.down) {
            state.player.setVelocityY(-330);
        } else {
            // mid-air (ideally would only fire first time in mid-air)
            state.player.setVelocityY(-165);
        }
    }
}

function hudPreload() {
    this.load.image('pause', 'assets/pause.png');
}

function hudCreate() {
    const pause = this.add.sprite(760, 40, 'pause').setScale(0.25).setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => {
        // todo - pause
    });
}

function hudUpdate() {
    // ?
}

function collectStar(player, star) {
    const state: State = this.state;

    this.sfx.blaster.play();

    // star's physics body is disabled and its parent game object is made inactive & invisible
    star.disableBody(true, true);

    state.score += 10;
    state.scoreText.setText('Score: ' + state.score);

    // use a tween to temporarily grow the player
    this.tweens.add({
        targets: state.player, // on the player
        duration: 200, // for 200ms
        scaleX: 1.2, // that scale vertically by 20%
        scaleY: 1.2, // and scale horizontally by 20%
        yoyo: true, // at the end, go back to original scale
    });

    // when all the stars are collected re-enable all the stars and release a bomb
    if (state.stars.countActive(true) === 0) {
        state.stars.children.iterate((child) => {
            child.enableBody(true, child.x, 0, true, true);
        });

        addBomb.call(this);
    }
}

function addBomb() {
    const state = this.state;
    const x = (state.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    const bomb = state.bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
}

// pause game and turn player red :(
function hitBomb(player, bomb) {
    this.physics.pause();

    // zoom in over a couple of seconds
    this.cameras.main.zoomTo(4, 2000);

    this.sfx.explode.play();

    player.setTint(0xff0000);

    player.anims.play('turn');

    this.state.gameOver = true;

    this.cameras.main.fadeOut(6000, 255);
}
