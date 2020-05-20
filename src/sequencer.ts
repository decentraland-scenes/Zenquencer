import { Grid } from './grid'

// reusable stone class
export class Sequencer {
  offset: Vector3
  public cells: number | null[][]
  size: Vector3

  constructor(offset: Vector3, size: Vector3, grid: Grid) {
    this.offset = new Vector3(
      offset.x + grid.offset.x,
      offset.y + grid.offset.y,
      offset.z + grid.offset.z
    )
    this.size = size

    this.cells = []
    for (let x = this.offset.x; x < size.x + this.offset.x; x++) {
      this.cells[x] = []
      for (let y = this.offset.y; y < size.y + this.offset.y; y++) {
        for (let z = this.offset.z; z < size.z + this.offset.z; z++) {
          this.cells[x][z] = null
        }
      }
    }
  }
  public placeNode(note: number, pos: Vector3) {
    this.cells[pos.x][pos.y][pos.z] = note
    log(this.cells)
  }
  public removeNode(pos: Vector3) {
    this.cells[pos.x][pos.y][pos.z] = null
    log(this.cells)
  }

  public isInGrid(pos: Vector3) {
    if (
      pos.x < this.offset.x ||
      pos.x > this.size.x + this.offset.x ||
      pos.y < this.offset.y ||
      pos.y > this.size.y + this.offset.y ||
      pos.z < this.offset.z ||
      pos.z > this.size.z + this.offset.z
    ) {
      return false
    }
    log('placed in seq grid')
    return true
  }

  public play(): void {}
}
