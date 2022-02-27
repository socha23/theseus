const DEFAULT_ACTION_PARAMS = {
    pressToActivate: false,
    progressMax: 0,
    progressDecay: 0,
    icon: "fa-solid fa-angle-right",
    key: null,
}

const ACTION_STATES = {
    DEFAULT: "default",
    PROGRESS: "progress",
    AFTER_PROGRESS: "afterProgress",
    ACTIVE: "active",
    JUST_COMPLETED: "justCompleted",
    COMPLETED: "completed"
}

export const ACTION_CATEGORY = {
    STANDARD: "standard",
    DIRECTION: "direction",
    THROTTLE: "throttle",
}


export class Action {
    constructor(id, name, category, params={}){
        this.id = id
        this.name = name
        this.category = category
        this.progress = 0
        this.state = ACTION_STATES.DEFAULT

        this.params = {...DEFAULT_ACTION_PARAMS, ...params}
    }


    _isProgressCompleted() {
        return this.progress >= this.params.progressMax
    }

    _duringProgress() {
        return this.progress >= this.params.progressMax
    }


    _maybeStartAction() {
        if (this._usesProgress() && !this._isProgressCompleted())
            return
    }

    usesPressToActivate() {
        return this.params.pressToActivate
    }

    _usesProgress() {
        return this.params.progressMax > 0
    }

    _progress(deltaMs) {
        this.progress = Math.min(this.params.progressMax, this.progress + deltaMs)
        if (this.progress >= this.params.progressMax) {
            this.state = ACTION_STATES.AFTER_PROGRESS
            this.progress = 0
        }
    }

    _decayProgress(deltaMs) {
        if (this.params.progressDecay > 0) {
            const decay = (deltaMs / 1000) * this.params.progressDecay
            this.progress = Math.max(0, this.progress - decay)
        } else {
            this.progress = 0
        }
        if (this.progress == 0) {
            this.state = ACTION_STATES.DEFAULT
        }
    }

    _enterProgress() {
        this.state = ACTION_STATES.PROGRESS
    }

    _enterActive() {
        this.state = ACTION_STATES.ACTIVE
    }

    isActive() {
        return this.state == ACTION_STATES.ACTIVE
    }

    _enterCompleted() {
        this.state = ACTION_STATES.JUST_COMPLETED
        this.onCompleted()
    }

    updateState(deltaMs, model, actionController) {
        if (this.state == ACTION_STATES.JUST_COMPLETED) {
            this.state = ACTION_STATES.COMPLETED
        }

        if (!this.isEnabled()) {
            this.state = ACTION_STATES.DEFAULT
            this.progress = 0
        }

        const isClicked = (actionController.isCurrent(this))
            || (this.params.key && actionController.isKeyDown(this.params.key))

        if (isClicked) {
            if (this._usesProgress() && this.state == ACTION_STATES.DEFAULT) {
                this._enterProgress()
            }

            if (this.state == ACTION_STATES.PROGRESS) {
                this._progress(deltaMs)
            }

            if (this.state == ACTION_STATES.DEFAULT || this.state == ACTION_STATES.AFTER_PROGRESS) {
                this._enterActive()
            }

            if (this.state == ACTION_STATES.ACTIVE) {
                this.onActive(deltaMs)
            }

            if (!this.usesPressToActivate() && this.state == ACTION_STATES.ACTIVE) {
                actionController.resetCurrentAction()
                this._enterCompleted()
            }
        } else {
            if (this._usesProgress() && this.state == ACTION_STATES.PROGRESS) {
                this._decayProgress(deltaMs)
            }
            if (this.usesPressToActivate() && this.state == ACTION_STATES.ACTIVE) {
                this._enterCompleted()
            }
            if (this.state == ACTION_STATES.COMPLETED) {
                this.state = ACTION_STATES.DEFAULT
            }
        }
    }

    onActivationStarted() {

    }

    onActive(deltaMs) {

    }

    onCompleted() {

    }

    isEnabled() {
        return true
    }

    toViewState() {
        return {
            id: this.id,
            name: this.name,
            iconClass: this.params.icon,

            progress: this.progress,
            progressMax: this.params.progressMax,
            recentlyCompleted: this.state == ACTION_STATES.JUST_COMPLETED,
            usesPressToActivate: this.usesPressToActivate(),
            enabled: this.isEnabled(),
            category: this.category,
            state: this.state,
        }
    }

}

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

export class ToggleAction extends Action {
    constructor(id, name, category, params={}){
        super(id, name, category, params)
        this.value = false
    }

    isSelected() {
        return this.value
    }

    onCompleted() {
        super.onCompleted()
        this.value = !this.value
    }

    usesPressToActivate() {
        return true
    }

    toViewState() {
        return {
            ...super.toViewState(),
            selected: this.isSelected(),
        }
    }
}


export class RadioAction extends Action {
    constructor(id, name, category, value, params={}, toggleGroup=null){
        super(id, name, category, params)
        this.toggleGroup = toggleGroup ?? id + "_group"
        this.value = value
    }

    isSelected() {
        return RADIO_CONTROLLER.get(this.toggleGroup, null) == this.value
    }

    onCompleted() {
        super.onCompleted()
        RADIO_CONTROLLER.set(this.toggleGroup, this.value)
    }


    toViewState() {
        return {
            ...super.toViewState(),
            selected: this.isSelected(),
            value: this.value,
        }
    }
}
