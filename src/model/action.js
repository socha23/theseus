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
    getLongName: null,
    onCompleted: m => {},
    onEnterActive: m => {},
    onExitActive: m => {},
    addErrorConditions: c => {},
    isVisible: () => true,
    onChange: (newVal, oldVal) => {},
    requiresOperator: false,
    requiredMaterials: {},
    progressTime: 0,
    showTooltip: true,
}


export class BaseAction {
    constructor(params){
        this.params = {...BASE_ACTION_PARAMS, ...params}
        this._state = STATE.INACTIVE
        this._errorConditions = []
        this._progressMax = this.params.progressTime
        this._progress = 0
        this._operator = null
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
        return this._state === STATE.PROGRESSING
            || this._state === STATE.ACTIVE
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

    get requiresOperator() {
        return this.params.requiresOperator
    }

    get showTooltip() {
        return this.params.showTooltip
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
        if (this.requiresOperator) {
            const operator = model.sub.operators.assignOperator(this)
            if (operator == null) {
                return
            }
            this._operator = operator
        }

        this._state = STATE.PROGRESSING
        this._progress = 0

        this.onEnterActive(model)
        this.params.onEnterActive(model)
    }

    _deactivate(model) {
        if (this.requiresOperator) {
            model.sub.operators.unassignOperator(this)
            this._operator = null
        }

        this._state = STATE.INACTIVE
        this._progress = 0
        this.onExitActive(model)
        this.params.onExitActive(model)
    }

    _complete(model) {
        this._payMaterials(model)
        this.onCompleted(model)
        this.params.onCompleted(model)
    }

    cancel(model) {
        this._deactivate(model)
        this.onCancelled(model)
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
            visible: this.visible,
            longName: this.longName,
            showTooltip: this.showTooltip,
            errorConditions: this._errorConditions,
            requiredMaterials: this.requiredMaterials,
            usesProgress: this._progressMax > 0,
            progressPercent: Math.floor(this._progress * 100 / this._progressMax),
            progressMax: this._progressMax,
        }
    }

    __updateErrorConditions(deltaMs, model) {
        this._errorConditions = []
        this.addErrorConditions(this._errorConditions, model)
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

        if (this.active && this.requiresOperator && !model.sub.operators.hasAssignedOperator(this)) {
            this._deactivate(model)
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


export function action(params) {
    return new BaseAction(params)
}

