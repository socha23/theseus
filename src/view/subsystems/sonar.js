import React, { useState } from "react";
import {Stage, Layer, Line, Circle, Rect, Group} from 'react-konva'
import { rgbGradientValue } from "../../gradient";
import { EFFECT_TYPES } from "../../model/effects";
import { AIM_LINE_TYPE, RANGE_CIRCLE_TYPE } from "../../model/subsystems/sonar";
import { toDegrees } from "../../units";

const SIZE_PX = 376


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



const HIT_ANIM_TIME = 300

const ANIM_COLOR = [
    {time: 0, value: "#FF0000"},
    {time: 0.2, value: "#FFFFFF"},
    {time: 1, value: "#FF0000"}
]

function SonarBlipCircle({blip}) {

    const [hitAnimStart, setHitAnimStart] = useState(0)
    var phase = 0
    if ((hitAnimStart != 0) || blip.effects.find(e => e.type == EFFECT_TYPES.ENTITY_HIT) != null) {
        if (hitAnimStart == 0) {
            setHitAnimStart(Date.now())
        }
        const deltaMs = hitAnimStart == 0 ? 0 : (Date.now() - hitAnimStart)
        if (deltaMs > HIT_ANIM_TIME) {
            setHitAnimStart(0)
            phase = 1
        } else {
            phase = deltaMs / HIT_ANIM_TIME
        }
    }
    const color = (phase == 0 || phase == 1) ? "red" : rgbGradientValue(phase, ANIM_COLOR)
    const opacity = (blip.alive ? 1 : 0.8)

    return <Circle
        width={blip.radius * 2}
        height={blip.radius * 2}
        fill={color}
        opacity={opacity}
    />
}


function SonarBlip({blip, actionController, debug=false, scale}) {
    const force = blip.lastActingForce.div(blip.mass).multiply(5)
    return <ReferenceFrame position={blip.position}>
        <SonarBlipCircle blip={blip}/>
        {blip.tracked && <Circle /* tracked overlay */
            listening={false}
            width={blip.radius * 2 + 15 / scale}
            height={blip.radius * 2 + 15 / scale}
            stroke="#ddd"
            strokeWidth={1 / scale}
            dash={[2, 1]}
        />}
        {debug && <Facing blip={blip} scale={scale}/>}
        {debug && blip.targetted && blip.targetPosition && <Circle /* entity target */
            listening={false}
            x = {blip.targetPosition.x - blip.position.x}
            y = {blip.targetPosition.y - blip.position.y}
            stroke="green"
            radius={5 / scale}
            strokeWidth={3 / scale}
        />}
        {debug && blip.targetted && blip.lastActingForce && <Group /* acting force */>
            <Line strokeWidth = {2 / scale} stroke="yellow"
                listening={false}
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

///////////
// RANGES
///////////

const RANGE_COLOR = {
    [RANGE_CIRCLE_TYPE.DEFAULT]: "#469528",
    [RANGE_CIRCLE_TYPE.DISABLED]: "",
    [RANGE_CIRCLE_TYPE.HOVER]: "#469528",
}

const RANGE_OPACITY = {
    [RANGE_CIRCLE_TYPE.DEFAULT]: 0.2,
    [RANGE_CIRCLE_TYPE.HOVER]: 0.5,
}

const RANGE_STROKE_WIDTH = {
    [RANGE_CIRCLE_TYPE.DEFAULT]: 4,
    [RANGE_CIRCLE_TYPE.HOVER]: 4,
}

function rangeVal(dict, range) {
    return dict[range.type] ?? dict[RANGE_CIRCLE_TYPE.DEFAULT]
}

function Ranges({position, scale, ranges}) {


    return <Group>
        {
            ranges.map(r => <Circle
                key={r.id}
                listening={false}
                radius={r.range}
                x={position.x}
                y={position.y}
                stroke={rangeVal(RANGE_COLOR, r)}
                strokeWidth={rangeVal(RANGE_STROKE_WIDTH, r)/scale}
                _dash={[2/scale,4/scale]}
                opacity={rangeVal(RANGE_OPACITY, r)}
                />)
        }
    </Group>
}


///////////
// AIMLINES
///////////

const AIM_LINE_COLOR = {
    [AIM_LINE_TYPE.DEFAULT]: "white",
    [AIM_LINE_TYPE.HIT]: "red",
}

const AIM_LINE_OPACITY = {
    [AIM_LINE_TYPE.DEFAULT]: 0.5,
    [AIM_LINE_TYPE.HIT]: 1,
}

const AIM_LINE_STROKE_WIDTH = {
    [AIM_LINE_TYPE.DEFAULT]: 2,
    [AIM_LINE_TYPE.HIT]: 3,
    [AIM_LINE_TYPE.MISS]: 3,
}

function aimlineVal(dict, a) {
    return dict[a.type] ?? dict[AIM_LINE_TYPE.DEFAULT]
}

function AimLines({position, scale, aimLines}) {
    return <Group>
        {
            aimLines.map(a => <Line
                key={a.id}
                points={[position.x, position.y, a.position.x, a.position.y]}
                listening={false}
                stroke={aimlineVal(AIM_LINE_COLOR, a)}
                strokeWidth={aimlineVal(AIM_LINE_STROKE_WIDTH, a)/scale}
                _dash={[2/scale,4/scale]}
                opacity={aimlineVal(AIM_LINE_OPACITY, a)}
                />)
        }
    </Group>
}

///////////
// FEATURES
///////////

function Features({features}) {
    return <Group>
        {
            features.map(f => <Feature key={f.id} feature={f}/>)
        }
    </Group>
}

function Feature({feature}) {
    console.log(feature)
    const points = []
    feature.polygon.points.forEach(p => {
        points.push(p.x, p.y)
    })
    return <Line points={points} closed={true} fill="#444"/>
}

///////////
// SUB MARKER
///////////

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


    return <div className="sonar" style={{width: SIZE_PX + 2, height: SIZE_PX + 2}}>
        {subsystem.on && <Stage width={SIZE_PX} height={SIZE_PX} >
            <Layer>
                <Group offsetX={-SIZE_PX / 2} offsetY={-SIZE_PX / 2}>
                    <Group rotation={toDegrees(-subsystem.orientation) + 90}>
                        <SonarBackground position={subsystem.position} scale={scale}/>
                        <SubReferenceFrame position={subsystem.position} scale={scale}>
                            <Features scale={scale} features={subsystem.features}/>
                            <AimLines position={subsystem.position} scale={scale} aimLines={subsystem.aimLines}/>
                            <SonarBlips blips={subsystem.blips} actionController={actionController} scale={scale} debug={subsystem.debug}/>
                            <Ranges position={subsystem.position} scale={scale} ranges={subsystem.ranges}/>
                        </SubReferenceFrame>
                    </Group>
                    {<SubMarker volume={subsystem.subVolume} scale={scale}/>}
                </Group>
            </Layer>
        </Stage>}
    </div>
}



export default Sonar;
