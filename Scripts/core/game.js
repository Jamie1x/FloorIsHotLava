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
    var rWallGeometry;
    var rWallPhysicsMaterial;
    var rWallMaterial;
    var rWall;
    var rWallTexture;
    var rWallTextureNormal;
    var lWallGeometry;
    var lWallPhysicsMaterial;
    var lWallMaterial;
    var lWall;
    var lWallTexture;
    var lWallTextureNormal;
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
    var manifest = [
        { id: "land", src: "../../Assets/audio/Land.wav" }
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
        health = 5;
        scoreLabel = new createjs.Text("Score: " + score, "40px Consolas", "#ffffff");
        scoreLabel.x = config.Screen.WIDTH * 0.1;
        scoreLabel.y = (config.Screen.HEIGHT * 0.15) * 0.2;
        stage.addChild(scoreLabel);
        healthLabel = new createjs.Text("Health: " + health, "40px Consolas", "#ffffff");
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
        groundTexture.repeat.set(4, 4);
        groundTextureNormal = new THREE.TextureLoader().load('../../Assets/images/lavaMap.png');
        groundTextureNormal.wrapS = THREE.RepeatWrapping;
        groundTextureNormal.wrapT = THREE.RepeatWrapping;
        groundTextureNormal.repeat.set(4, 4);
        groundMaterial = new PhongMaterial();
        groundMaterial.map = groundTexture;
        groundMaterial.bumpMap = groundTextureNormal;
        groundMaterial.bumpScale = 0.2;
        groundGeometry = new BoxGeometry(32, 1, 96);
        groundPhysicsMaterial = Physijs.createMaterial(groundMaterial, 0, 0);
        ground = new Physijs.ConvexMesh(groundGeometry, groundPhysicsMaterial, 0);
        ground.receiveShadow = true;
        ground.name = "Lava";
        scene.add(ground);
        // rWall Object
        rWallTexture = new THREE.TextureLoader().load('../../Assets/images/Wall.jpg');
        rWallTexture.wrapS = THREE.RepeatWrapping;
        rWallTexture.wrapT = THREE.RepeatWrapping;
        rWallTexture.repeat.set(2, 2);
        rWallTextureNormal = new THREE.TextureLoader().load('../../Assets/images/WallMap.jpg');
        rWallTextureNormal.wrapS = THREE.RepeatWrapping;
        rWallTextureNormal.wrapT = THREE.RepeatWrapping;
        rWallTextureNormal.repeat.set(2, 2);
        rWallMaterial = new PhongMaterial();
        rWallMaterial.map = rWallTexture;
        rWallMaterial.bumpMap = rWallTextureNormal;
        rWallMaterial.bumpScale = -0.2;
        rWallGeometry = new BoxGeometry(1, 32, 96);
        rWallPhysicsMaterial = Physijs.createMaterial(rWallMaterial, 0, 0);
        rWall = new Physijs.ConvexMesh(rWallGeometry, rWallPhysicsMaterial, 0);
        rWall.position.set(16, 0, 0);
        rWall.receiveShadow = true;
        rWall.name = "rWall";
        scene.add(rWall);
        // lWall Object
        lWallTexture = new THREE.TextureLoader().load('../../Assets/images/Wall.jpg');
        lWallTexture.wrapS = THREE.RepeatWrapping;
        lWallTexture.wrapT = THREE.RepeatWrapping;
        lWallTexture.repeat.set(2, 2);
        lWallTextureNormal = new THREE.TextureLoader().load('../../Assets/images/WallMap.jpg');
        lWallTextureNormal.wrapS = THREE.RepeatWrapping;
        lWallTextureNormal.wrapT = THREE.RepeatWrapping;
        lWallTextureNormal.repeat.set(2, 2);
        lWallMaterial = new PhongMaterial();
        lWallMaterial.map = lWallTexture;
        lWallMaterial.bumpMap = lWallTextureNormal;
        lWallMaterial.bumpScale = -0.2;
        lWallGeometry = new BoxGeometry(1, 32, 96);
        lWallPhysicsMaterial = Physijs.createMaterial(lWallMaterial, 0, 0);
        lWall = new Physijs.ConvexMesh(lWallGeometry, lWallPhysicsMaterial, 0);
        lWall.position.set(-16, 0, 0);
        lWall.receiveShadow = true;
        lWall.name = "lWall";
        scene.add(lWall);
        // Player Object
        playerGeometry = new BoxGeometry(2, 4, 2);
        playerMaterial = Physijs.createMaterial(new LambertMaterial({ color: 0x00ff00 }), 0.4, 0);
        player = new Physijs.BoxMesh(playerGeometry, playerMaterial, 1);
        player.position.set(0, 5, 32);
        player.receiveShadow = true;
        player.castShadow = true;
        player.name = "Player";
        scene.add(player);
        //startPlatform
        var startPlatform = new Physijs.ConvexMesh(new BoxGeometry(10, 1, 10), Physijs.createMaterial(new LambertMaterial()), 0);
        startPlatform.position.set(0, 1, 32);
        startPlatform.name = "Ground";
        scene.add(startPlatform);
        //chair
        var chair = new Physijs.ConvexMesh(new BoxGeometry(2, 2, 2), Physijs.createMaterial(new LambertMaterial()), 0);
        chair.position.set(0, 1, 16);
        chair.name = "Ground";
        scene.add(chair);
        //table
        var table = new Physijs.ConvexMesh(new BoxGeometry(3, 1, 8), Physijs.createMaterial(new LambertMaterial()), 0);
        table.position.set(0, 1, 0);
        table.name = "Ground";
        scene.add(table);
        //couch
        var couch = new Physijs.ConvexMesh(new BoxGeometry(3, 2, 8), Physijs.createMaterial(new LambertMaterial()), 0);
        couch.position.set(-10, 1.5, 0);
        couch.name = "Ground";
        scene.add(couch);
        //chair2
        var chair2 = new Physijs.ConvexMesh(new BoxGeometry(2, 2, 2), Physijs.createMaterial(new LambertMaterial()), 0);
        chair2.position.set(-7, 1, -16);
        chair2.name = "Ground";
        scene.add(chair2);
        //rug
        var rug = new Physijs.ConvexMesh(new BoxGeometry(5, 1, 8), Physijs.createMaterial(new LambertMaterial()), 0);
        rug.position.set(0, 0.1, -32);
        rug.name = "Ground";
        scene.add(rug);
        //matt
        var matt = new Physijs.ConvexMesh(new BoxGeometry(2, 1, 2), Physijs.createMaterial(new LambertMaterial()), 0);
        matt.position.set(0, 0.1, -46);
        matt.name = "Ground";
        scene.add(matt);
        var ambientLight = new THREE.AmbientLight(0xf0f0f0);
        scene.add(ambientLight);
        // Collision Check
        player.addEventListener('collision', function (event) {
            if (event.name === "Ground") {
                createjs.Sound.play("land");
                isGrounded = true;
                jumpHeight = player.position.y + 1;
            }
            if (event.name === "Lava") {
                health--;
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
            player.position.set(0, 0, 0);
            keyboardControls.enabled = false;
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
                    velocity.y = 4000.0 * delta;
                    if (player.position.y > jumpHeight) {
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
        renderer.setClearColor(0x404040, 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(CScreen.WIDTH, CScreen.HEIGHT);
        renderer.shadowMap.enabled = true;
    }
    // Setup main camera for the scene
    function setupCamera() {
        camera = new PerspectiveCamera(35, config.Screen.RATIO, 0.1, 100);
    }
    window.onload = preload;
    return {
        scene: scene
    };
})();

//# sourceMappingURL=game.js.map
