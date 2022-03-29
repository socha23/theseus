import React, { memo, useState } from "react";
import {Stage, Layer, Line, Circle, Rect, Group, Ellipse, Text} from 'react-konva'
import "../../css/subsystems/minimap.css"
import { jsonCompare, transpose } from "../../utils";


const SIZE_PX = 224//376


function linePointsFromPolygon(polygon) {
    const points = []
    polygon.points.forEach(p => {
        points.push(p.x, p.y)
    })
    return points

}

///////////
// FEATURES
///////////
function Feature({feature}) {
    return <Line points={linePointsFromPolygon(feature)} closed={true} fill="black"/>
}


function _MinimapContents({sizePx, minX, maxX, minY, maxY, scale, features}) {
    return <Stage width={sizePx} height={sizePx} >
        <Layer>
            <Rect
                x={minX} width={maxX - minX}
                y={minY} height={maxY - minY}
                fill="#444"
                />
            <Group offsetX={minX} offsetY={minY} scaleX={scale} scaleY={scale}>
                {
                    features.map(f => <Feature key={f.id} feature={f}/>)
                }
            </Group>
        </Layer>
    </Stage>
}

function compareMinimap(m1, m2) {
    m1 = {...m1}
    m2 = {...m2}
    if (m1.features?.length != m2.features?.length) {
        return false
    }
    m1.features = []
    m2.features = []
    return jsonCompare(m1, m2)
}

const MinimapContents = memo(_MinimapContents, compareMinimap)

export function Minimap({subsystem}) {
    const scale = SIZE_PX / (subsystem.maxX - subsystem.minX)
    return <div className="minimap">
        <div className="display" style={{width: SIZE_PX + 2, height: SIZE_PX + 2}}>
            {subsystem.on &&
                    <MinimapContents sizePx={SIZE_PX} minX={subsystem.minX} maxX={subsystem.maxX} minY={subsystem.minY} maxY={subsystem.maxY} scale={scale} features={subsystem.features}/>
            }
            {
                subsystem.on && <div className="sub" style={{
                    left: transpose(subsystem.position.x, subsystem.minX, subsystem.maxX, 0, SIZE_PX) - 2,
                    top: transpose(subsystem.position.y, subsystem.minY, subsystem.maxY, 0, SIZE_PX) - 2,
                }}/>
            }
            {
                subsystem.on && <div className="target" style={{
                    left: transpose(subsystem.target.x, subsystem.minX, subsystem.maxX, 0, SIZE_PX) - 2,
                    top: transpose(subsystem.target.y, subsystem.minY, subsystem.maxY, 0, SIZE_PX) - 2,
                }}/>
            }
        </div>

    </div>
}
