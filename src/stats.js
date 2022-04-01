
const DEFAULT_PARAMS = {
    name: "Statistic",
    retentionTime: 500,
    unit: "",
    minFrameDistance: 0,
}

export class Statistic {
    constructor(params) {
        this.params = {...DEFAULT_PARAMS, ...params}
        this.values = []
        this._frame = this._newFrame()
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

    add(val, commit = false) {
        this._frame.value += val
        if (commit) {
            this.commit()
        }
    }

    commit() {
        const frameDistance = (this.values.length === 0) ? Infinity
            : (this._frame.time - this.values[this.values.length - 1].time)
        if (frameDistance >= this.params.minFrameDistance) {
            this.values.push(this._frame)
        }
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
        name: "SU",
        unit: "ms"
    }),
    RENDER_TIME_MS: new Statistic({
        name: "RT",
        unit: "ms"
    }),
}

export function commitFrameStats() {
    STATISTICS.STATE_UPDATE_MS.commit()
    STATISTICS.RENDER_TIME_MS.commit()
}
