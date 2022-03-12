
const DEFAULT_PARAMS = {
    name: "Statistic",
    maxValues: 100,
    unit: "",
}

class Statistic {
    constructor(params) {
        this.params = {...DEFAULT_PARAMS, ...params}
        this._values = []
    }

    get avgString() {
        return this.avg.toFixed(2) + " ms"
    }

    add(val) {
        this._values.push(val)
        while(this._values.length > this.params.maxValues) {
            this._values.shift()
        }
    }

    get avg() {
        if (this._values.length === 0) {
            return 0
        }
        var sum = 0
        this._values.forEach(v => {sum += v})
        return sum / this._values.length
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
    })
}
