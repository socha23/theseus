import { Point, Polygon } from "./physics"

export function randomPolygon(position, radX=10, radY=radX, edgeCount = (radX * radY) / 50) {

    // Pick random points on a (non-rotated) ellipse, rotate, translate.
    // This quarantees a convex polygon.

    if (edgeCount < 3) {
        edgeCount = 3
    }

    const angles = []
    for (var i = 0; i < edgeCount; i++) {
        angles.push(Math.random() * 2 * Math.PI)
    }
    angles.sort()
    const resultTheta = Math.random() * 2 * Math.PI

    const vertices = angles
        .map(theta => new Point(radX * Math.cos(theta), radY * Math.sin(theta)))
        .map(p => p.rotate(resultTheta))
        .map( p => p.plus(position))

    return new Polygon(vertices)
}

