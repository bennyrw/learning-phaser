/// <reference path='../node_modules/phaser3-docs/typescript/phaser.d.ts'/>
import 'phaser';

export class TextButton extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text, style, onClick) {
        super(scene, x, y, text, style);

        // todo - ideally pass width & height down
        const hitArea = new Phaser.Geom.Rectangle(-50, -25, 100, 50);

        this.setOrigin(-0.5);
        this.setInteractive({
            hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true,
        })
            .on('pointerover', () => this.enterButtonHoverState())
            .on('pointerout', () => this.enterButtonRestState())
            .on('pointerdown', () => this.enterButtonActiveState())
            .on('pointerup', () => {
                this.enterButtonHoverState();
                onClick();
            });

        scene.add.existing(this);
    }

    private enterButtonActiveState(): void {
        this.setStyle({fill: '#0ff'});
    }

    private enterButtonHoverState(): void {
        this.setStyle({ fill: '#ff0' });
    }

    private enterButtonRestState(): void {
        this.setStyle({ fill: '#0f0'});
    }
}
