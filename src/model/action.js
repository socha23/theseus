export const ACTION_CATEGORY = {
    STANDARD: "standard",
    DIRECTION: "direction",
    THROTTLE: "throttle",
    SPECIAL: "special",
}

///////////////
// BASE ACTIONS
///////////////

const BASE_ACTION_PARAMS = {
    id: "",
    name: "",
    icon: "fa-solid fa-angle-right",
    category: ACTION_CATEGORY.STANDARD,
    key: null,
    onCompleted: m => {},
    onEnterActive: m => {},
    onExitActive: m => {},
    isEnabled: () => true,
    isVisible: () => true,
    onChange: (newVal, oldVal) => {},
    activeUntilCancel: false,
    requiresOperator: false,
}


export class BaseAction {
    constructor(params){
        this.params = {...BASE_ACTION_PARAMS, ...params}
        this._active = false
    }

    get id() {
        return this.params.id
    }

    get name() {
        return this.params.name
    }

    usesPressToActivate() {
        return false
    }

    get key() {
        return this.params.key
    }

    get active() {
        return this._active
    }

    get enabled() {
        return this.params.isEnabled()
    }

    get visible() {
        return this.params.isVisible()
    }


    execute(model) {
        this._activate(model)
        if (!this.params.activeUntilCancel) {
            this._deactivate(model)
            this._complete(model)
        }
    }

    _activate(model) {
        this._active = true
        this.onEnterActive(model)
        this.params.onEnterActive(model)
    }

    _deactivate(model) {
        this._active = false
        this.onExitActive(model)
        this.params.onExitActive(model)
    }

    _complete(model) {
        this.onCompleted(model)
        this.params.onCompleted(model)
    }

    onEnterActive(model) {
    }

    onExitActive(model) {
    }

    onCompleted(model) {
    }

    onCancelled(model) {
    }

    toViewState() {
        return {
            id: this.id,
            name: this.name,
            iconClass: this.params.icon,
            recentlyCompleted: false,
            usesPressToActivate: this.usesPressToActivate(),
            enabled: this.enabled,
            active: this._active,
            category: this.params.category,
            visible: this.visible,
        }
    }

    updateState(deltaMs, model, actionController) {
        if (this.enabled && actionController.isCurrent(this)) {
            this.execute(model)
        }
    }

    cancel(model) {
        this._deactivate(model)
        this.onCancelled(model)
    }
}


export class WrapperAction {
    constructor(innerAction) {
        this._innerAction = innerAction
    }

    usesPressToActivate() {
        return this._innerAction.usesPressToActivate()
    }

    get id() {
        return this._innerAction.id
    }

    get name() {
        return this._innerAction.name
    }

    get visible() {
        return this._innerAction.visible
    }

    get key() {
        return this._innerAction.key
    }

    get active() {
        return this._innerAction.active
    }

    get enabled() {
        return this._innerAction.enabled
    }

    execute(model) {
        this._innerAction.execute(model)
    }

    onEnterActive(model) {
        this._innerAction.onEnterActive(model)
    }

    onExitActive(model) {
        this._innerAction.onExitActive(model)
    }

    onCompleted(model) {
        this._innerAction.onCompleted(model)
    }

    cancel(model) {
        this._innerAction.cancel(model)
    }

    onCancelled(model) {
        this._innerAction.onCancelled(model)
    }

    toViewState() {
        return this._innerAction.toViewState()
    }

    updateState(deltaMs, model, actionController) {
        this._innerAction.updateState(deltaMs, model, actionController)
    }
}

///////////////
// PRESS AND CLICK
///////////////

export class PressAction extends BaseAction {
    usesPressToActivate() {
        return true
    }

    updateState(deltaMs, model, actionController) {
        if (this.enabled && actionController.isCurrent(this)) {
            if (!this.active) {
                this._active = true
                this.onEnterActive(model)
            }
        } else {
            if (this.active) {
                this._active = false
                this.onExitActive(model)
            }
        }
    }
}

///////////////
// TOGGLE
///////////////

export class ToggleAction extends BaseAction {
    constructor(params){
        super(params)
        this._value = false
    }

    onCompleted(model) {
        this.value = !this.value
    }

    get value() {
        return this._value
    }

    set value(val) {
        const oldVal = this.value
        if (val != oldVal) {
            this._value = val
            this.params.onChange(val, oldVal)
        }

    }

    toViewState() {
        return {
            ...super.toViewState(),
            value: this.value,
            selected: this.value,
        }
    }
}

///////////////
// RADIO
///////////////

class RadioController {
    constructor() {
        this.toggleGroupValues = {}
    }

    set(toggleGroup, val) {
        this.toggleGroupValues[toggleGroup] = val
    }

    get(toggleGroup, defaultVal) {
        return this.toggleGroupValues[toggleGroup] ?? defaultVal
    }
}

const RADIO_CONTROLLER = new RadioController()

export class RadioAction extends BaseAction {
    constructor(params){
        super(params)
        this.toggleGroup = params.toggleGroup ?? params.id + "_group"
        this.value = params.value
    }

    get selected() {
        return RADIO_CONTROLLER.get(this.toggleGroup, null) == this.value
    }

    onCompleted(model) {
        RADIO_CONTROLLER.set(this.toggleGroup, this.value)
    }


    toViewState() {
        return {
            ...super.toViewState(),
            selected: this.selected,
            value: this.value,
        }
    }
}

///////////////
// PROGRESSING
///////////////

export class ProgressAction extends BaseAction {
    constructor(progressMax, innerAction) {
        super(innerAction.params)
        this._inner = innerAction
        this._progressMax = progressMax
        this._progress = 0
        this._progressing = false
    }

    execute(model) {
        this._activate(model)
        this._progressing = true
    }


    get active() {
        return this._inner.active || this._progressing
    }

    get enabled() {
        return this._inner.enabled
    }

    onCancelled(model) {
        if (this.progressing) {
            this._deactivate(model)
        } else {
            super.onCancelled(model)
        }
    }

    _deactivate(model) {
        super._deactivate(model)
        this._resetProgress()
    }

    _resetProgress() {
        this._progressing = false
        this._progress = 0
    }

    toViewState() {
        return {
            ...this._inner.toViewState(),
            ...super.toViewState(),
            usesProgress: true,
            progress: this._progress,
            progressMax: this._progressMax,
        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        if (this._inner.active) {
            this._inner.updateState(deltaMs, model, actionController)
        }
        if (!this._progressing) {
            return
        }
        if (!this.enabled) {
            this._deactivate(model)
            this._complete(model)
            this._resetProgress()
            return
        }

        this._progress += deltaMs
        if (this._progress > this._progressMax) {
            this._resetProgress()
            this._inner.execute(model)
            this._deactivate(model)
            this._complete(model)
        }
    }

}

export class OperatorController {
    constructor() {
        this._currentAction = null
    }

    assignOperator(a) {
        this._currentAction = a
        return {id: "operator"}
    }

    unassignOperator(a) {
        if (this._currentAction == a) {
            this._currentAction = null
        }
    }

    hasAssignedOperator(a) {
        return this._currentAction == a
    }
}

export class OperatorAction extends ProgressAction {
    constructor(progressTime, inner) {
        super(progressTime, inner)
        this._operator = null
    }

    _activate(model) {
        this._operator = model.sub.assignOperator(this)
        super._activate(model)
    }

    _deactivate(model) {
        super._deactivate(model)
        model.sub.unassignOperator(this)
        this._operator = null
    }

    updateState(deltaMs, model, actionController) {
        if (this.active && !model.sub.hasAssignedOperator(this)) {
            this.cancel(model)
        }
        super.updateState(deltaMs, model, actionController)
    }

}

export function action(params) {
    var res = new BaseAction(params)
    if (params.progressTime) {
        if (params.requiresOperator) {
            res = new OperatorAction(params.progressTime, res)
        } else {
            res = new ProgressAction(params.progressTime, res)
        }
    }
    return res
}

