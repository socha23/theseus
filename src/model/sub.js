import {Point, Body } from './physics.js'
import { Entity } from './entities.js'

import { Storage } from './subsystems/storage'
import { Engine } from './subsystems/others'
import { randomElem } from '../utils.js'
import { shake } from './effects.js'
import { MATERIALS } from './materials.js'

class Steering {
    constructor() {
        this.forward = false
        this.backward = false
        this.left = false
        this.right = false
    }

    updateState(deltaMs, model, actionController) {
        this.forward = actionController.isKeyDown("w")
        this.backward = actionController.isKeyDown("s")
        this.left = actionController.isKeyDown("a")
        this.right = actionController.isKeyDown("d")
    }

    get throttle() {
        if (this.forward && this.backward) {
            return 0
        }
        return (this.forward ? 1 : 0) - (this.backward ? 0.5 : 0)
    }

    get direction() {
        return (this.left ? -1 : 0) + (this.right ? 1 : 0)
    }
}

class OperatorController {
    constructor() {
        this._currentAction = null
    }

    assignOperator(a) {
        this._currentAction = a
        return {id: "operator"}
    }

    unassignOperator(a) {
        if (this._currentAction === a) {
            this._currentAction = null
        }
    }

    hasAssignedOperator(a) {
        return this._currentAction === a
    }
}

class PowerManagement {
    constructor(subsystems) {
        this.subsystems = subsystems

        this._consumption = 0
        this._generation = 0
        this._balance = 0
    }

    _emergencyShutdown() {
        const shutdownOrder = [...this.subsystems].sort(
            (a, b) => b.powerConsumption - a.powerConsumption
            )
        while (this.powerBalance < 0 && shutdownOrder.length > 0) {
            const s = shutdownOrder.shift()
            s.shutdown()
            this._updateCaches()
        }
    }

    get consumption() {
        return this._consumption
    }

    get generation() {
        return this._generation
    }

    get balance() {
        return this._balance
    }

    _updateCaches() {
        this._consumption = 0
        this._generation = 0
        this.subsystems.forEach(s => {
            this._consumption += s.powerConsumption
            this._generation += s.powerGeneration
        })
        this._balance = this._generation - this._consumption
    }

    updateState() {
        this._updateCaches()
        if (this.powerBalance < 0) {
            this._emergencyShutdown()
        }

    }

}


export class Sub extends Entity {
    constructor(volume, subsystems = []) {
        super("sub", new Body(new Point(0, 0), volume, Math.PI / 2))
        this.subsystems = subsystems

        this.trackedEntity = null

        this._engine = this._findSubsystem(Engine)
        this._storage = this._findSubsystem(Storage)

        this.gridWidth = 5
        this.gridHeight = 5

        this._gridBusyCache = this._getGridBusy()

        this.steering = new Steering()
        this.operators = new OperatorController()
        this.power = new PowerManagement(this.subsystems)


        this._waterLevel = 0

    }

    updateState(deltaMs, model, actionController) {
        this._moveSubsystems(actionController)

        this.steering.updateState(deltaMs, model, actionController)
        this.power.updateState()

        if (actionController.targetEntityId != null) {
            this.targetEntity = model.world.getEntity(actionController.targetEntityId)
        }
        if (this.targetEntity?.deleted) {
            this.targetEntity = null
        }

        this.subsystems.forEach(s => s.updateState(deltaMs, model, actionController))

        this._updatePosition()
        this._updateWaterLevel(deltaMs)
        super.updateState(deltaMs, model)

    }

    _updateWaterLevel(deltaMs) {
        this._waterLevel = Math.max(0, Math.min(this._waterLevel + (this.leak * deltaMs / 1000), this.gridHeight))
    }

    _moveSubsystems(actionController) {
        if (actionController.movedSubsystemId) {
            this.subsystems
                .find(s => s.id === actionController.movedSubsystemId)
                .gridPosition = actionController.movedSubsystemPosition
            this._gridBusyCache = this._getGridBusy()
        }
    }

    get ranges() {
        const result = []
        this.subsystems.forEach(s => {result.push(...s.ranges)})
        return result
    }

    get aimLines() {
        const result = []
        this.subsystems.forEach(s => {result.push(...s.aimLines)})
        return result
    }

    get boundingBox() {
        return this.body.boundingBox
    }

    _updatePosition() {
        var force = 0
        var rotationalForce = 0
        this.subsystems
            .filter(s => s.isEngine())
            .forEach(e => {
                force += e.thrust
                rotationalForce += e.rotationalThrust
            })

        var dir = this.steering.direction
        if (
            (dir === 0)
            && (Math.abs(this.body.rotationSpeed) > 0.01)
         ) {
            dir = Math.sign(this.body.rotationSpeed) * -1
        }
        this.body.addActingForce(this.body.dorsalThrustVector(force * this.steering.throttle))
        this.body.addActingRotation(rotationalForce * dir)
    }

    _findSubsystem(clazz) {
        return this.subsystems.find(s => s instanceof clazz)
    }

    _getGridBusy() {
        const grid = []
        for (var x = 0; x < this.gridWidth; x++) {
            grid.push(new Array(this.gridHeight).fill(null))
        }
        this.subsystems.forEach(s => {
            for (var x = s.gridPosition.x; x < s.gridPosition.x + s.gridSize.x; x++) {
                for (var y = s.gridPosition.y; y < s.gridPosition.y + s.gridSize.y; y++) {
                    grid[x][y] = s.id
                }
            }
        })
        return grid
    }

    toViewState() {
        return {
            ...super.toViewState(),
            subsystems: this.subsystems.map(s => s.toViewState()),
            position: this.body.position,
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            gridBusy: this._gridBusyCache,
            waterLevel: this.waterLevel,
            inventory: this._storage.inventory,
        }
    }


    _randomSubsystemFromSide(direction) {
        const subsystemLots = []
        this.subsystems.forEach(s => {
            if (s.takesDamage) {
                // number of lots is dependent on position in grid amd direction
                var lots = 0

                if (direction === "front") {
                    lots = this.gridHeight - s.gridPosition.y
                } else if (direction === "right") {
                    lots = s.gridPosition.x + s.gridSize.x
                } else if (direction === "left") {
                    lots = this.gridWidth - s.gridPosition.x
                } else {
                    lots = s.gridPosition.y + s.gridSize.y
                }
                for (var i = 0; i < lots*lots; i++) {
                    subsystemLots.push(s)
                }
            }
        })
        return randomElem(subsystemLots)

    }

    _allocateImpactDamage(collision) {
        const speed = collision.impactSpeed
        if (speed < 1) {
            return
        }
        const direction = this._getDirection(collision)
        if (speed < 3) {
            this.addEffect(shake("small", direction))
        } else if (speed < 5) {
            this.addEffect(shake("medium", direction))
        } else {
            this.addEffect(shake("heavy", direction))
        }

        for (var i = 0; i < Math.random() * speed * 2; i++) {
            this._randomSubsystemFromSide(direction).addLightDamage()
        }
        for (i = 0; i < Math.random() * (speed - 1); i++) {
            this._randomSubsystemFromSide(direction).addMediumDamage()
        }
        for (i = 0; i < Math.random() * (speed - 3) * 0.2; i++) {
            this._randomSubsystemFromSide(direction).addHeavyDamage()
        }
    }

    _getDirection(collision) {
        const a = collision.relativeAngle
        if ((a <= Math.PI / 4) || (7 / 4 * Math.PI <= a)) {
            return "front"
        } else if ((Math.PI / 4 <= a) && (a <= 3 * (Math.PI / 4))) {
            return "right"
        } else if ((3 * Math.PI / 4 <= a) && (a <= 5 * (Math.PI / 4))) {
            return "back"
        } else {
            return "left"
        }

    }

    onCollision(collision) {
        super.onCollision(collision)
        this._allocateImpactDamage(collision)
    }

    get leak() {
        var res = 0
        this.subsystems.forEach(s => {
            res += s.leak
        })
        return res
    }

    get waterLevel() {
        return this._waterLevel
    }

    getInterestingMaterials() {
        const res = {
            [MATERIALS.SPARE_PARTS]: MATERIALS.SPARE_PARTS,
            [MATERIALS.LEAK_SEALS]: MATERIALS.LEAK_SEALS,
        }
        this.subsystems.forEach(s => s.addInterestingMaterialsIds(res))
        return res
    }

    getStorage() {
        return this._storage
    }

    get inventoryCounts() {
        return this._storage.inventory
    }

}
