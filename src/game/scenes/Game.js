import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import Phaser from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');

        // Track player position in the infinite world
        this.worldPosition = { x: 0, y: 0 };

        // Throwing stars group
        this.throwingStars = null;

        // Last direction faced (for throwing stars)
        this.lastDirection = { x: 1, y: 0 };
    }

    create ()
    {
        // Create the endless grass world
        this.createGrassWorld();

        // Create the player character
        this.createPlayer();

        // Create throwing stars group
        this.createThrowingStars();

        // Set up the camera to follow the player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1.5);

        // Create minimap in top right corner
        this.createMinimap();

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Emit event that the scene is ready
        EventBus.emit('current-scene-ready', this);
    }

    createGrassWorld() {
        // Create an endless grass background using tiles
        this.grassTiles = [];

        // Create a grid of grass patches for a realistic look
        const tileSize = 64;
        const viewSize = 20; // How many tiles visible in each direction

        // Define a range of green colors for the grass
        const grassColors = [
            0x215B10, // Dark green
            0x267F00, // Medium green
            0x2F9C13, // Light green
            0x398119, // Olive green
            0x1F5F04  // Forest green
        ];

        for (let y = -viewSize; y <= viewSize; y++) {
            for (let x = -viewSize; x <= viewSize; x++) {
                // Create a grass patch
                const tile = this.add.graphics();
                const tileX = x * tileSize;
                const tileY = y * tileSize;

                // Base grass color - pick a random green shade
                const baseColor = Phaser.Math.RND.pick(grassColors);
                tile.fillStyle(baseColor, 1);
                tile.fillRect(0, 0, tileSize, tileSize);

                // Add realistic grass blade details
                this.createGrassBlades(tile, tileSize);

                tile.setPosition(tileX, tileY);
                tile.setDepth(0);

                this.grassTiles.push({ sprite: tile, gridX: x, gridY: y });
            }
        }
    }

    createGrassBlades(tile, tileSize) {
        // Add different layers of grass blades for more realism

        // Layer 1: Short grass blades (more numerous)
        tile.fillStyle(0x2A8C14, 0.7); // Medium green, slightly transparent
        const shortBlades = Phaser.Math.Between(15, 25);
        for (let i = 0; i < shortBlades; i++) {
            const bladeX = Phaser.Math.Between(0, tileSize);
            const bladeY = Phaser.Math.Between(0, tileSize);
            const bladeHeight = Phaser.Math.Between(3, 8);
            const bladeWidth = Phaser.Math.Between(1, 2);

            // Add slight angle to blades
            this.drawGrassBlade(tile, bladeX, bladeY, bladeWidth, bladeHeight,
                Phaser.Math.Between(-10, 10));
        }

        // Layer 2: Medium grass blades
        tile.fillStyle(0x1E7B04, 0.6); // Darker green
        const mediumBlades = Phaser.Math.Between(8, 15);
        for (let i = 0; i < mediumBlades; i++) {
            const bladeX = Phaser.Math.Between(0, tileSize);
            const bladeY = Phaser.Math.Between(0, tileSize);
            const bladeHeight = Phaser.Math.Between(8, 14);
            const bladeWidth = Phaser.Math.Between(1, 2);

            this.drawGrassBlade(tile, bladeX, bladeY, bladeWidth, bladeHeight,
                Phaser.Math.Between(-15, 15));
        }

        // Layer 3: Tall grass blades (fewer)
        tile.fillStyle(0x194D00, 0.5); // Very dark green
        const tallBlades = Phaser.Math.Between(3, 7);
        for (let i = 0; i < tallBlades; i++) {
            const bladeX = Phaser.Math.Between(0, tileSize);
            const bladeY = Phaser.Math.Between(0, tileSize);
            const bladeHeight = Phaser.Math.Between(12, 20);
            const bladeWidth = Phaser.Math.Between(1, 2);

            this.drawGrassBlade(tile, bladeX, bladeY, bladeWidth, bladeHeight,
                Phaser.Math.Between(-20, 20));
        }

        // Layer 4: Highlights (very few, bright green tips)
        tile.fillStyle(0x3CAD1C, 0.7); // Bright green
        const highlights = Phaser.Math.Between(1, 5);
        for (let i = 0; i < highlights; i++) {
            const bladeX = Phaser.Math.Between(0, tileSize);
            const bladeY = Phaser.Math.Between(0, tileSize);
            const bladeHeight = Phaser.Math.Between(5, 10);
            const bladeWidth = 1;

            this.drawGrassBlade(tile, bladeX, bladeY, bladeWidth, bladeHeight,
                Phaser.Math.Between(-25, 25));
        }
    }

    drawGrassBlade(tile, x, y, width, height, angle) {
        // Save the graphics context state
        tile.save();

        // Move to the position of the grass blade
        tile.translateCanvas(x, y);

        // Rotate the context for angled grass
        const radians = Phaser.Math.DegToRad(angle);
        tile.rotateCanvas(radians);

        // Draw a slightly curved blade of grass
        tile.beginPath();

        // Use a bezier curve for a more natural look
        const tipOffset = Phaser.Math.Between(-width * 2, width * 2); // Random curve at the tip

        tile.moveTo(0, 0);
        tile.lineTo(width, 0);
        tile.lineTo(width + tipOffset, -height);
        tile.lineTo(tipOffset, -height);
        tile.closePath();
        tile.fillPath();

        // Restore the graphics context
        tile.restore();
    }

    updateGrassWorld() {
        // Calculate current grid position based on player position
        const tileSize = 64;
        const centerGridX = Math.floor(this.player.x / tileSize);
        const centerGridY = Math.floor(this.player.y / tileSize);
        const viewSize = 20;

        // Update grass tiles based on player position
        this.grassTiles.forEach(tile => {
            // Check if this tile is too far from the player
            if (Math.abs(tile.gridX - centerGridX) > viewSize ||
                Math.abs(tile.gridY - centerGridY) > viewSize) {

                // Reposition this tile to the other side of the view
                const newGridX = tile.gridX < centerGridX ?
                    centerGridX + viewSize :
                    centerGridX - viewSize;

                const newGridY = tile.gridY < centerGridY ?
                    centerGridY + viewSize :
                    centerGridY - viewSize;

                // Update tile position
                tile.gridX = newGridX;
                tile.gridY = newGridY;
                tile.sprite.setPosition(newGridX * tileSize, newGridY * tileSize);
            }
        });
    }

    createThrowingStars() {
        // Create a group for throwing stars
        this.throwingStars = this.physics.add.group();

        // Setup space key for throwing
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Cooldown for throwing stars (in milliseconds)
        this.throwCooldown = 500;
        this.lastThrowTime = 0;
    }

    throwStar() {
        const currentTime = this.time.now;

        // Check cooldown
        if (currentTime - this.lastThrowTime < this.throwCooldown) {
            return;
        }

        // Create throwing star at player position
        const star = this.throwingStars.create(this.player.x, this.player.y, 'star')
            .setScale(0.3)
            .setDepth(30);

        // Set velocity based on last direction
        const speed = 400;

        // If player is not moving, use the direction they're facing
        let dirX = this.lastDirection.x;
        let dirY = this.lastDirection.y;

        // Normalize the direction for consistent speed
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        if (length > 0) {
            dirX = dirX / length;
            dirY = dirY / length;
        }

        star.setVelocity(dirX * speed, dirY * speed);

        // Set rotation angle based on movement direction
        const angle = Math.atan2(dirY, dirX);
        star.setRotation(angle);

        // Add rotation animation
        this.tweens.add({
            targets: star,
            angle: star.angle + 360 * 5, // Multiple full rotations
            duration: 1000,
            repeat: -1
        });

        // Destroy star after some time
        this.time.delayedCall(2000, () => {
            if (star.active) {
                star.destroy();
            }
        });

        // Update cooldown
        this.lastThrowTime = currentTime;
    }

    createPlayer() {
        // Create a player sprite (simple rectangle for now, would be replaced with actual sprite)
        this.player = this.physics.add.sprite(0, 0, 'star')
            .setScale(0.5)
            .setTint(0xFF9900) // Orange tint like Naruto
            .setDepth(20);

        // Set the player speed
        this.playerSpeed = 300;

        // Add a shadow under the player
        this.playerShadow = this.add.ellipse(
            this.player.x,
            this.player.y + 10,
            30, 15,
            0x000000, 0.5
        ).setDepth(15);

        // Add a running trail effect
        this.time.addEvent({
            delay: 100,
            callback: this.createRunningTrail,
            callbackScope: this,
            loop: true
        });
    }

    createRunningTrail() {
        if (!this.player || (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0)) {
            return;
        }

        // Create a dust particle at the player's feet
        const dust = this.add.circle(
            this.player.x,
            this.player.y + 10,
            Phaser.Math.Between(3, 8),
            0xf7e9c3,
            0.7
        ).setDepth(10);

        // Animate the dust particle
        this.tweens.add({
            targets: dust,
            alpha: 0,
            scale: { from: 1, to: 2 },
            duration: 500,
            onComplete: () => {
                dust.destroy();
            }
        });
    }

    createMinimap() {
        // Calculate the minimap size (20% of game width/height)
        const minimapSize = {
            width: this.cameras.main.width * 0.2,
            height: this.cameras.main.height * 0.2
        };

        // Calculate the position for top right corner
        const minimapPosition = {
            x: this.cameras.main.width - minimapSize.width - 20,
            y: 20
        };

        // Create the minimap camera
        this.minimapCamera = this.cameras.add(
            minimapPosition.x,
            minimapPosition.y,
            minimapSize.width,
            minimapSize.height
        );

        // Configure the minimap camera
        this.minimapCamera.setZoom(0.2); // Zoomed out view
        this.minimapCamera.setName('minimap');
        this.minimapCamera.setBackgroundColor(0x000000);
        this.minimapCamera.alpha = 0.8;
        this.minimapCamera.startFollow(this.player);

        // Create a border for the minimap
        this.minimapBorder = this.add.graphics();
        this.minimapBorder.lineStyle(2, 0xffffff, 1);
        this.minimapBorder.strokeRect(
            minimapPosition.x,
            minimapPosition.y,
            minimapSize.width,
            minimapSize.height
        );
        this.minimapBorder.setScrollFactor(0);

        // Create a player indicator for the minimap
        this.minimapPlayer = this.add.circle(0, 0, 5, 0xff0000);
        this.minimapPlayer.setDepth(100);
    }

    update() {
        if (!this.player) return;

        // Reset velocity
        this.player.setVelocity(0);

        // Handle movement with arrow keys
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
            this.player.setFlipX(true);
            this.lastDirection = { x: -1, y: 0 };
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.playerSpeed);
            this.player.setFlipX(false);
            this.lastDirection = { x: 1, y: 0 };
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-this.playerSpeed);
            this.lastDirection = { x: 0, y: -1 };
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(this.playerSpeed);
            this.lastDirection = { x: 0, y: 1 };
        }

        // Set diagonal direction
        if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
            this.lastDirection = {
                x: this.player.body.velocity.x > 0 ? 1 : -1,
                y: this.player.body.velocity.y > 0 ? 1 : -1
            };

            // Normalize for diagonal movement
            this.player.body.velocity.normalize().scale(this.playerSpeed);
        }

        // Update player shadow position
        if (this.playerShadow) {
            this.playerShadow.x = this.player.x;
            this.playerShadow.y = this.player.y + 10;
        }

        // Update grass world based on player position
        this.updateGrassWorld();

        // Check for throwing stars
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.throwStar();
        }

        // Make the player slightly tilt in the direction of movement
        if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
            // Player is moving, add a slight tilt
            const angle = Math.atan2(this.player.body.velocity.y, this.player.body.velocity.x);
            this.player.setRotation(angle * 0.1); // Slight tilt

            // Scale the player slightly based on speed to create a "running" effect
            const speedFactor = 1 + Math.sin(this.time.now * 0.01) * 0.05;
            this.player.setScale(0.5 * speedFactor);
        } else {
            // Player is not moving, reset rotation and scale
            this.player.setRotation(0);
            this.player.setScale(0.5);
        }

        // Update the minimap player indicator position
        if (this.minimapPlayer) {
            this.minimapPlayer.x = this.player.x;
            this.minimapPlayer.y = this.player.y;
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
