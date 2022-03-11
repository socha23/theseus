import { Point } from "../model/physics.js";

////////////////////
// equipment grid
////////////////////

export const GRID_CELL_WIDTH = 260
export const GRID_CELL_HEIGHT = 160

class GridController {
    constructor() {
        this.draggedSubsystem = null
        this.positionOver = null
    }

    startDrag(subsystem) {
        this.draggedSubsystem = subsystem
    }


    endDrag() {
        this.draggedSubsystem = null
    }

    dragOver(position) {
        this.positionOver = position
    }

    dragLeave(position) {
        if (this.isDragOver(position)) {
            this.positionOver = null
        }
    }

    isDragOver(position) {
        return this.positionOver
            && this.positionOver.x === position.x
            && this.positionOver.y === position.y
    }

    drop(actionController) {
        if (this.draggedSubsystem) {
            actionController.onSubsystemMoved(this.draggedSubsystem.id, this.positionOver)
            this.draggedSubsystem = null
            this.positionOver = null
        }
    }

    getValidTargets(sub) {
        const result = []
        if (this.draggedSubsystem == null) {
            return result
        }
        for (var dx = 0; dx < sub.gridWidth; dx++) {
            for (var dy = 0; dy < sub.gridHeight; dy++) {
                var matches = true
                for (var x = 0; x < this.draggedSubsystem.gridSize.x; x++) {
                    for (var y = 0; y < this.draggedSubsystem.gridSize.y; y++) {
                        if (
                            (dx + x >= sub.gridWidth)
                            || (dy + y >= sub.gridHeight)
                            || (
                                (sub.gridBusy[dx + x][dy + y] != null)
                                && (sub.gridBusy[dx + x][dy + y] !== this.draggedSubsystem.id)
                            )
                        ) {
                            matches = false
                        }
                    }
                }
                if (matches) {
                    result.push({
                        id: dx + "_" + dy,
                        position: new Point(dx, dy),
                        size: this.draggedSubsystem.gridSize,
                    })
                }
            }
        }
        return result
    }
}

export const gridController = new GridController()


function DropTarget({position, size, actionController}) {
    return <div
        className={"target " + (gridController.isDragOver(position) ? "selected " : "unselected ")}
        key={position.x + "_" + position.y}
        style={{
            position: "absolute",
            left: position.x * GRID_CELL_WIDTH,
            top: position.y * GRID_CELL_HEIGHT,
            width: size.x * GRID_CELL_WIDTH,
            height: size.y * GRID_CELL_HEIGHT,
        }}
        onDragEnter={e => {gridController.dragOver(position)}}
        onDragLeave={e => {gridController.dragLeave(position)}}
        onDragOver={e => {e.preventDefault(); return false}}
        onDrop={e => {gridController.drop(actionController)}}
    >
        <div className="inside"/>
    </div>
}

export function DropTargets({sub, actionController}) {
    const targets = gridController.getValidTargets(sub)
    return <div className="dropTargets">
        {
            targets.map(t => <DropTarget key={t.id} position={t.position} size={t.size} actionController={actionController}/>)
        }
    </div>
}

export function SubsystemCell({subsystem, children}) {
    return <div className="subsystemCell" style={{
            position: "absolute",
            left: subsystem.gridPosition.x * GRID_CELL_WIDTH,
            top: subsystem.gridPosition.y * GRID_CELL_HEIGHT,
            width: subsystem.gridSize.x * GRID_CELL_WIDTH,
            height: subsystem.gridSize.y * GRID_CELL_HEIGHT,
            }}
            onDragStart={e => gridController.startDrag(subsystem)}
            onDragEnd={e => gridController.endDrag()}
            >
                {children}
    </div>
}

export function SubsystemGrid({sub}) {
    const cols = []
    const rows = []
    for (var i = 0; i < sub.gridWidth; i++) {
        cols.push(i)
    }
    for (i = 0; i < sub.gridHeight; i++) {
        rows.push(i)
    }

    return <div className='subsystemGrid'>
    {
        rows.map(y =>
            cols.map(x => <div
                key={"gridCell_" + x + "_" + y}
                className="cell"
                style={{
                    position: 'absolute',
                    left: x * GRID_CELL_WIDTH,
                    top: y * GRID_CELL_HEIGHT,
                    width: GRID_CELL_WIDTH,
                    height: GRID_CELL_HEIGHT,
                }}
                />)
        )
    }
</div>
}
