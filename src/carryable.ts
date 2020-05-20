import { Grid } from 'grid'
import { Sequencer } from './sequencer'
import { seq } from './game'

/**
 * A component that allows an entity to stay in the same location relative to a camera's position, when toggled.
 * @author Interweaver
 */
@Component('carryable')
export class Carryable {
  public static currentCarry: Carryable = undefined
  public static numCarry: number

  public beingCarried: boolean
  public relativeTransform: Transform
  public camera: Camera
  public size: Vector3
  public centerToCornerOffset: Vector3
  public id: number
  public delete: boolean
  public lastGrid: Vector3
  public index: number

  constructor(size: Vector3, index: number) {
    // For some reason setting numCarry to 0 above doesn't work for me...
    Carryable.numCarry = Carryable.numCarry ? Carryable.numCarry : 0

    this.index = index
    this.beingCarried = false
    this.relativeTransform = undefined
    this.camera = Camera.instance
    this.size = size
    this.centerToCornerOffset = new Vector3(
      -(size.x - 1) / 4,
      -(size.y - 1) / 4,
      -(size.z - 1) / 4
    )
    this.delete = false

    this.id = Carryable.numCarry++
  }

  /**
   * Toggle whether this Carryable is being 'carried' (tracking user camera) or not.
   * @param myTransform The Transform of the entity this Component was added to. No other good way to get this than passing it in here.
   */
  public toggleCarry(myTransform: Transform) {
    // There's already another block being carried. Cancel its carry, since they probably wanted to do that.
    if (Carryable.currentCarry && !this.beingCarried) {
      Carryable.currentCarry.beingCarried = false
      Carryable.currentCarry.relativeTransform = undefined
      Carryable.currentCarry = undefined
      return
    }

    this.beingCarried = !this.beingCarried

    if (!this.beingCarried) {
      this.relativeTransform = undefined
      Carryable.currentCarry = undefined

      let dropSpot = CarryableSystem.convertToGrid(myTransform.position)
      if (
        dropSpot.x >= 23 &&
        dropSpot.x <= 25 &&
        dropSpot.y >= 0 &&
        dropSpot.y < 2 &&
        dropSpot.z >= 29 &&
        dropSpot.z < 32
      ) {
        this.delete = true // Dropped in the delete zone :O
      }

      CarryableSystem.sequencerPlace(dropSpot, this.index)

      return
    }
    Carryable.currentCarry = this

    let liftSpot = CarryableSystem.convertToGrid(myTransform.position)
    CarryableSystem.sequencerRemove(liftSpot)
    // Save position of object relative to camera at moment of toggle.
    this.relativeTransform = new Transform({
      position: myTransform.position
        .subtract(this.camera.position)
        .rotate(this.camera.rotation.conjugate()),
    })
  }
}

/**
 * A System to update Carryable entities.
 * @author Interweaver
 */
export class CarryableSystem {
  private carryables: ComponentGroup = engine.getComponentGroup(
    Carryable,
    Transform
  )
  private camera: Camera
  private grid: Grid
  private carryMode: number = 0 // 0 = standard, 1 = minecraft
  static sequencer: Sequencer = seq

  constructor(grid: Grid) {
    this.camera = Camera.instance
    this.grid = grid
  }

  /**
   * Flip to the given carry mode.
   */
  public setCarryMode(newMode: number) {
    this.carryMode = newMode
  }

  /**
   * Update the carryable.
   */
  public update(dt: number) {
    for (let entity of this.carryables.entities) {
      let carryable = entity.getComponent(Carryable)

      if (carryable.delete) {
        // Remove the actual block.
        engine.removeEntity(entity)

        // Also clear out its spot in the grid.
        this.grid.setBox(
          CarryableSystem.convertToGrid(
            entity
              .getComponent(Transform)
              .position.clone()
              .add(carryable.centerToCornerOffset)
          ),
          carryable.size,
          carryable.id,
          -1
        )
        continue
      }
      if (!carryable.beingCarried) {
        continue
      }

      // Camera position.
      let camPos = this.camera.position.clone()

      // Current float position of object (should be rounded, but in world coords.)
      let oldPos = entity
        .getComponent(Transform)
        .position.clone()
        .add(carryable.centerToCornerOffset)

      // Find the float position of the object in the same relative position versus camera as when you clicked it.
      let newPos

      if (this.carryMode === 0) {
        // Fixed relative distance to you: carry mode
        newPos = carryable.relativeTransform.position
          .clone()
          .rotate(this.camera.rotation)
          .add(carryable.centerToCornerOffset)
          .add(camPos)
      } else if (this.carryMode === 1) {
        // shoots out until it hits something: ray mode
        newPos = camPos.add(
          new Vector3(0, 0, 1).rotate(this.camera.rotation).scale(30)
        )
      }

      // Calculate the grid positions of the three points.
      let camGridPos = CarryableSystem.convertToGrid(camPos)
      //let oldGridPos = CarryableSystem.convertToGrid(oldPos);
      let newGridPos = CarryableSystem.convertToGrid(newPos)

      if (carryable.lastGrid) {
        // Skip if we're already perfect!
        if (carryable.lastGrid.equals(newGridPos)) {
          return
        }

        // Temporarily unset the object on the grid so we can check free spots without worrying about its existing spot.
        this.grid.setBox(carryable.lastGrid, carryable.size, carryable.id, -1)
      }

      // Rasterize the cells between the optimal new grid spot and the camera, and find the one closest to optimal where the object can go.
      let closestGridPos =
        this.carryMode === 0
          ? this.castCheck(newGridPos, camGridPos, carryable.size)
          : this.reverseCastCheck(newGridPos, camGridPos, carryable.size)

      // Check if any was returned (if entire line segment was outside scene, or stuff was entirely in the way, won't return anything.)
      if (closestGridPos) {
        carryable.lastGrid = closestGridPos
        this.grid.setBox(closestGridPos, carryable.size, -1, carryable.id)
        entity.getComponent(
          Transform
        ).position = CarryableSystem.convertFromGrid(closestGridPos).subtract(
          carryable.centerToCornerOffset
        )
      } else {
        // Reset the object on the grid, since we can't move it.
        this.grid.setBox(carryable.lastGrid, carryable.size, -1, carryable.id)
      }
    }
  }

  /**
   * Check if belongs to sequencer and add
   */
  public static sequencerPlace(pos: Vector3, index: number): boolean {
    log('dropped at ', pos)
    if (this.sequencer.isInGrid(pos)) {
      this.sequencer.placeNode(index, pos)
      return true
    }
    return false
  }

  /**
   * Check if belongs to sequencer and remove
   */
  public static sequencerRemove(pos: Vector3): boolean {
    log('lifted from ', pos)
    if (this.sequencer.isInGrid(pos)) {
      this.sequencer.removeNode(pos)
      return true
    }
    return false
  }

  /**
   * Convert from normal space to gridspace (integer values from 0-31)
   */
  public static convertToGrid(pos: Vector3): Vector3 {
    return new Vector3(
      Math.round(pos.x * 2 - 0.5),
      Math.round(pos.y * 2 - 0.5),
      Math.round(pos.z * 2 - 0.5)
    ) // subtract 0.5 critical.
  }

  /**
   * Convert back from gridspace to normal space.
   */
  public static convertFromGrid(pos: Vector3): Vector3 {
    return new Vector3(pos.x / 2 + 0.25, pos.y / 2 + 0.25, pos.z / 2 + 0.25) //
  }

  /**
   * 3d rasterization of line segment between two points on a quantized grid
   * See https://www.geeksforgeeks.org/bresenhams-algorithm-for-3-d-line-drawing/
   */
  public bresenham3d(pos0: Vector3, pos1: Vector3) {
    let listOfPoints = [pos0.clone()]

    let delta = new Vector3(
      Math.abs(pos1.x - pos0.x),
      Math.abs(pos1.y - pos0.y),
      Math.abs(pos1.z - pos0.z)
    )

    let s = new Vector3(
      pos1.x > pos0.x ? 1 : -1,
      pos1.y > pos0.y ? 1 : -1,
      pos1.z > pos0.z ? 1 : -1
    )

    if (delta.x >= delta.y && delta.x >= delta.z) {
      let p1 = 2 * delta.y - delta.x
      let p2 = 2 * delta.z - delta.x
      while (pos0.x !== pos1.x) {
        pos0.x += s.x
        if (p1 >= 0) {
          pos0.y += s.y
          p1 -= 2 * delta.x
        }
        if (p2 >= 0) {
          pos0.z += s.z
          p2 -= 2 * delta.x
        }
        p1 += 2 * delta.y
        p2 += 2 * delta.z
        listOfPoints.push(pos0.clone())
      }
    } else if (delta.y >= delta.x && delta.y >= delta.z) {
      let p1 = 2 * delta.x - delta.y
      let p2 = 2 * delta.z - delta.y
      while (pos0.y !== pos1.y) {
        pos0.y += s.y
        if (p1 >= 0) {
          pos0.x += s.x
          p1 -= 2 * delta.y
        }
        if (p2 >= 0) {
          pos0.z += s.z
          p2 -= 2 * delta.y
        }
        p1 += 2 * delta.x
        p2 += 2 * delta.z
        listOfPoints.push(pos0.clone())
      }
    } else {
      let p1 = 2 * delta.y - delta.z
      let p2 = 2 * delta.x - delta.z
      while (pos0.z !== pos1.z) {
        pos0.z += s.z
        if (p1 >= 0) {
          pos0.y += s.y
          p1 -= 2 * delta.z
        }
        if (p2 >= 0) {
          pos0.x += s.x
          p2 -= 2 * delta.z
        }
        p1 += 2 * delta.y
        p2 += 2 * delta.x
        listOfPoints.push(pos0.clone())
      }
    }

    return listOfPoints
  }

  /**
   * Between the two float-valued positions, find the rounded (to nearest 0.5) position closet to pos1 for which grid is empty.
   */
  public castCheck(p0: Vector3, p1: Vector3, dims: Vector3): Vector3 {
    let listOfPoints = this.bresenham3d(p0, p1)

    for (let point of listOfPoints) {
      if (this.grid.checkBox(point, dims)) {
        return point
      }
    }
    return undefined
  }

  public reverseCastCheck(p0: Vector3, p1: Vector3, dims: Vector3): Vector3 {
    let listOfPoints = this.bresenham3d(p1, p0)

    let prevPoint = undefined
    for (let point of listOfPoints) {
      if (!this.grid.checkBox(point, dims)) {
        return prevPoint
      }
      prevPoint = point
    }
    return undefined
  }
}
