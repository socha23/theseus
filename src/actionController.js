import React, { useContext, useEffect, useState } from "react";
import GameModel from './model'
import { STATISTICS } from "./stats";
import GameView from './view/view.js';

export class ActionController {
    constructor() {
        this._mouseOverSubsystems = {}
        this._mouseOverAction = null
        this._activeActions = {}
        this.keysDown = {}
        this.keysPressed = {}
        this.targetEntityId = null
        this.values = {}

        this.movedSubsystemId = null
        this.movedSubsystemPosition = null
    }

    isCurrent(action) {
        return (this._activeActions[action.id] ?? null) != null
    }

    onClick(action) {
        this._activeActions[action.id] = action
    }

    onMouseOverSubsystem(subsystem) {
        this._mouseOverSubsystems[subsystem.id] = subsystem
    }

    onMouseOutSubsystem(subsystem) {
        delete this._mouseOverSubsystems[subsystem.id]
    }

    isMouseOverSubsystem(subsystem) {
        return (this._mouseOverSubsystems[subsystem.id] ?? null) != null
    }

    onMouseOverAction(action) {
        this._mouseOverAction = action
    }

    get mouseOverAction() {
        return this._mouseOverAction
    }

    onMouseOutAction(action) {
        this._mouseOverAction = null
    }

    isKeyDown(key) {
        return this.keysDown[key] === true
    }

    wasKeyPressed(key) {
        return this.keysPressed[key] === true
    }

    onKeyDown(key) {
        this.keysDown[key] = true
    }

    onKeyUp(key) {
        this.keysDown[key] = false
        this.keysPressed[key] = true
    }

    reset() {
        this.keysPressed = {}
        this.targetEntityId = null

        this.movedSubsystemId = null
        this.movedSubsystemPosition = null
        this._activeActions = {}
    }

    onSubsystemMoved(id, position) {
        this.movedSubsystemId = id
        this.movedSubsystemPosition = position
    }

    setValue(key, val) {
        this.values[key] = val
    }

    getValue(key, defVal) {
        return this.values[key] ?? defVal
    }
}

export const ActionControllerCtx = React.createContext(null)
