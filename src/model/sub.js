import {Point, Body, Vector } from './physics.js'
import { Entity } from './entities.js'
import { Sonar } from './subsystems/sonar'

import { Storage } from './subsystems/storage'
import { Engine } from './subsystems/engine'
import { randomElem } from '../utils.js'
import { shake, Effect } from './effects.js'
import { MATERIALS } from './materials.js'
import { toHaveFocus } from '@testing-library/jest-dom/dist/matchers'
import { EFFECT_PROJECTILE } from './subsystems/weapons.js'

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
        while (this._balance < 0 && shutdownOrder.length > 0) {
            const s = shutdownOrder.shift()
            s.shutdown(false)
            this._updateCaches()
        }
    }

    get consumption() {
        return this._consumption
    }

    get totalConsumption() {
        return this.consumption
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
        if (this.balance < 0) {
            this._emergencyShutdown()
        }
        // auto turn on
        var balanceLeft = this.balance
        this.subsystems
            .filter(s => !s.disabled && !s.on && s.canBeTurnedOn)
            .forEach(s => {
                if (s.nominalPowerConsumption <= balanceLeft) {
                    s.on = true
                    balanceLeft -= s.nominalPowerConsumption
                }
            })
    }
}


const WATER_LEVEL_UPDATE = 50

export class Sub extends Entity {
    constructor(position, volume, subsystems = []) {
        super("sub", new Body(position, volume, 3 * Math.PI / 2))
        this.subsystems = subsystems

        this._engine = this._findSubsystem(Engine)
        this._storage = this._findSubsystem(Storage)
        this._sonar = this._findSubsystem(Sonar)

        this.gridWidth = 5
        this.gridHeight = 5

        this._gridBusyCache = this._getGridBusy()

        this.steering = new Steering()
        this.operators = new OperatorController()
        this.power = new PowerManagement(this.subsystems)


        this._waterLevel = 0
        this._sinceWaterLevelUpdate = Math.random() * WATER_LEVEL_UPDATE

    }

    updateState(deltaMs, model, actionController) {
        this._moveSubsystems(actionController)


        if (actionController.targetEntityId != null) {
            this.targetEntity = model.getEntity(actionController.targetEntityId)
        }
        if (this.targetEntity?.deleted) {
            this.targetEntity = null
        }

        this.subsystems.forEach(s => s.updateState(deltaMs, model, actionController))

        this.power.updateState()
        this.steering.updateState(deltaMs, model, actionController)
        this._updatePosition()
        this._updateWaterLevel(deltaMs)
        super.updateState(deltaMs, model)

    }

    _updateWaterLevel(deltaMs) {
        this._sinceWaterLevelUpdate += deltaMs
        while (this._sinceWaterLevelUpdate > WATER_LEVEL_UPDATE) {
            this._waterLevel = Math.max(0, Math.min(this._waterLevel + (this.leak * WATER_LEVEL_UPDATE / 1000), this.gridHeight))
            this._sinceWaterLevelUpdate -= WATER_LEVEL_UPDATE
        }
    }

    _moveSubsystems(actionController) {
        if (actionController.movedSubsystemId) {
            this.subsystems
                .find(s => s.id === actionController.movedSubsystemId)
                .gridPosition = actionController.movedSubsystemPosition
            this._gridBusyCache = this._getGridBusy()
        }
    }

    get sonarRange() {
        return this._sonar.range
    }

    get ranges() {
        const result = []
        this.subsystems.forEach(s => {result.push(...s.ranges)})
        return result
    }

    get projectiles() {
        return this.effects.filter(e => e.type === EFFECT_PROJECTILE)
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
                force += e.activeThrustForce
                rotationalForce += e.activeRotationForce
            })

        this.body.addActingForce(this.body.dorsalThrustVector(force))
        this.body.addActingRotation(rotationalForce)
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

    _allocateAtackDamage(damage) {
        const s = randomElem(this.subsystems.filter(s => s.takesDamage))
        const d = damage.strength
        if (d > 20) {
            s.addHeavyDamage()
        } else if (d > 10) {
            s.addMediumDamage()
        } else if (d > 0) {
            s.addLightDamage()
        } else {
            // no damage
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

    onHit(hit) {
        super.onHit(hit)
        this._allocateAtackDamage(hit.damage)
    }


    get leak() {
        const LEAK_BASE = 0.01
        var res = LEAK_BASE
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

    toViewState() {
        return {
            ...super.toViewState(),
            subsystems: this.subsystems.map(s => s.toViewState()),
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            gridBusy: this._gridBusyCache,
            waterLevel: this.waterLevel,
            inventory: this._storage.inventory,
        }
    }


}

