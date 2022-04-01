import React, { useContext } from "react";
import {Point } from "../model/physics"
import { toDegrees } from "../units";


export function DRect({position=Point.ZERO, width=10, height=10, theta=0, className="", color=null, borderRadius=null, opacity=null, onClick=null}) {
    const transform =
        (theta ? "rotate(" + toDegrees(theta) + "deg) " : "")
        + (position.x ? "translateX(" + position.x + "px) " : "")
        + (position.y ? "translateY(" + position.y + "px) " : "")

        const style = {
            transform: transform,
            position: "absolute",
            left: 0,
            width: width,
            className: className,
            top: 0,
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

export function DEllipse(params) {
    return <DRect {...params}
        position={new Point(params.position.x - params.width / 2, params.position.y - params.height / 2)}
        borderRadius="50%"/>
}


export function DCircle(params) {
    return <DRect {...params}
        position={new Point(params.position.x - params.radius, params.position.y - params.radius)}
        width={2 * params.radius}
        height={2 * params.radius}
        borderRadius="50%"/>
}

export function DTransform({position=Point.ZERO, scale=1, theta=0}) {
    const transform =
        (theta ? "rotate(" + toDegrees(theta) + "deg) " : "")
            + "translateX(" + position.x + ") "
            + "translateY(" + position.y + ") "

}

export function DArea({width="100%", height="100%", children}) {
    return <div style={{width: width, height: height, position: "relative"}}>
        {children}
    </div>
}
