/// <reference path='../node_modules/phaser3-docs/typescript/phaser.d.ts'/>
import 'phaser';

import {HEIGHT, WIDTH} from "./config";

const LOADING_FADE_DURATION: number = 2000;

export class BootScene extends Phaser.Scene {
    private isLoaded: boolean = false;

    constructor() {
        super('boot');
    }

    public preload() {
        this.load.image('block', 'assets/50x50.png');
    }

    public create() {
        const blockSize: number = 50;
        const blocksWide: number = 14;
        const blocksTall: number = 10;
        const totalBlocks: number = blocksWide * blocksTall;
        const groupConfig: GroupCreateConfig = { key: 'block', repeat: totalBlocks - 1, setScale: { x: 0, y: 0 } };
        const blocks = this.add.group(groupConfig);

        Phaser.Actions.GridAlign(blocks.getChildren(), {
            width: blocksWide,
            cellWidth: blockSize,
            cellHeight: blockSize,
            x: (WIDTH - blocksWide * blockSize) / 2,
            y: (HEIGHT - blocksTall * blockSize) / 2,
        });

        const interColumnDelay: number = 50;
        let column: number = 0;
        blocks.children.iterate((child) => {
            this.tweens.add({
                targets: child,
                scaleX: 1,
                scaleY: 1,
                angle: 180,
                _ease: 'Sine.easeInOut',
                ease: 'Power2',
                duration: LOADING_FADE_DURATION,
                delay: column * interColumnDelay,
                // repeat: -1,
                // yoyo: true,
                // hold: 1000,
                // repeatDelay: 1000,
            });

            column++;
            if (column % 14 === 0) {
                column = 0;
            }
        });
    }

    public update(time) {
        if (time > 2 * LOADING_FADE_DURATION && !this.isLoaded) {
            this.isLoaded = true;
            this.scene.launch('game');
            this.scene.launch('hud');
            this.scene.remove('loader');
        }
    }
}
