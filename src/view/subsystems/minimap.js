import React, { useState } from "react";
import {Stage, Layer, Line, Circle, Rect, Group, Ellipse, Text} from 'react-konva'
import "../../css/subsystems/minimap.css"


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
    return <Line points={linePointsFromPolygon(feature.polygon)} closed={true} fill="#444"/>
}

export function Minimap({subsystem}) {
    const scale = SIZE_PX / (subsystem.maxX - subsystem.minX)


    return <div className="minimap">
        <div className="display" style={{width: SIZE_PX + 2, height: SIZE_PX + 2}}>
            {subsystem.on && <Stage width={SIZE_PX} height={SIZE_PX} >
                <Layer>
                    <Rect
                        x={subsystem.minX} width={subsystem.maxX - subsystem.minX}
                        y={subsystem.minY} height={subsystem.maxY - subsystem.minY}
                        fill="black"
                        />
                    <Group offsetX={subsystem.minX} offsetY={subsystem.minY} scaleX={scale} scaleY={scale}>
                        {
                            subsystem.features.map(f => <Feature key={f.id} feature={f}/>)
                        }
                        <Circle x={subsystem.position.x} y={subsystem.position.y} radius={1 /scale} fill="red"/>
                    </Group>
                </Layer>
            </Stage>}
        </div>
    </div>
}
