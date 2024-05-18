import { useState, useEffect } from 'react'
import * as THREE from "three"
import * as CANNON from "cannon-es"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


import styles from "./styles/styles.module.css"

function App() {

  useEffect(() => {
    const canvas = document.getElementById("myCanvas")
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(devicePixelRatio)
    document.body.appendChild(renderer.domElement)

    renderer.shadowMap.enabled = true


    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 30, 40)

    const controls = new OrbitControls(camera, renderer.domElement)

    //LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 10);
    directionalLight.castShadow = true;  // Correctly setting castShadow for the directional light
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;    scene.add(directionalLight)


    //Plane Geometry
    const planeGeometry = new THREE.PlaneGeometry(30, 30)
    const planeMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, side: THREE.DoubleSide })
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
    planeMesh.receiveShadow = true
    scene.add(planeMesh)
    // planeMesh.rotation.x = -0.5 * Math.PI

    
    //CANNON WORLD
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0)
    })

    //Plane Body
    const planePhyMat = new CANNON.Material()
    const groundBody = new CANNON.Body({
      shape: new CANNON.Box( new CANNON.Vec3(15, 15, 0.1)),
      type: CANNON.Body.STATIC,
      material: planePhyMat
    })
    world.addBody(groundBody)
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)


    const mouse = new THREE.Vector2()
    const intersectionPoint = new THREE.Vector3()
    const planeNormal = new THREE.Vector3()
    const plane = new THREE.Plane()
    const raycaster = new THREE.Raycaster()

    window.addEventListener("mousemove", (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; 
      planeNormal.copy(camera.position).normalize();
      plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position)
      raycaster.setFromCamera(mouse, camera)
      raycaster.ray.intersectPlane(plane, intersectionPoint)
    })

    //Function to crate ball form click
    const meshes = []
    const bodies = []

    window.addEventListener("click", (e) => {
      const sphere = new THREE.SphereGeometry(.5, 30, 30)
      const sphereMat = new THREE.MeshStandardMaterial({color: Math.random() * 0xffffff, metalness: 0, roughness: 0})
      const sphereMesh = new THREE.Mesh(sphere, sphereMat)
      sphereMesh.castShadow = true;
      scene.add(sphereMesh)
      sphereMesh.position.copy(intersectionPoint)

      const spherePhyMat = new CANNON.Material()
      const sphereBody = new CANNON.Body({
        mass: 0.3,
        shape: new CANNON.Sphere(0.5),
        material: spherePhyMat
      })
      sphereBody.position.copy(intersectionPoint); // Set the initial position of the body
      world.addBody(sphereBody)

      const groundSphereContactMaterial = new CANNON.ContactMaterial(
        planePhyMat,
        spherePhyMat,
        {restitution: 1,
          friction: 1
        }
      )

      world.addContactMaterial(groundSphereContactMaterial)

      meshes.push(sphereMesh)
      bodies.push(sphereBody)


    })



    


    const timeStep = 1 / 60


    //Animation Function
    const animate = () => {
      world.step(timeStep)

      planeMesh.position.copy(groundBody.position)
      planeMesh.quaternion.copy(groundBody.quaternion)

      //loop for merging the ball body and the ball metch
      for(let i = 0; i < meshes.length; i++){
        meshes[i].position.copy(bodies[i].position)
        meshes[i].quaternion.copy(bodies[i].quaternion)
      }


      renderer.render(scene, camera)
      window.requestAnimationFrame(animate)
    }

    //Window Resizing Function
    const onWindowResize = (e) => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.projectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    addEventListener("resize", onWindowResize, false)

    animate()

  }, [])


  return (
    <div>
      <canvas id='myCanvas' />
    </div>
  )
}

export default App
