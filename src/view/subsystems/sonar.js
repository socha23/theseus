import React, { memo, useContext, useCallback } from "react";
import { Point, SimpleRect } from "../../model/physics";
import { relativeAngle } from "../../utils";
import { ActionButton } from "../widgets";
import { ActionControllerCtx } from "../../actionController";
import { DArea, DCircle, DEllipse, DLine, DSegment, DRect, DReferenceFrame, DSonarView, DPolygon } from "../divGraphics";

import "../../css/subsystems/sonar.css"
import "../../css/subsystems/hitmarks.css"

const SIZE_PX = 420

const SCALE_MULTIPLIER = 10

function InnerSonarBackground({xFrom, xTo, yFrom, yTo, spacing, scale}) {
    const vertLines = []
    xFrom *= SCALE_MULTIPLIER
    xTo *= SCALE_MULTIPLIER
    yFrom *= SCALE_MULTIPLIER
    yTo *= SCALE_MULTIPLIER
    spacing *= SCALE_MULTIPLIER

    for (var x = xFrom; x <= xTo; x += spacing) {
        vertLines.push(x)
    }
    const horizLines = []
    for (var y = yFrom; y <= yTo; y += spacing) {
        horizLines.push(y)
    }
    return <div>
        <DRect className="background" position={new Point((xFrom + xTo) / 2, (yFrom + yTo) / 2)} width={xTo - xFrom} height={yTo - yFrom}/>
        {
            vertLines.map(x => <DSegment key={"sonar-bg-v-" + x}
                from={new Point(x, yFrom)}
                to={new Point(x, yTo)}
                width={1 / scale * SCALE_MULTIPLIER}
                className="gridLine"
            />)
        }
        {
            horizLines.map(y => <DSegment key={"sonar-bg-h-" + y}
                from={new Point(xFrom, y)}
                to={new Point(xTo, y)}
                width={1 / scale * SCALE_MULTIPLIER}
                className="gridLine"
            />)
        }

    </div>
}

function SonarBackground({position, scale}) {
    const LINES_SPACING_U = 20
    const LINES_SPACING_PX = scale * LINES_SPACING_U

    const linesRadius = Math.floor(SIZE_PX / LINES_SPACING_PX)

    const xFrom = position.x - (position.x % LINES_SPACING_U) - linesRadius * LINES_SPACING_U
    const xTo = position.x - (position.x % LINES_SPACING_U) + linesRadius * LINES_SPACING_U

    const yFrom = position.y - (position.y % LINES_SPACING_U) - linesRadius * LINES_SPACING_U
    const yTo = position.y - (position.y % LINES_SPACING_U) + linesRadius * LINES_SPACING_U

    return <InnerSonarBackground xFrom={xFrom} xTo={xTo} yFrom={yFrom} yTo={yTo} spacing={LINES_SPACING_U} scale={scale}/>
}

function SonarBlip({blip, tracked, trackedOverlayMargin=8, clickOverlayMargin=12, debug=false, scale}) {
    const actionController = useContext(ActionControllerCtx)
    const onClick = useCallback(e => {actionController.targetEntityId = blip.id})
    const scaledLength = blip.length * SCALE_MULTIPLIER
    const scaledWidth = blip.width * SCALE_MULTIPLIER
    return <div className="entity">
        <DReferenceFrame position={blip.position.scale(SCALE_MULTIPLIER)} theta={blip.orientation}>
            {
                // visible blip
                <DEllipse
                    width={scaledLength}
                    height={scaledWidth}
                    color={blip.color}
                    className={
                        "blip "
                        + (blip.alive ? "alive " : "dead ")
                    }
                />

            }
            {
                // hitmarks
                <HitMarks hitMarks={blip.hitMarks}/>
            }
            {
                // debug overlay
                debug && <div className="debug">
                    <DLine
                        points={[
                            new Point(-scaledLength / 2, -scaledWidth),
                            new Point(-scaledLength / 2, scaledWidth),
                            new Point(scaledLength / 2, 0),
                        ]}
                        closed={true}
                        width={1 / scale * SCALE_MULTIPLIER}
                        className="orientation"

                    />
                </div>
            }
            {
                // tracked overlay
                tracked && <DCircle
                    radius={(blip.radius + trackedOverlayMargin / scale) * SCALE_MULTIPLIER}
                    className="selectedMark"
                />
            }
            {
                // click overlay
                <DCircle
                    radius={(blip.radius + clickOverlayMargin / scale) * SCALE_MULTIPLIER}
                    onClick={onClick}
            />
            }
        </DReferenceFrame>
        {
            // entity target
            debug && tracked && blip.targetPosition && <DCircle
                listening={false}
                position={blip.targetPosition.scale(SCALE_MULTIPLIER)}
                className="target"
                radius={5 / scale * SCALE_MULTIPLIER}
            />
        }
    </div>
}


function SonarBlips({blips, trackedBlipId, debug, scale}) {
    return <div className="blips">
        {
            blips.map(b => <SonarBlip key={b.id} blip={b} tracked={b.id===trackedBlipId} scale={scale} debug={debug}/>)
        }
    </div>
}

function _Plants({plants, trackedBlipId, debug, scale}) {
    return <div className="plants">
        {
            plants.map(b => <SonarBlip key={b.id} blip={b} tracked={b.id===trackedBlipId} trackedOverlayMargin={0} clickOverlayMargin={0} scale={scale} debug={debug}/>)
        }
    </div>
}

const Plants = memo(_Plants)

///////////
// RANGES
///////////

function Ranges({position, ranges}) {
    return <div className="ranges">
        {
            ranges.map(r => <DCircle
                key={r.id}
                radius={r.range * SCALE_MULTIPLIER}
                position={position.scale(SCALE_MULTIPLIER)}
                className={"range " + r.type}
                />)
        }
    </div>
}


///////////
// AIMLINES
///////////

function AimLines({scale, aimLines}) {
    return <div className="aimLines">
        {
            aimLines.map(a => <DSegment
                key={a.id}
                width={scale}
                from={a.from.scale(SCALE_MULTIPLIER)}
                to={a.to.scale(SCALE_MULTIPLIER)}
                className="aimLine"
                />)
        }
    </div>
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
    return <div>
        {
            features.map(f => <Feature key={f.id} feature={f}/>)
        }
    </div>
}

function Feature({feature}) {
    return <DPolygon polygon={feature.scale(SCALE_MULTIPLIER)} className="feature"/>
}

///////////
// HITMARKS
///////////

function HitMarks({hitMarks}) {
    return <div>
        {
            hitMarks.map(h => <DCircle
                key={h.id}
                position={h.position.scale(SCALE_MULTIPLIER)}
                radius={h.strength * SCALE_MULTIPLIER / 10}
                className="hitMark"
            />)
        }
    </div>
}


///////////
// SUB MARKER
///////////

function SubMarker({subVolume, position, orientation}){
    const wPx = subVolume.length * SCALE_MULTIPLIER
    const hPx = subVolume.width * SCALE_MULTIPLIER
    const rPx = hPx / 2

    return <DReferenceFrame position={position.scale(SCALE_MULTIPLIER)} theta={orientation}>
        <DCircle className="subMarker" position={new Point(wPx / 2 - rPx, 0)} radius={rPx}/>
        <DRect className="subMarker" position={new Point(0, 0)} width={wPx - 2 * rPx} height={rPx * 2}/>
        <DRect className="subMarker" position={new Point(-wPx / 2 + (rPx / 4), 0)} width={rPx / 2} height={rPx * 1.6}/>
        <DRect className="subMarker" position={new Point(-wPx / 2 + (3 * rPx / 4), 0)} width={rPx / 2} height={rPx * 1.4}/>
    </DReferenceFrame>
}

///////////
// TARGET SIGN
///////////

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
        mark = <DCircle className="circle" radius={MARK_SIZE} position={targetPosOnScreen}/>
        labelAttrs = {width: SIZE_PX, height: SIZE_PX - 2 * LABEL_MARGIN, left: targetPosOnScreen.x - SIZE_PX / 2, top: targetPosOnScreen.y + LABEL_MARGIN, textAlign: "center", verticalAlign: "top"}
        labelText=<span>{target.name}</span>
    } else {
        var arrowPoints = []
        labelText=<span>{target.name}<br/>{(subPosition.distanceTo(target.position).toFixed(0)) + "m"}</span>
        if ((-Math.PI / 4 < relAngle) && (relAngle <= Math.PI / 4)) {
            // front
            const x = (SIZE_PX / 2) + (Math.tan(relAngle) * SIZE_PX / 2)
            arrowPoints = [
                new Point(x - MARK_SIZE, MARGIN + MARK_SIZE),
                new Point(x, MARGIN),
                new Point(x + MARK_SIZE, MARGIN + MARK_SIZE),
            ]
            labelAttrs = {
                width: SIZE_PX,
                height: SIZE_PX - 2 * LABEL_MARGIN,
                top: LABEL_MARGIN,
                left: x - SIZE_PX / 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
            }
        } else if ((Math.PI / 4 < relAngle) && (relAngle <= Math.PI * 3 / 4)) {
            // right
            const y = (SIZE_PX / 2) + (Math.tan(relAngle - Math.PI / 2) * SIZE_PX / 2)
            arrowPoints = [
                new Point(SIZE_PX - MARGIN - MARK_SIZE, y - MARK_SIZE),
                new Point(SIZE_PX - MARGIN, y),
                new Point(SIZE_PX - MARGIN - MARK_SIZE, y + MARK_SIZE),
            ]
            labelAttrs = {
                width: SIZE_PX - 2 * LABEL_MARGIN,
                height: SIZE_PX,
                top: y - SIZE_PX / 2,
                left: LABEL_MARGIN,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
            }
        } else if ((-Math.PI * 3 / 4) < relAngle && relAngle <= (-Math.PI / 4)) {
            // left
            const y = (SIZE_PX / 2) - (Math.tan(relAngle + Math.PI / 2) * SIZE_PX / 2)
            arrowPoints = [
                new Point(MARGIN + MARK_SIZE, y - MARK_SIZE),
                new Point(MARGIN, y),
                new Point(MARGIN + MARK_SIZE, y + MARK_SIZE),
            ]
            labelAttrs = {
                width: SIZE_PX - 2 * LABEL_MARGIN,
                height: SIZE_PX,
                top: y - SIZE_PX / 2,
                left: LABEL_MARGIN,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
            }
        } else {
            const x = (SIZE_PX / 2) - (Math.tan(relAngle) * SIZE_PX / 2)
            arrowPoints = [
                new Point(x - MARK_SIZE, SIZE_PX - MARGIN - MARK_SIZE),
                new Point(x, SIZE_PX - MARGIN),
                new Point(x + MARK_SIZE, SIZE_PX - MARGIN - MARK_SIZE),
            ]
            labelAttrs = {
                width: SIZE_PX,
                height: SIZE_PX - 2 * LABEL_MARGIN,
                bottom: LABEL_MARGIN,
                left: x - SIZE_PX / 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
            }
        }
        mark = <DLine className="arrow" closed={true} points={arrowPoints}/>
    }

    return <div className="targetMark">
        {mark}
        <div style={{position: "absolute", ...labelAttrs}} className="label">{labelText}</div>
    </div>
}



var autoinc=0
function _InnerSonar({
    range,
    toggleActions,
    on,
    subVolume,
    position,
    orientation,
    features,
    aimLines,
    blips,
    trackedBlipId,
    debug,
    ranges,
    hitMarks,
    target,
    plants,
}) {
    const scale = SIZE_PX / (range * 2)   // px per unit

    return <div className="sonar">
        <div className="toggles">
            {
                toggleActions.map(a => <ActionButton
                    key={a.id}
                    action={a}
                    />)
            }
        </div>
        <div className="display" style={{width: SIZE_PX + 2, height: SIZE_PX + 2}}>
            {
                on && <DArea>
                    <DSonarView position={position.scale(SCALE_MULTIPLIER)} size={SIZE_PX} scale={scale / SCALE_MULTIPLIER} theta={-orientation - Math.PI / 2}>
                        <SonarBackground position={position} scale={scale}/>
                        <Plants plants={plants} trackedBlipId={trackedBlipId} scale={scale} debug={false}/>
                        <Features features={features}/>
                        <SubMarker position={position} orientation={orientation} subVolume={subVolume}/>
                        <SonarBlips blips={blips} trackedBlipId={trackedBlipId} scale={scale} debug={debug}/>
                        <DReferenceFrame position={position.scale(SCALE_MULTIPLIER)} theta={orientation}>
                            <HitMarks hitMarks={hitMarks}/>
                        </DReferenceFrame>

                        <Ranges position={position} scale={scale} ranges={ranges}/>
                        <AimLines scale={scale} aimLines={aimLines}/>
                    </DSonarView>
                    <Target
                        subPosition={position}
                        subOrientation={orientation}
                        target={target}
                        scale={scale}
                    />
                </DArea>
            }
        </div>
    </div>
}

const InnerSonar = memo(_InnerSonar)
//const InnerSonar = _InnerSonar

function Sonar({subsystem}) {
    return <InnerSonar
    range={subsystem.range}
    toggleActions={subsystem.toggleActions}
    on={subsystem.on}
    position={subsystem.position}
    orientation={subsystem.orientation}
    features={subsystem.features}
    aimLines={subsystem.aimLines}
    blips={subsystem.blips}
    trackedBlipId={subsystem.trackedBlipId}
    debug={subsystem.debug}
    ranges={subsystem.ranges}
    hitMarks={subsystem.hitMarks}
    target={subsystem.target}
    subVolume={subsystem.subVolume}
    plants={subsystem.plants}
    />
}

export default Sonar;
