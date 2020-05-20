/**
 * Represents a 3D grid of cells that can be either filled or unfilled.
 * Provides some functions for testing filled state, and setting filled state.
 */
export class Grid {
  public cells: number[][][]

  public size: Vector3

  public offset: Vector3 = new Vector3()

  /**
   * Create a new Grid with the given integer dimensions.
   */
  constructor(size: Vector3, offset: Vector3) {
    this.size = size
    this.offset.x = offset.x * 2
    this.offset.y = offset.y * 2
    this.offset.z = offset.z * 2

    // Initialize grid cells to empty.
    this.cells = []
    for (let x = this.offset.x; x < size.x + this.offset.x; x++) {
      this.cells[x] = []
      for (let y = this.offset.y; y < size.y + this.offset.y; y++) {
        this.cells[x][y] = []
        for (let z = this.offset.z; z < size.z + this.offset.z; z++) {
          this.cells[x][y][z] = -1
        }
      }
    }
  }

  /**
   * Check if all of the cells in the given box are in the empty state.
   * @param pos The minimum corner of the box.
   * @param size The dimensions of the box.
   * @return true if all cells empty, or false if any are filled, or if box is out of bounds.
   */
  public checkBox(pos: Vector3, size: Vector3): boolean {
    // Verify all cells within bounds.
    if (
      pos.x < 0 + this.offset.x ||
      pos.x + size.x > this.size.x + this.offset.x ||
      pos.y < 0 + this.offset.y ||
      pos.y + size.y > this.size.y + this.offset.y ||
      pos.z < 0 + this.offset.z ||
      pos.z + size.z > this.size.z + this.offset.z
    ) {
      return false
    }

    // Verify no cells filled.
    for (let x = pos.x; x < pos.x + size.x; x++) {
      for (let y = pos.y; y < pos.y + size.y; y++) {
        for (let z = pos.z; z < pos.z + size.z; z++) {
          if (this.cells[x][y][z] >= 0) {
            return false
          }
        }
      }
    }

    return true
  }

  /**
   * Set all the cells in the given box to the given filled state.
   * Does nothing if box is out of bounds.
   * @param pos The minimum corner of the box.
   * @param size The dimensions of the box.
   * @param oldFilled The only allowed old fill to replace.
   * @param filled What number to fill the grid at this position with.
   */
  public setBox(
    pos: Vector3,
    size: Vector3,
    oldFilled: number,
    filled: number
  ) {
    // Verify all cells within bounds.
    if (
      pos.x < 0 ||
      pos.x + size.x > this.size.x + this.offset.x ||
      pos.y < 0 ||
      pos.y + size.y > this.size.y + this.offset.y ||
      pos.z < 0 ||
      pos.z + size.z > this.size.z + this.offset.z
    ) {
      return false
    }

    // Fill in all cells.
    for (let x = pos.x; x < pos.x + size.x; x++) {
      for (let y = pos.y; y < pos.y + size.y; y++) {
        for (let z = pos.z; z < pos.z + size.z; z++) {
          if (this.cells[x][y][z] == oldFilled) {
            this.cells[x][y][z] = filled
          }
        }
      }
    }
  }

  //   public gridDebug(){
  // 	    for (let x = 0; x < this.size.x ; x++) {
  //       for (let y = 0; y <  this.size.y ; y++) {
  //         for (let z = 0; z <  this.size.z ; z++) {
  //           this.cells[x][y][z]

  //         }
  //       }
  //     }
  //   }
}
