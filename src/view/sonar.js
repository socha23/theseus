import React, { useEffect, useState } from "react";
import {Stage, Layer, Line, Circle, Rect, Container, Group} from 'react-konva'
import { toDegrees } from "../units";

const SIZE_PX = 200


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

function Entity({entity}) {
    const p = entity.getPosition()
    const h = entity.getWidth() + 4
    const w = entity.getLength() + 2
    return <Group x={-w/2} y={-h/2} offsetX={-p.x -w /2} offsetY={-p.y - h/2}>
        <Group offsetX={w/2} offsetY={h/2} rotation={toDegrees(entity.getOrientation())}>
            <Line points={[-2, h/2, w, 0, w, h, -2, h/2]} stroke="yellow" strokeWidth={1}/>
        </Group>
    </Group>


}

function Entities({entities}) {
    return <Group>
        {
            entities.map(b => <Entity key={b.id} entity={b}/>)
        }
    </Group>
}


function SonarBlip({blip}) {
    return <Circle
        x={blip.position.x}
        y={blip.position.y}
        width={blip.radius * 2}
        height={blip.radius * 2}
        fill="red"
        />
}

function SonarBlips({blips}) {
    return <Group>
        {
            blips.map(b => <SonarBlip key={b.id} blip={b}/>)
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

function Rotator({width, height, rotation, children}) {
    return <Group offsetX={-width / 2} offsetY={-height / 2}>
        <Group rotation={toDegrees(rotation)}>
            {children}
        </Group>
    </Group>
}

function SubReferenceFrame({position, scale=1, children}) {
    return <Group >
                <Group offsetX={position.x} offsetY={position.y} scaleX={scale} scaleY={scale}>
            {children}
            </Group>
    </Group>
}



function Sonar({subsystem}) {
    const scale = SIZE_PX / (subsystem.range * 2)   // px per unit


    return <Stage width={SIZE_PX} height={SIZE_PX} >
        <Layer>
            <Group offsetX={-SIZE_PX / 2} offsetY={-SIZE_PX / 2}>
                <Group rotation={toDegrees(-subsystem.orientation) + 90}>
                    <SonarBackground position={subsystem.position} scale={scale}/>
                    <SubReferenceFrame position={subsystem.position} scale={scale}>
                        {subsystem.debug && <Entities entities={subsystem.entities}/>}
                        <SonarBlips blips={subsystem.blips}/>
                        {subsystem.debug && <Entity entity={subsystem.sub}/>}
                    </SubReferenceFrame>
                </Group>
                {<SubMarker volume={subsystem.subVolume} scale={scale}/>}
            </Group>
        </Layer>
    </Stage>
}



export default Sonar;
