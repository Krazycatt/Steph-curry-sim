import * as CANNON from 'cannon-es'
import { GRAVITY } from '../data/constants.js'

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World()
    this.world.gravity.set(0, GRAVITY, 0)
    this.world.broadphase = new CANNON.NaiveBroadphase()
    this.world.solver.iterations = 10

    // Static floor plane
    const floorBody = new CANNON.Body({ mass: 0 })
    floorBody.addShape(new CANNON.Plane())
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(floorBody)
  }

  step(dt) {
    this.world.step(1 / 60, dt, 2)
  }

  add(body) {
    this.world.addBody(body)
  }

  remove(body) {
    this.world.removeBody(body)
  }
}
