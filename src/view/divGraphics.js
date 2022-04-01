import React, { useContext } from "react";
import {Point } from "../model/physics"
import { toDegrees } from "../units";


export function DPolygon({polygon, className=""}) {
    var path = ""
    var first = true

    const box = polygon.simpleBoundingBox

    polygon.points.forEach(p => {
        if (!first) {
            path += ", "
        } else {
            first = false
        }
        const xP = (p.x - box.x) //* 100 / box.width
        const yP = (p.y - box.y) //* 100 / box.height

        path += (xP + "px " + yP + "px")
    })
    const style = {
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        clipPath: "polygon(" + path + ")",
    }
    return <div className={className} style={style}/>
}

export function DRect({position=Point.ZERO, width=10, height=10, className="", color=null, borderRadius=null, opacity=null, onClick=null}) {
    const style = {
            position: "absolute",
            left: position.x - width / 2,
            width: width,
            className: className,
            top: position.y - height / 2,
            height: height,
            opacity: opacity,
        }

    if (color != null) {
        style.backgroundColor = color
    }
    if (borderRadius != null) {
        style.borderRadius = borderRadius
    }
    if (opacity != null) {
        style.opacity = opacity
    }

    return <div
        onClick={onClick}
        className={className}
        style={style}
    />
}

export function DSegment({from, to, width=1, className=""}) {
    const vect = from.vectorTo(to)
    const theta = vect.theta
    const style = {
        position: "absolute",
        left: from.x - width / 2,
        top: from.y,

        width: (vect.length + width) || 0,
        height: width,
        className: className,

        transformOrigin: (width / 2) + "px 50%",
    }
    if (theta != 0) {
        style.transform = "rotate(" + toDegrees(theta) + "deg) "
    }
    return <div className={className} style={style}/>
}

export function DLine({points, width, className, closed=false}) {
    const lines = []
    for (var i = 0; i < points.length - (closed ? 0 : 1); i++) {
        const j = (i + 1) % points.length
        lines.push(<DSegment key={i} from={points[i]} to={points[j]} width={width} className={className}/>)
    }
    return <div>
        {lines}
    </div>

}

export function DEllipse(params) {
    return <DRect {...params}
        borderRadius="50%"/>
}


export function DCircle(params) {
    return <DRect {...params}
        width={2 * params.radius}
        height={2 * params.radius}
        borderRadius="50%"/>
}

export function DSonarView({size=200, position=Point.ZERO, scale=1, theta=0, children}) {
    const transform =
    ""
            + "translateX(" + size/2 + "px) "
            + "translateY(" + size/2 + "px) "
            + (scale != 1 ? "scale(" + (scale) + ") " : "")
            + (theta ? "rotate(" + toDegrees(theta) + "deg) " : "")
            + "translateX(" + -position.x + "px) "
            + "translateY(" + -position.y + "px) "
    return <div
        style={{
            transformOrigin: "0 0",
            transform: transform
        }}
    >
        {children}
    </div>
}

export function DReferenceFrame({position=Point.ZERO, theta=0, scale=1, children}) {
    const transform =
    ""
            + (scale != 1 ? "scale(" + (scale) + ") " : "")
            + "translateX(" + position.x + "px) "
            + "translateY(" + position.y + "px) "
            + (theta ? "rotate(" + toDegrees(theta) + "deg) " : "")
    return <div
        style={{
            transformOrigin: "0 0",
            transform: transform
        }}
    >
        {children}
    </div>

}

export function DArea({width="100%", height="100%", children}) {
    return <div style={{left: 0, top: 0, width: width, height: height, position: "absolute"}} className="DArea">
        {children}
    </div>
}


