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

const MinimapContents = _MinimapContents

function _Minimap({position, minX, maxX, minY, maxY, on, target, features}) {
    const scale = SIZE_PX / (maxX - minX)
    return <div className="minimap">
        <div className="display" style={{width: SIZE_PX + 2, height: SIZE_PX + 2}}>
            {on &&
                    <MinimapContents sizePx={SIZE_PX} minX={minX} maxX={maxX} minY={minY} maxY={maxY} scale={scale} features={features}/>
            }
            {
                on && <div className="sub" style={{
                    left: transpose(position.x, minX, maxX, 0, SIZE_PX) - 2,
                    top: transpose(position.y, minY, maxY, 0, SIZE_PX) - 2,
                }}/>
            }
            {
                on && <div className="target" style={{
                    left: transpose(target.x, minX, maxX, 0, SIZE_PX) - 2,
                    top: transpose(target.y, minY, maxY, 0, SIZE_PX) - 2,
                }}/>
            }
        </div>

    </div>
}

export const Minimap = memo(_Minimap)
