// basic time unit is s, other than update state where it is ms
// basic distane unit is m

const SECONDS_IN_H = 60 * 60

const MILLIS_IN_H = SECONDS_IN_H * 1000
const M_IN_KM =  1000

export function toKph(speed) {
    return speed / M_IN_KM * SECONDS_IN_H
}

export function toKm(distance) {
    return distance / M_IN_KM
}

export function toDegrees(radian) {
    return 180 * radian / Math.PI
}
