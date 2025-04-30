import {
  Color,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  SphereGeometry,
  MeshMatcapMaterial,
  AxesHelper,
} from 'three'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats-js'
import LoaderManager from '@/js/managers/LoaderManager'
import GUI from 'lil-gui'
// import { array } from 'three/tsl'

import vertexShader from '../glsl/main.vert'
import fragmentShader from '../glsl/main.frag'
import gsap from 'gsap'

export default class MainScene {
  #canvas
  #renderer
  #scene
  #camera
  #controls
  #stats
  #width
  #height
  #mesh
  #guiObj = {
    progress: 0,
    frequency: 0.047,
    amplitude: 5,
  }

  constructor() {
    this.#canvas = document.querySelector('.scene')

    this.init()
  }

  init = async () => {
    // Preload assets before initiating the scene
    const assets = [
      {
        name: 'image',
        texture: './img/image.jpg',
        // texture: './img/plane-txt.jpg',
      },
    ]

    await LoaderManager.load(assets)

    this.setStats()
    this.setGUI()
    this.setScene()
    this.setRender()
    this.setCamera()
    this.setControls()
    // this.setAxesHelper()

    this.setParticles()

    // this.setSphere()

    this.handleResize()

    // start RAF
    this.events()
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  setParticles() {
    const geometry = new THREE.BufferGeometry()

    const multiplier = 18
    const nbLines = 9 * multiplier
    const nbColumns = 16 * multiplier
    const vertices = []
    const initPositions = []

    for (let i = 0; i < nbColumns; i++) {
      for (let y = 0; y < nbLines; y++) {
        const point = [i, y, 0]
        const initPoint = [i - nbColumns / 2, y - nbLines / 2, THREE.MathUtils.randFloat(0, 1000)]
        vertices.push(...point)
        initPositions.push(...initPoint)
      }
    }

    // create a simple square shape. We duplicate the top left and bottom right
    // vertices because each vertex needs to appear once per triangle.
    const vertices32 = new Float32Array(vertices)
    const initPositions32 = new Float32Array(initPositions)

    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices32, 3))
    geometry.setAttribute('initPosition', new THREE.BufferAttribute(initPositions32, 3))
    geometry.center()

    const texture = LoaderManager.assets['image'].texture

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPointSize: { value: 8.0 },
        uTexture: { value: texture },
        uNbLines: { value: nbLines },
        uNbColumns: { value: nbColumns },
        uProgress: { value: this.#guiObj.progress },
        uFrequency: { value: this.#guiObj.frequency },
        uAmplitude: { value: this.#guiObj.amplitude },
        uTime: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    this.material = material

    const mesh = new THREE.Points(geometry, material)

    this.#scene.add(mesh)

    gsap.fromTo(
      this.material.uniforms.uProgress,
      {
        value: 0,
      },
      {
        value: 1,
        duration: 2.5,
        ease: 'Power4.easeOut',
      }
    )
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Our Webgl renderer, an object that will draw everything in our canvas
   * https://threejs.org/docs/?q=rend#api/en/renderers/WebGLRenderer
   */
  setRender() {
    this.#renderer = new WebGLRenderer({
      canvas: this.#canvas,
      antialias: true,
    })
  }

  /**
   * This is our scene, we'll add any object
   * https://threejs.org/docs/?q=scene#api/en/scenes/Scene
   */
  setScene() {
    this.#scene = new Scene()
    this.#scene.background = new Color(0x000000)
  }

  /**
   * Our Perspective camera, this is the point of view that we'll have
   * of our scene.
   * A perscpective camera is mimicing the human eyes so something far we'll
   * look smaller than something close
   * https://threejs.org/docs/?q=pers#api/en/cameras/PerspectiveCamera
   */
  setCamera() {
    const aspectRatio = this.#width / this.#height
    const fieldOfView = 60
    const nearPlane = 0.1
    const farPlane = 10000

    this.#camera = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    this.#camera.position.y = 0
    this.#camera.position.x = 0
    this.#camera.position.z = 250
    this.#camera.lookAt(0, 0, 0)

    this.#scene.add(this.#camera)
  }

  /**
   * Threejs controls to have controls on our scene
   * https://threejs.org/docs/?q=orbi#examples/en/controls/OrbitControls
   */
  setControls() {
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
    this.#controls.enableDamping = true
    // this.#controls.dampingFactor = 0.04
  }

  /**
   * Axes Helper
   * https://threejs.org/docs/?q=Axesh#api/en/helpers/AxesHelper
   */
  setAxesHelper() {
    const axesHelper = new AxesHelper(3)
    this.#scene.add(axesHelper)
  }

  /**
   * Create a SphereGeometry
   * https://threejs.org/docs/?q=box#api/en/geometries/SphereGeometry
   * with a Basic material
   * https://threejs.org/docs/?q=mesh#api/en/materials/MeshBasicMaterial
   */
  setSphere() {
    const geometry = new SphereGeometry(1, 32, 32)
    const material = new MeshMatcapMaterial({ matcap: LoaderManager.assets['matcap'].texture })

    this.#mesh = new Mesh(geometry, material)
    this.#scene.add(this.#mesh)
  }

  /**
   * Build stats to display fps
   */
  setStats() {
    this.#stats = new Stats()
    this.#stats.showPanel(0)
    document.body.appendChild(this.#stats.dom)
  }

  setGUI() {
    // const titleEl = document.querySelector('.main-title')

    // const handleChange = () => {
    //   this.#mesh.position.y = this.#guiObj.y
    //   titleEl.style.display = this.#guiObj.showTitle ? 'block' : 'none'
    // }

    const gui = new GUI()
    gui.add(this.#guiObj, 'progress', 0, 1).onChange(() => {
      this.material.uniforms.uProgress.value = this.#guiObj.progress
    })
    gui.add(this.#guiObj, 'frequency', 0, 1).onChange(() => {
      this.material.uniforms.uFrequency.value = this.#guiObj.frequency
    })
    gui.add(this.#guiObj, 'amplitude', 0, 10).onChange(() => {
      this.material.uniforms.uAmplitude.value = this.#guiObj.amplitude
    })
    // gui.add(this.#guiObj, 'showTitle').name('show title').onChange(handleChange)
  }
  /**
   * List of events
   */
  events() {
    window.addEventListener('resize', this.handleResize, { passive: true })
    this.draw(0)
  }

  // EVENTS

  /**
   * Request animation frame function
   * This function is called 60/time per seconds with no performance issue
   * Everything that happens in the scene is drawed here
   * @param {Number} now
   */
  draw = (time) => {
    // now: time in ms
    this.#stats.begin()

    if (this.#controls) this.#controls.update() // for damping
    this.#renderer.render(this.#scene, this.#camera)

    this.material.uniforms.uTime.value = time / 1000

    this.#stats.end()
    this.raf = window.requestAnimationFrame(this.draw)
  }

  /**
   * On resize, we need to adapt our camera based
   * on the new window width and height and the renderer
   */
  handleResize = () => {
    this.#width = window.innerWidth
    this.#height = window.innerHeight

    // Update camera
    this.#camera.aspect = this.#width / this.#height
    this.#camera.updateProjectionMatrix()

    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1

    this.#renderer.setPixelRatio(DPR)
    this.#renderer.setSize(this.#width, this.#height)
  }
}
