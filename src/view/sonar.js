import React, { useEffect, useState } from "react";
import {Stage, Layer, Line, Circle, Rect, Container, Group, Arc} from 'react-konva'
import { toDegrees } from "../units";

const SIZE_PX = 400


function SonarBackground({position, scale}) {
    const LINES_SPACING_U = 20
    const LINES_SPACING_PX = scale * LINES_SPACING_U

    const vertLines = []
    for (var x = LINES_SPACING_PX -SIZE_PX - ((scale * position.x) % LINES_SPACING_PX); x < SIZE_PX; x += LINES_SPACING_PX) {
        vertLines.push(x)
    }
    const horizLines = []
    for (var y = LINES_SPACING_PX - SIZE_PX - ((scale * position.y) % LINES_SPACING_PX); y < SIZE_PX; y += LINES_SPACING_PX) {
        horizLines.push(y)
    }

    return <Group>

        <Rect listening={false} x={-SIZE_PX} y={-SIZE_PX} width={2 * SIZE_PX} height={2 * SIZE_PX} fill="black"/>
        {
            vertLines.map(x => <Line key={"sonar-bg-v-" + x}
                listening={false}
                points={[x, -SIZE_PX, x, SIZE_PX]} stroke="#333333"
                />)
        }
        {
            horizLines.map(y => <Line key={"sonar-bg-h-" + y}
                listening={false}
                points={[-SIZE_PX, y, SIZE_PX, y]} stroke="#333333"
                />)
        }

    </Group>

}

function ReferenceFrame({position, children}) {
    return <Group offsetX={-position.x} offsetY={-position.y}>
            {children}
    </Group>
}

function Facing({blip, scale}) {
    const h = blip.entityWidth + 4 / scale
    const w = blip.entityLength
    return <Group x={-w / 2} y={-h / 2} offsetX={-w / 2} offsetY={-h / 2}>
        <Group offsetX={w/2} offsetY={h/2} rotation={toDegrees(blip.entityOrientation)}>
            <Line points={[0, h/2, w, 0, w, h, 0, h/2]} stroke="yellow" strokeWidth={1/scale}/>
        </Group>
    </Group>
}

function SonarBlip({blip, actionController, debug=false, scale}) {
    const force = blip.lastActingForce.div(blip.mass).multiply(5)

    return <ReferenceFrame position={blip.position}>
        <Circle
            width={blip.radius * 2}
            height={blip.radius * 2}
            fill="red"
        />
        {blip.targetted && <Circle /* targetted overlay */
            width={blip.radius * 2 + 15 / scale}
            height={blip.radius * 2 + 15 / scale}
            stroke="#ddd"
            strokeWidth={1 / scale}
            dash={[2, 1]}
        />}
        {debug && <Facing blip={blip} scale={scale}/>}
        {debug && blip.targetted && blip.targetPosition && <Circle /* entity target */
            x = {blip.targetPosition.x - blip.position.x}
            y = {blip.targetPosition.y - blip.position.y}
            stroke="green"
            radius={5 / scale}
            strokeWidth={3 / scale}
        />}
        {debug && blip.targetted && blip.lastActingForce && <Group /* acting force */>
                <Line strokeWidth = {2 / scale} stroke="yellow"
                    points={[0, 0, force.x, force.y]} />
            </Group>
        }
        <Circle /* click overlay */
            width={blip.radius * 2 + 20 / scale}
            height={blip.radius * 2 + 20 / scale}
            onClick={e => actionController.targetEntityId = blip.entityId}
        />
    </ReferenceFrame>
}

function SonarBlips({blips, actionController, debug, scale}) {
    return <Group>
        {
            blips.map(b => <SonarBlip key={b.id} blip={b} scale={scale} debug={debug} actionController={actionController}/>)
        }
    </Group>
}


function SubMarker({volume, scale}){
    const wPx = volume.width * scale
    const rPx = wPx / 2
    const hPx = volume.length * scale
    const color = "#777777"

    return <Group>
        {/*<Rect x={-rPx} y={-hPx / 2} width={wPx} height={hPx} fill="green"/>*/}
        <Circle x={0} y={-hPx / 2 + rPx} radius={rPx} fill={color}/>
        <Rect x={-wPx / 2} y={-hPx / 2 + rPx} width={wPx} height={hPx - rPx - 8} fill={color}/>
        <Rect x={-wPx / 2 + 2} y={hPx / 2 - 8} width={wPx - 4} height={2} fill={color}/>
        <Rect x={-wPx / 2 + 1} y={hPx / 2 - 6} width={wPx - 2} height={6} fill={color}/>



    </Group>

}

function SubReferenceFrame({position, scale=1, children}) {
    return <Group >
                <Group offsetX={position.x} offsetY={position.y} scaleX={scale} scaleY={scale}>
            {children}
            </Group>
    </Group>
}

function Sonar({subsystem, actionController}) {
    const scale = SIZE_PX / (subsystem.range * 2)   // px per unit


    return <div className="sonar">
        <Stage width={SIZE_PX} height={SIZE_PX} >
            <Layer>
                <Group offsetX={-SIZE_PX / 2} offsetY={-SIZE_PX / 2}>
                    <Group rotation={toDegrees(-subsystem.orientation) + 90}>
                        <SonarBackground position={subsystem.position} scale={scale}/>
                        <SubReferenceFrame position={subsystem.position} scale={scale}>
                            <SonarBlips blips={subsystem.blips} actionController={actionController} scale={scale} debug={subsystem.debug}/>
                        </SubReferenceFrame>
                    </Group>
                    {<SubMarker volume={subsystem.subVolume} scale={scale}/>}
                </Group>
            </Layer>
        </Stage>
    </div>
}



export default Sonar;
