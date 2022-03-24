import React, { useState } from "react";
import {Stage, Layer, Line, Circle, Rect, Group, Ellipse, Text} from 'react-konva'
import { rgbGradientValue } from "../../gradient";
import { EFFECT_TYPES } from "../../model/effects";
import { Point, SimpleRect, Vector } from "../../model/physics";
import { AIM_LINE_TYPE, RANGE_CIRCLE_TYPE } from "../../model/subsystems/sonar";
import { toDegrees } from "../../units";
import { relativeAngle } from "../../utils";
import { ActionButton } from "../widgets";

const SIZE_PX = 420//376


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
    const h = blip.width + 4 / scale
    const w = blip.length
    return <Group x={-w / 2} y={-h / 2} offsetX={-w / 2} offsetY={-h / 2}>
        <Group offsetX={w/2} offsetY={h/2} rotation={toDegrees(blip.orientation)}>
            <Line points={[w, h/2, 0, 0, 0, h, w, h/2]} stroke="yellow" strokeWidth={1/scale}/>
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
    if ((hitAnimStart !== 0) || blip.effects.some(e => e.type === EFFECT_TYPES.ENTITY_HIT)) {
        if (hitAnimStart === 0) {
            setHitAnimStart(Date.now())
        }
        const deltaMs = (hitAnimStart === 0) ? 0 : (Date.now() - hitAnimStart)
        if (deltaMs > HIT_ANIM_TIME) {
            setHitAnimStart(0)
            phase = 1
        } else {
            phase = deltaMs / HIT_ANIM_TIME
        }
    }
    const color = (phase === 0 || phase === 1) ? blip.color : rgbGradientValue(phase, ANIM_COLOR)
    const opacity = (blip.alive ? 1 : 0.8)

    return <Ellipse
        radius={{x: blip.length / 2, y: blip.width / 2}}
        rotation={toDegrees(blip.orientation)}
        fill={color}
        opacity={opacity}
    />
}


function SonarBlip({blip, tracked, actionController, debug=false, scale}) {
    const force = blip.lastActingForce.div(blip.mass).multiply(5)
    return <ReferenceFrame position={blip.position}>
        <SonarBlipCircle blip={blip}/>
        {tracked && <Circle /* tracked overlay */
            listening={false}
            width={blip.radius * 2 + 15 / scale}
            height={blip.radius * 2 + 15 / scale}
            stroke="#ddd"
            strokeWidth={1 / scale}
            dash={[2, 1]}
        />}
        {debug && <Facing blip={blip} scale={scale}/>}
        {debug && tracked && blip.targetPosition && <Circle /* entity target */
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
            onClick={e => actionController.targetEntityId = blip.id}
        />
    </ReferenceFrame>
}

function SonarBlips({blips, trackedBlipId, actionController, debug, scale}) {
    return <Group>
        {
            blips.map(b => <SonarBlip key={b.id} blip={b} tracked={b.id===trackedBlipId} scale={scale} debug={debug} actionController={actionController}/>)
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
                radius={r.range }
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

function AimLines({scale, aimLines}) {
    return <Group>
        {
            aimLines.map(a => <Line
                key={a.id}
                points={[a.from.x, a.from.y, a.to.x, a.to.y]}
                listening={false}
                stroke={aimlineVal(AIM_LINE_COLOR, a)}
                strokeWidth={aimlineVal(AIM_LINE_STROKE_WIDTH, a)/scale}
                _dash={[2/scale,4/scale]}
                opacity={aimlineVal(AIM_LINE_OPACITY, a)}
                />)
        }
    </Group>
}


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

function Features({features}) {
    return <Group>
        {
            features.map(f => <Feature key={f.id} feature={f}/>)
        }
    </Group>
}

function Feature({feature}) {
    return <Line points={linePointsFromPolygon(feature.polygon)} closed={true} fill="#444"/>
}

///////////
// HITMARKS
///////////

function HitMarks({hitMarks}) {
    return <Group>
        {
            hitMarks.map(h => <Circle
                key={h.position.x + "_" + h.position.y}
                x={h.position.x}
                y={h.position.y}
                radius={h.strength}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndRadius={h.strength}
                fillRadialGradientColorStops={[0, 'red', 1, 'transparent']}

                listening={false}
            />)
        }
    </Group>
}


///////////
// SUB MARKER
///////////

function SubMarker({subsystem}){
    const wPx = subsystem.subVolume.length
    const hPx = subsystem.subVolume.width
    const rPx = hPx / 2
    const color = "#777777"

    return <ReferenceFrame position={subsystem.position}>
        <Group rotation={toDegrees(subsystem.orientation)}>
            <Circle x={wPx / 2 - rPx} y={0} radius={rPx} fill={color}/>
            <Rect x={(-wPx / 2 + 2)} y={-hPx / 2} width={wPx - rPx - 2} height={hPx} fill={color}/>
            <Rect x={-wPx / 2} y={-hPx / 2 + 0.2} width={3} height={hPx - 0.4} fill={color}/>
            <Rect x={-wPx / 2} y={-hPx / 2} width={1} height={hPx} fill={color}/>
        </Group>
    </ReferenceFrame>
}

function SubReferenceFrame({position, scale=1, children}) {
    return <Group >
                <Group offsetX={position.x} offsetY={position.y} scaleX={scale} scaleY={scale}>
            {children}
            </Group>
    </Group>
}



function gamePosToScreenPos(subPosition, subOrientation, targetPosition, scale) {
    const deltaP = targetPosition.minus(subPosition)
    const deltaPScaled = new Point(deltaP.x * scale, deltaP.y * scale)

    return deltaPScaled.rotate(-subOrientation - Math.PI / 2).plus(new Point(SIZE_PX / 2, SIZE_PX / 2))
}

function Target({subPosition, subOrientation, target, scale}) {

    const targetTheta = subPosition.vectorTo(target.position).theta
    const relAngle = relativeAngle(subOrientation, targetTheta)

    const MARK_SIZE = 5
    const MARGIN = 3
    const LABEL_MARGIN = 13


    var mark = null
    var labelText = target.name
    var labelAttrs = {}

    const targetPosOnScreen = gamePosToScreenPos(subPosition, subOrientation, target.position, scale)
    const viewport = new SimpleRect(0, 0, SIZE_PX, SIZE_PX)

    if (viewport.contains(targetPosOnScreen)) {
        mark = <Circle listening={false} stroke="#ebf100" radius={MARK_SIZE} opacity={0.5} position={targetPosOnScreen}/>
        labelAttrs = {width: SIZE_PX, height: SIZE_PX - 2 * LABEL_MARGIN, x: targetPosOnScreen.x - SIZE_PX / 2, y: targetPosOnScreen.y + LABEL_MARGIN, align: "center", verticalAlign: "top"}
    } else {
        var arrowPoints = []
        labelText += "\n" + (subPosition.distanceTo(target.position).toFixed(0)) + "m"
        if ((-Math.PI / 4 < relAngle) && (relAngle <= Math.PI / 4)) {
            // front
            const x = (SIZE_PX / 2) + (Math.tan(relAngle) * SIZE_PX / 2)
            arrowPoints = [x - MARK_SIZE, MARGIN + MARK_SIZE, x, MARGIN, x + MARK_SIZE, MARGIN + MARK_SIZE]
            labelAttrs = {width: SIZE_PX, height: SIZE_PX - 2 * LABEL_MARGIN, x: x - SIZE_PX / 2, y: LABEL_MARGIN, align: "center", verticalAlign: "top"}
        } else if ((Math.PI / 4 < relAngle) && (relAngle <= Math.PI * 3 / 4)) {
            // right
            const y = (SIZE_PX / 2) + (Math.tan(relAngle - Math.PI / 2) * SIZE_PX / 2)
            arrowPoints = [SIZE_PX - MARGIN - MARK_SIZE, y - MARK_SIZE, SIZE_PX - MARGIN, y, SIZE_PX - MARGIN - MARK_SIZE, y + MARK_SIZE]
            labelAttrs = {width: SIZE_PX - 2 * LABEL_MARGIN, height: SIZE_PX, x: LABEL_MARGIN, y: y - SIZE_PX / 2, align: "right", verticalAlign: "middle"}
        } else if ((-Math.PI * 3 / 4) < relAngle && relAngle <= (-Math.PI / 4)) {
            // left
            const y = (SIZE_PX / 2) - (Math.tan(relAngle + Math.PI / 2) * SIZE_PX / 2)
            arrowPoints = [MARGIN + MARK_SIZE, y - MARK_SIZE, MARGIN, y, MARGIN + MARK_SIZE, y + MARK_SIZE]
            labelAttrs = {width: SIZE_PX - 2 * LABEL_MARGIN, height: SIZE_PX, x: LABEL_MARGIN, y: y - SIZE_PX / 2, align: "left", verticalAlign: "middle"}
        } else {
            const x = (SIZE_PX / 2) - (Math.tan(relAngle) * SIZE_PX / 2)
            arrowPoints = [x - MARK_SIZE, SIZE_PX - MARGIN - MARK_SIZE, x, SIZE_PX - MARGIN, x + MARK_SIZE, SIZE_PX - MARGIN - MARK_SIZE]
            labelAttrs = {width: SIZE_PX, height: SIZE_PX - 2 * LABEL_MARGIN, x: x - SIZE_PX / 2, y: LABEL_MARGIN, align: "center", verticalAlign: "bottom"}
        }
        mark = <Line listening={false }stroke="#ebf100" closed={true} points={arrowPoints} opacity={0.5}/>
    }

    return <Group>
        {mark}
        <Text listening={false} {...labelAttrs} fontFamily="monospace" stroke="#ebf100" opacity={0.5} strokeWidth={1} text={labelText}/>
    </Group>
}


function Sonar({subsystem, actionController}) {
    const scale = SIZE_PX / (subsystem.range * 2)   // px per unit
    return <div className="sonar">
        <div className="display" style={{width: SIZE_PX + 2, height: SIZE_PX + 2}}>
            {subsystem.on && <Stage width={SIZE_PX} height={SIZE_PX} >
                <Layer>
                    <Group offsetX={-SIZE_PX / 2} offsetY={-SIZE_PX / 2}>
                        <Group rotation={toDegrees(-subsystem.orientation) - 90}>
                            <SonarBackground position={subsystem.position} scale={scale}/>
                            <SubReferenceFrame position={subsystem.position} scale={scale}>
                                <SubMarker subsystem={subsystem}/>
                                <Features scale={scale} features={subsystem.features}/>
                                <AimLines scale={scale} aimLines={subsystem.aimLines}/>
                                <SonarBlips blips={subsystem.blips} trackedBlipId={subsystem.trackedBlipId} actionController={actionController} scale={scale} debug={subsystem.debug}/>
                                <Ranges position={subsystem.position} scale={scale} ranges={subsystem.ranges}/>
                                <HitMarks hitMarks={subsystem.hitMarks}/>
                                {/*<BoundingBox polygon={subsystem.subBoundingBox} scale={scale}/>*/}
                            </SubReferenceFrame>
                        </Group>
                    </Group>
                    <Target
                        subPosition={subsystem.position}
                        subOrientation={subsystem.orientation}
                        target={subsystem.target}
                        scale={scale}
                    />


                </Layer>
            </Stage>}
        </div>
        <div className="toggles">
            {
                subsystem.toggleActions.map(a => <ActionButton
                    key={a.id}
                    action={a}
                    />)
            }
        </div>
    </div>
}



export default Sonar;
