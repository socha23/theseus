import { OperatorController } from './action.js'
import {Point, Body } from './physics.js'
import { Entity } from './entities.js'

import { Engine, Steering } from './subsystems/others'

export class Sub extends Entity {
    constructor(volume, subsystems = []) {
        super("sub", new Body(new Point(0, 0), volume, Math.PI / 2))
        this.subsystems = subsystems

        this.trackedEntity = null

        this._engine = this._findSubsystem(Engine)
        this._steering = this._findSubsystem(Steering)

        this.gridWidth = 5
        this.gridHeight = 5

        this._gridBusyCache = this._getGridBusy()

        this._operatorController = new OperatorController()

        this._waterLevel = 0
    }

    updateState(deltaMs, model, actionController) {
        this._moveSubsystems(actionController)

        if (actionController.targetEntityId != null) {
            this.targetEntity = model.world.getEntity(actionController.targetEntityId)
        }
        if (this.targetEntity?.deleted) {
            this.targetEntity = null
        }

        this.subsystems.forEach(s => s.updateState(deltaMs, model, actionController))
        if (this.powerBalance < 0) {
            this._emergencyShutdown()
        }
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

    _emergencyShutdown() {
        const shutdownOrder = [...this.subsystems].sort(
            (a, b) => b.powerConsumption - a.powerConsumption
            )
        while (this.powerBalance < 0 && shutdownOrder.length > 0) {
            const s = shutdownOrder.shift()
            s.shutdown()
        }
    }

    get throttle() {
        return  this._steering.getThrottle()
    }

    get powerConsumption() {
        var result = 0
        this.subsystems.forEach(s => {result += s.powerConsumption})
        return result
    }

    get powerGeneration() {
        var result = 0
        this.subsystems.forEach(s => {result += s.powerGeneration})
        return result
    }

    get powerBalance() {
        return this.powerGeneration - this.powerConsumption
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

        var dir = this._steering.direction
        if (
            (dir === 0)
            && (this._steering.rotationControlOn)
            && (Math.abs(this.body.rotationSpeed) > 0.01)
         ) {
            dir = Math.sign(this.body.rotationSpeed) * -1
        }
        this.body.addActingForce(this.body.dorsalThrustVector(force * this.throttle))
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

    assignOperator(a) {
        return this._operatorController.assignOperator(a)
    }

    unassignOperator(a) {
        this._operatorController.unassignOperator(a)
    }

    hasAssignedOperator(a) {
        return this._operatorController.hasAssignedOperator(a)
    }

    toViewState() {
        return {
            subsystems: this.subsystems.map(s => s.toViewState()),
            position: this.body.position,
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            gridBusy: this._gridBusyCache,
            waterLevel: this.waterLevel,
        }
    }

    onCollision(collision) {
        super.onCollision(collision)
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


}
