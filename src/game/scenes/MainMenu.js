import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    logoTween;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Set a green background
        this.cameras.main.setBackgroundColor(0x267F00);
        this.add.image(512, 384, 'background').setAlpha(0.3);

        this.logo = this.add.image(512, 300, 'logo').setDepth(100);

        // Set Naruto-themed game title
        this.add.text(512, 460, 'NARUTO RUNNER', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ff9900',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);

        // Add a start game button
        const startButton = this.add.text(512, 550, 'START GAME', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setDepth(100).setOrigin(0.5).setPadding(20);

        startButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => startButton.setStyle({ fill: '#ff9900' }))
            .on('pointerout', () => startButton.setStyle({ fill: '#ffffff' }))
            .on('pointerdown', () => this.changeScene());

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start('Game');
    }

    moveLogo (reactCallback)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        }
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
