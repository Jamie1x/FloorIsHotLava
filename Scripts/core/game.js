/// <reference path="_reference.ts"/>
// MAIN GAME FILE
// THREEJS Aliases
var Scene = Physijs.Scene;
var Renderer = THREE.WebGLRenderer;
var PerspectiveCamera = THREE.PerspectiveCamera;
var BoxGeometry = THREE.BoxGeometry;
var CubeGeometry = THREE.CubeGeometry;
var PlaneGeometry = THREE.PlaneGeometry;
var SphereGeometry = THREE.SphereGeometry;
var Geometry = THREE.Geometry;
var AxisHelper = THREE.AxisHelper;
var LambertMaterial = THREE.MeshLambertMaterial;
var BasicMaterial = THREE.MeshBasicMaterial;
var PhongMaterial = THREE.MeshPhongMaterial;
var Material = THREE.Material;
var Texture = THREE.Texture;
var Mesh = THREE.Mesh;
var Object3D = THREE.Object3D;
var SpotLight = THREE.SpotLight;
var PointLight = THREE.PointLight;
var AmbientLight = THREE.AmbientLight;
var Color = THREE.Color;
var Vector3 = THREE.Vector3;
var CScreen = config.Screen;
var Clock = THREE.Clock;
//Custom Game Objects
var gameObject = objects.gameObject;
// Setup a Web Worker for Physijs
Physijs.scripts.worker = "/Scripts/lib/Physijs/physijs_worker.js";
Physijs.scripts.ammo = "/Scripts/lib/Physijs/examples/js/ammo.js";
// setup an IIFE structure (Immediately Invoked Function Expression)
var game = (function () {
    // declare game objects
    var havePointerLock;
    var element;
    var scene = new Scene(); // Instantiate Scene Object
    var renderer;
    var camera;
    var stats;
    var blocker;
    var instructions;
    var spotLight;
    var groundGeometry;
    var groundPhysicsMaterial;
    var groundMaterial;
    var ground;
    var groundTexture;
    var groundTextureNormal;
    var WallTexture;
    var WallTextureNormal;
    var WallMaterial;
    var sideWallTexture;
    var sideWallTextureNormal;
    var sideWallMaterial;
    var rWallGeometry;
    var rWallPhysicsMaterial;
    var rWall;
    var lWallGeometry;
    var lWallPhysicsMaterial;
    var lWall;
    var fWallGeometry;
    var fWallPhysicsMaterial;
    var fWall;
    var bWallGeometry;
    var bWallPhysicsMaterial;
    var bWall;
    var ball;
    var clock;
    var playerGeometry;
    var playerMaterial;
    var player;
    var sphereGeometry;
    var sphereMaterial;
    var sphere;
    var keyboardControls;
    var mouseControls;
    var isGrounded;
    var velocity = new Vector3(0, 0, 0);
    var prevTime = 0;
    var jumpHeight;
    var health;
    var assets;
    var canvas;
    var stage;
    var scoreLabel;
    var healthLabel;
    var score;
    var coins;
    var cointCount = 10;
    var blockCount = 10;
    var manifest = [
        { id: "land", src: "../../Assets/audio/Land.wav" },
        { id: "jump", src: "../../Assets/audio/Jump.wav" },
        { id: "coin", src: "../../Assets/audio/coin.mp3" },
        { id: "step1", src: "../../Assets/audio/Footstep01.wav" }
    ];
    function preload() {
        assets = new createjs.LoadQueue();
        assets.installPlugin(createjs.Sound);
        assets.on("complete", init, this);
        assets.loadManifest(manifest);
    }
    function setupCanvas() {
        canvas = document.getElementById("canvas");
        canvas.setAttribute("width", config.Screen.WIDTH.toString());
        canvas.setAttribute("height", (config.Screen.HEIGHT * 0.1).toString());
        canvas.style.backgroundColor = "#000000";
        stage = new createjs.Stage(canvas);
    }
    function setupScoreboard() {
        score = 0;
        health = 3;
        scoreLabel = new createjs.Text("SCORE: " + score, "40px Consolas", "#ffffff");
        scoreLabel.x = config.Screen.WIDTH * 0.1;
        scoreLabel.y = (config.Screen.HEIGHT * 0.15) * 0.2;
        stage.addChild(scoreLabel);
        healthLabel = new createjs.Text("LIVES: " + health, "40px Consolas", "#ffffff");
        healthLabel.x = config.Screen.WIDTH * 0.8;
        healthLabel.y = (config.Screen.HEIGHT * 0.15) * 0.2;
        stage.addChild(healthLabel);
    }
    function init() {
        // Create to HTMLElements
        blocker = document.getElementById("blocker");
        instructions = document.getElementById("instructions");
        //setup canvas and stage
        setupCanvas();
        setupScoreboard();
        //check to see if pointerlock is supported
        havePointerLock = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;
        // Instantiate Game Controls
        keyboardControls = new objects.KeyboardControls();
        mouseControls = new objects.MouseControls();
        // Check to see if we have pointerLock
        if (havePointerLock) {
            element = document.body;
            instructions.addEventListener('click', function () {
                // Ask the user for pointer lock
                element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;
                element.requestPointerLock();
            });
            document.addEventListener('pointerlockchange', pointerLockChange);
            document.addEventListener('mozpointerlockchange', pointerLockChange);
            document.addEventListener('webkitpointerlockchange', pointerLockChange);
            document.addEventListener('pointerlockerror', pointerLockError);
            document.addEventListener('mozpointerlockerror', pointerLockError);
            document.addEventListener('webkitpointerlockerror', pointerLockError);
        }
        // Scene changes for Physijs
        scene.name = "Main";
        scene.fog = new THREE.Fog(0xffffff, 0, 750);
        scene.setGravity(new THREE.Vector3(0, -15, 0));
        scene.addEventListener('update', function () {
            scene.simulate(undefined, 2);
        });
        // setup a THREE.JS Clock object
        clock = new Clock();
        setupRenderer(); // setup the default renderer
        setupCamera(); // setup the camera
        // Spot Light
        spotLight = new SpotLight(0xffffff);
        spotLight.position.set(20, 40, -15);
        spotLight.castShadow = true;
        spotLight.intensity = 2;
        spotLight.lookAt(new Vector3(0, 0, 0));
        spotLight.shadowCameraNear = 2;
        spotLight.shadowCameraFar = 200;
        spotLight.shadowCameraLeft = -5;
        spotLight.shadowCameraRight = 5;
        spotLight.shadowCameraTop = 5;
        spotLight.shadowCameraBottom = -5;
        spotLight.shadowMapWidth = 2048;
        spotLight.shadowMapHeight = 2048;
        spotLight.shadowDarkness = 0.5;
        spotLight.name = "Spot Light";
        scene.add(spotLight);
        // Ground Object
        groundTexture = new THREE.TextureLoader().load('../../Assets/images/lava.png');
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTextureNormal = new THREE.TextureLoader().load('../../Assets/images/lavaMap.png');
        groundTextureNormal.wrapS = THREE.RepeatWrapping;
        groundTextureNormal.wrapT = THREE.RepeatWrapping;
        groundMaterial = new PhongMaterial();
        groundMaterial.map = groundTexture;
        groundMaterial.bumpMap = groundTextureNormal;
        groundMaterial.bumpScale = 0.2;
        groundGeometry = new BoxGeometry(32, 1, 200);
        groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
        ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
        ground.position.set(0, 0, -64);
        ground.receiveShadow = true;
        ground.name = "Lava";
        scene.add(ground);
        //wall material
        WallTexture = new THREE.TextureLoader().load('../../Assets/images/Wall.jpg');
        WallTexture.wrapS = THREE.RepeatWrapping;
        WallTexture.wrapT = THREE.RepeatWrapping;
        WallTextureNormal = new THREE.TextureLoader().load('../../Assets/images/WallMap.jpg');
        WallTextureNormal.wrapS = THREE.RepeatWrapping;
        WallTextureNormal.wrapT = THREE.RepeatWrapping;
        WallMaterial = new PhongMaterial();
        WallMaterial.map = WallTexture;
        WallMaterial.bumpMap = WallTextureNormal;
        //sideWall material
        sideWallTexture = new THREE.TextureLoader().load('../../Assets/images/wall.jpg');
        sideWallTexture.wrapS = THREE.RepeatWrapping;
        sideWallTexture.wrapT = THREE.RepeatWrapping;
        sideWallTexture.repeat.set(5, 1);
        sideWallTextureNormal = new THREE.TextureLoader().load('../../Assets/images/wallMap.jpg');
        sideWallTextureNormal.wrapS = THREE.RepeatWrapping;
        sideWallTextureNormal.wrapT = THREE.RepeatWrapping;
        sideWallTextureNormal.repeat.set(5, 1);
        sideWallMaterial = new PhongMaterial();
        sideWallMaterial.map = sideWallTexture;
        sideWallMaterial.bumpMap = sideWallTextureNormal;
        // right wall object
        rWallGeometry = new BoxGeometry(1, 16, 200);
        rWallPhysicsMaterial = Physijs.createMaterial(sideWallMaterial, 0, 0);
        rWall = new Physijs.ConvexMesh(rWallGeometry, rWallPhysicsMaterial, 0);
        rWall.position.set(16, 8, -64);
        rWall.receiveShadow = true;
        rWall.name = "Wall";
        scene.add(rWall);
        // left wall object
        lWallGeometry = new BoxGeometry(1, 16, 200);
        lWallPhysicsMaterial = Physijs.createMaterial(sideWallMaterial, 0, 0);
        lWall = new Physijs.ConvexMesh(lWallGeometry, lWallPhysicsMaterial, 0);
        lWall.position.set(-16, 8, -64);
        lWall.receiveShadow = true;
        lWall.name = "Wall";
        scene.add(lWall);
        // far wall object
        fWallGeometry = new BoxGeometry(32, 16, 1);
        fWallPhysicsMaterial = Physijs.createMaterial(WallMaterial, 0, 0);
        fWall = new Physijs.ConvexMesh(fWallGeometry, fWallPhysicsMaterial, 0);
        fWall.position.set(0, 8, -162);
        fWall.receiveShadow = true;
        fWall.name = "Wall";
        scene.add(fWall);
        // back wall object
        bWallGeometry = new BoxGeometry(32, 16, 1);
        bWallPhysicsMaterial = Physijs.createMaterial(WallMaterial, 0, 0);
        bWall = new Physijs.ConvexMesh(bWallGeometry, bWallPhysicsMaterial, 0);
        bWall.position.set(0, 8, 32);
        bWall.receiveShadow = true;
        bWall.name = "Wall";
        scene.add(bWall);
        // Player Object
        playerGeometry = new BoxGeometry(2, 4, 2);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, 1);
        player.position.set(0, 5, 16);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        scene.add(player);
        //startPlatform
        var startPlatform = new Physijs.ConvexMesh(new BoxGeometry(10, 1, 10), Physijs.createMaterial(new LambertMaterial()), 0);
        startPlatform.position.set(0, 1, 16);
        startPlatform.name = "Ground";
        scene.add(startPlatform);
        addBlocks();
        //end
        var end = new Physijs.ConvexMesh(new BoxGeometry(3, 2, 3), Physijs.createMaterial(new LambertMaterial()), 0);
        end.position.set(0, 1, -150);
        end.name = "Finish";
        scene.add(end);
        //create lava ball
        ball = new Physijs.ConvexMesh(new SphereGeometry(0.5, 32, 32), Physijs.createMaterial(new LambertMaterial({ color: 0xff0000 })), 1);
        ball.name = "Lava";
        //finish screen
        var finishTxt = new THREE.TextureLoader().load('../../Assets/images/winner.png');
        var finishMat = new PhongMaterial();
        var finish = new Physijs.ConvexMesh(new BoxGeometry(20, 10, 1), Physijs.createMaterial(finishMat), 0);
        finishMat.map = finishTxt;
        finish.position.set(0, -10, -10);
        finish.name = "Finish";
        scene.add(finish);
        var ambientLight = new THREE.AmbientLight(0xf0f0f0);
        scene.add(ambientLight);
        addCoinMesh();
        // Collision Check
        player.addEventListener('collision', function (event) {
            if (event.name === "Ground") {
                createjs.Sound.play("land");
                isGrounded = true;
                jumpHeight = player.position.y;
                sendBall();
            }
            if (event.name === "Lava") {
                health--;
                healthLabel.text = "LIVES: " + health;
                scene.remove(player);
                player.position.set(0, 5, 16);
                scene.add(player);
            }
            if (event.name === "Finish") {
                keyboardControls.enabled = false;
                scene.remove(player);
                camera.rotation.set(0, 0, 0);
                camera.position.set(0, -10, 0);
                scene.add(camera);
            }
            if (event.name === "Coin") {
                createjs.Sound.play("coin");
                score++;
                scoreLabel.text = "SCORE: " + score;
                scene.remove(event);
            }
        });
        ground.addEventListener('collision', function (event) {
            if (event.name === "Coin") {
                scene.remove(event);
                setCoinPosition(event);
            }
        });
        // create parent-child relationship with camera and player
        player.add(camera);
        camera.position.set(0, 1, 0);
        // Add framerate stats
        addStatsObject();
        document.body.appendChild(renderer.domElement);
        gameLoop(); // render the scene	
        scene.simulate();
        window.addEventListener('resize', onWindowResize, false);
    }
    function addBlocks() {
        for (var i = 0; i < blockCount; i++) {
            var x = Math.random() * 10 + 1;
            var z = Math.random() * 10 + 1;
            var block = new Physijs.ConvexMesh(new BoxGeometry(x, 1, z), Physijs.createMaterial(new LambertMaterial()), 0);
            var rand = Math.floor(Math.random() * 20) - 10;
            block.position.set(rand, 1, i * -15);
            block.name = "Ground";
            scene.add(block);
        }
    }
    // Add the Coin to the scene
    function addCoinMesh() {
        coins = new Array(); // Instantiate a convex mesh array
        var coinLoader = new THREE.JSONLoader().load("../../Assets/items/coin.json", function (geometry) {
            var phongMaterial = new PhongMaterial({ color: 0xE7AB32 });
            phongMaterial.emissive = new THREE.Color(0xE7AB32);
            var coinMaterial = Physijs.createMaterial((phongMaterial), 0.4, 0.6);
            for (var count = 0; count < cointCount; count++) {
                coins[count] = new Physijs.ConvexMesh(geometry, coinMaterial);
                coins[count].receiveShadow = true;
                coins[count].castShadow = true;
                coins[count].name = "Coin";
                setCoinPosition(coins[count]);
            }
        });
        console.log("Added Coin Mesh to Scene");
    }
    // Set Coin Position
    function setCoinPosition(coin) {
        var randomPointX = Math.floor(Math.random() * 20) - 10;
        var randomPointY = Math.random() * 50 + 30;
        var randomPointZ = Math.random() * -100;
        coin.position.set(randomPointX, randomPointY, randomPointZ);
        scene.add(coin);
    }
    //PointerLockChange Event Handler
    function pointerLockChange(event) {
        if (document.pointerLockElement === element) {
            // enable our mouse and keyboard controls
            keyboardControls.enabled = true;
            mouseControls.enabled = true;
            blocker.style.display = 'none';
        }
        else {
            // disable our mouse and keyboard controls
            keyboardControls.enabled = false;
            mouseControls.enabled = false;
            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';
            instructions.style.display = '';
        }
    }
    //PointerLockError Event Handler
    function pointerLockError(event) {
        instructions.style.display = '';
        console.log("PointerLock Error Detected!!");
    }
    // Window Resize Event Handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        canvas.style.width = "100%";
        scoreLabel.x = config.Screen.WIDTH * 0.1;
        scoreLabel.y = (config.Screen.HEIGHT * 0.15) * 0.2;
        healthLabel.x = config.Screen.WIDTH * 0.8;
        healthLabel.y = (config.Screen.HEIGHT * 0.15) * 0.2;
        stage.update();
    }
    // Add Frame Rate Stats to the Scene
    function addStatsObject() {
        stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);
    }
    // Setup main game loop
    function gameLoop() {
        stats.update();
        coins.forEach(function (coin) {
            coin.setAngularFactor(new Vector3(0, 0, 0));
            coin.setAngularVelocity(new Vector3(0, 1, 0));
        });
        ball.setLinearFactor(new Vector3(0, 0, 0));
        ball.setLinearVelocity(new Vector3(0, 0, 20));
        checkControls();
        checkPulse();
        stage.update();
        // render using requestAnimationFrame
        requestAnimationFrame(gameLoop);
        // render the scene
        renderer.render(scene, camera);
    }
    function checkPulse() {
        if (health <= 0) {
            //keyboardControls.enabled = false;
            score = 0;
            scoreLabel.text = "SCORE: " + score;
            health = 3;
            healthLabel.text = "HEALTH: " + health;
        }
    }
    function sendBall() {
        if (player.position.z <= -100 && player.position.z >= -110) {
            ball.position.set(player.position.x, 2, -150);
            scene.add(ball);
            console.log("ball added");
        }
    }
    // Check Controls Function
    function checkControls() {
        if (keyboardControls.enabled) {
            velocity = new Vector3();
            var time = performance.now();
            var delta = (time - prevTime) / 1000;
            var direction = new Vector3(0, 0, 0);
            if (keyboardControls.moveForward) {
                velocity.z -= 1000.0 * delta;
            }
            if (keyboardControls.moveLeft) {
                velocity.x -= 1000.0 * delta;
            }
            if (keyboardControls.moveBackward) {
                velocity.z += 1000.0 * delta;
            }
            if (keyboardControls.moveRight) {
                velocity.x += 1000.0 * delta;
            }
            if (isGrounded) {
                if (keyboardControls.jump) {
                    createjs.Sound.play("jump");
                    velocity.y = 4000.0 * delta;
                    if (player.position.y > jumpHeight + 1) {
                        isGrounded = false;
                    }
                }
            }
            player.setDamping(0.7, 0.1);
            // Changing player's rotation
            player.setAngularVelocity(new Vector3(0, mouseControls.yaw, 0));
            direction.addVectors(direction, velocity);
            direction.applyQuaternion(player.quaternion);
            if (Math.abs(player.getLinearVelocity().x) < 20 && Math.abs(player.getLinearVelocity().y) < 10) {
                player.applyCentralForce(direction);
            }
            cameraLook();
            //reset Pitch and Yaw
            mouseControls.pitch = 0;
            mouseControls.yaw = 0;
            prevTime = time;
        } // Controls Enabled ends
        else {
            player.setAngularVelocity(new Vector3(0, 0, 0));
        }
    }
    // Camera Look function
    function cameraLook() {
        var zenith = THREE.Math.degToRad(90);
        var nadir = THREE.Math.degToRad(-90);
        var cameraPitch = camera.rotation.x + mouseControls.pitch;
        // Constrain the Camera Pitch
        camera.rotation.x = THREE.Math.clamp(cameraPitch, nadir, zenith);
    }
    // Setup default renderer
    function setupRenderer() {
        renderer = new Renderer({ antialias: true });
        renderer.setClearColor(0x000000, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
    }
    // Setup main camera for the scene
    function setupCamera() {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 200);
    }
    window.onload = preload;
    return {
        scene: scene
    };
})();

//# sourceMappingURL=game.js.map
