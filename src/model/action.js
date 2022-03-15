export const ACTION_CATEGORY = {
    STANDARD: "standard",
    DIRECTION: "direction",
    THROTTLE: "throttle",
    SPECIAL: "special",
}

///////////////
// BASE ACTIONS
///////////////

const STATE = {
    INACTIVE: "inactive",
    PROGRESSING: "progressing",
    ACTIVE: "active",

}

const BASE_ACTION_PARAMS = {
    id: "",
    name: "",
    longName: "",
    icon: "fa-solid fa-angle-right",
    category: ACTION_CATEGORY.STANDARD,
    getLongName: null,
    onCompleted: m => {},
    onEnterActive: m => {},
    onExitActive: m => {},
    addErrorConditions: c => {},
    isVisible: () => true,
    onChange: (newVal, oldVal) => {},
    requiresOperator: false,
    requiredMaterials: {},
}


export class BaseAction {
    constructor(params){
        this.params = {...BASE_ACTION_PARAMS, ...params}
        this._state = STATE.INACTIVE
        this._errorConditions = []
        this._progressMax = this.params.progressMax || 0
        this._progress = 0
    }

    get id() {
        return this.params.id
    }

    get name() {
        return this.params.name
    }

    get longName() {
        if (this.params.getLongName) {
            return this.params.getLongName()
        }
        return this.params.longName || this.name
    }

    get active() {
        return this._state == STATE.PROGRESSING
            || this._state == STATE.ACTIVE
    }

    get enabled() {
        return this._errorConditions.length === 0
    }

    get visible() {
        return this.params.isVisible()
    }

    get requiredMaterials() {
        return this.params.requiredMaterials
    }

    addErrorConditions(conditions, model) {
        this.params.addErrorConditions(conditions, model)
        if (this._requiresMaterials) {
            const store = model.sub.getStorage()
            const missingMats = Object.keys(this.requiredMaterials)
                .filter(matId =>  store.getCount(matId) < this.requiredMaterials[matId])
                .length
            if (missingMats) {
                conditions.push("Missing materials")
            }
        }
    }

    _payMaterials(model) {
        if (this._requiresMaterials()) {
            const storage = model.sub.getStorage()
            Object.keys(this.requiredMaterials).forEach(matId => {
                storage.take(matId, this.requiredMaterials[matId])
            })
        }
    }

    _activate(model) {
        this._state = STATE.PROGRESSING
        this._progress = 0
        this.onEnterActive(model)
        this.params.onEnterActive(model)
    }

    _progress(model, deltaMs) {
        if (this._state === STATE.PROGRESSING) {
            this._progress += deltaMs
        }
    }

    _deactivate(model) {
        this._state = STATE.INACTIVE
        this._progress = 0
        this.onExitActive(model)
        this.params.onExitActive(model)
    }

    _complete(model) {
        console.log('action completed', this)
        this._payMaterials(model)
        this.onCompleted(model)
        this.params.onCompleted(model)
    }

    _requiresMaterials() {
        return Object.keys(this.requiredMaterials).length > 0
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
            enabled: this.enabled,
            active: this.active,
            category: this.params.category,
            visible: this.visible,
            longName: this.longName,
            showTooltip: true,
            errorConditions: this._errorConditions,
            requiredMaterials: this.requiredMaterials,
        }
    }

    __updateErrorConditions(deltaMs, model) {
        this.errorConditions = []
        this.addErrorConditions(this.errorConditions, model)
    }

    updateState(deltaMs, model, actionController) {
        this.__updateErrorConditions(deltaMs, model)
        if (!this.enabled && this.active) {
            this._deactivate(model)
        }

        if (this.enabled && actionController.isCurrent(this)) {
            if (this.active) {
                this._deactivate(model)
            }
            this._activate(model)
        }

        if (this.enabled && this.active) {
            if (this._state === STATE.PROGRESSING) {
                this._progress += deltaMs
            }

            if (this._progress >= this._progressMax) {
                this._deactivate(model)
                this._complete(model)
            }
        }
    }

    cancel(model) {
        this._deactivate(model)
        this.onCancelled(model)
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
        if (val !== oldVal) {
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

    execute(model, payMaterials=true) {
        this._activate(model, payMaterials)
        this._progressing = true
    }


    get active() {
        return this._inner.active || this._progressing
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

    addErrorConditions(c, m) {
        super.addErrorConditions(c, m)
    }


    _resetProgress() {
        this._progressing = false
        this._progress = 0
    }

    toViewState() {
        const res = {
            ...this._inner.toViewState(),
            ...super.toViewState(),
        }
        res.usesProgress = true
        res.progress = this._progress
        res.progressMax = this._progressMax
        return res
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
//            this._complete(model)
            this._resetProgress()
            return
        }

        this._progress += deltaMs
        if (this._progress > this._progressMax) {
            this._resetProgress()
            this._inner.execute(model, false)
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
        if (this._currentAction === a) {
            this._currentAction = null
        }
    }

    hasAssignedOperator(a) {
        return this._currentAction === a
    }
}

export class OperatorAction extends ProgressAction {
    constructor(progressTime, inner) {
        super(progressTime, inner)
        this._operator = null
    }

    _activate(model, payMaterials) {
        this._operator = model.sub.assignOperator(this)
        super._activate(model, payMaterials)
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

