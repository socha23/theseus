import { Point } from "./physics";

class Edge {
    constructor(from, to) {
        this.from = from
        this.to = to
    }

    intersects(other) {
        // https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
        // Some variables for reuse, others may do this differently

        const p0x = this.from.x;
        const p0y = this.from.y;
        const p1x = this.to.x;
        const p1y = this.to.y;
        const p2x = other.from.x;
        const p2y = other.from.y;
        const p3x = other.to.x;
        const p3y = other.to.y;

        var d, dx1, dx2, dx3, dy1, dy2, dy3, s, t;

        dx1 = p1x - p0x;      dy1 = p1y - p0y;
        dx2 = p3x - p2x;      dy2 = p3y - p2y;
        dx3 = p0x - p2x;      dy3 = p0y - p2y;

        d = dx1 * dy2 - dx2 * dy1;

        if(d !== 0){
            s = dx1 * dy3 - dx3 * dy1;
            if((s <= 0 && d < 0 && s >= d) || (s >= 0 && d > 0 && s <= d)){
                t = dx2 * dy3 - dx3 * dy2;
                if((t <= 0 && d < 0 && t > d) || (t >= 0 && d > 0 && t < d)){
                    t = t / d;
                    return new Point(p0x + t * dx1, p0y + t * dy1)
                }
            }
        }
        return null
    }

    get theta() {
        return Math.atan2(this.from.y - this.to.y, this.from.x - this.to.x)
    }

    toVector() {
        return new Vector(this.to.x - this.from.x, this.to.y - this.from.y)
    }
}

var autoinc = 0

