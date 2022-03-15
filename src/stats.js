
const DEFAULT_PARAMS = {
    name: "Statistic",
    retentionTime: 1000,
    unit: "",
}


const stats = []

class Statistic {
    constructor(params) {
        this.params = {...DEFAULT_PARAMS, ...params}
        this.values = []
        this._frame = this._newFrame()
        stats.push(this)
    }

    _newFrame() {
        return {
            time: Date.now(),
            value: 0

        }
    }

    get avgString() {
        return this.avg.toFixed(2) + " ms"
    }

    add(val) {
        this._frame.value += val
    }

    commit() {
        this.values.push(this._frame)
        this._frame = this._newFrame()
        const now = Date.now()
        while(this.values.length > 0 && this.values[0].time < now - this.params.retentionTime) {
            this.values.shift()
        }
    }

    get avg() {
        if (this.values.length === 0) {
            return 0
        }
        var sum = 0
        this.values.forEach(v => {sum += v.value})
        return sum / this.values.length
    }

    get name() {
        return this.params.name
    }
}

export const STATISTICS = {
    STATE_UPDATE_MS: new Statistic({
        name: "State update",
        unit: "ms"
    }),
    RENDER_TIME_MS: new Statistic({
        name: "Render time",
        unit: "ms"
    }),
    PHYSICS_UPDATE: new Statistic({
        name: "Physics",
        unit: "ms"
    }),
}

export function commitStats() {
    stats.forEach(s => s.commit())
}
