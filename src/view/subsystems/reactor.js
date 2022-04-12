import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {VertSlider, ActionButton, SegmentProgress} from "../widgets"
import {Stage, Layer, Line, Group, Rect, } from 'react-konva'


const MARGIN = 20

function StatLine({
        values=[],
        scaleX=1,
        scaleY=1,
        timeFrom=0,
        height=100,
        stroke="red",
        fill="rgba(255,0,0,0.5)"
    }) {
    if (values.length === 0) {
        return null
    }
    const points = []
    var x = (values[0].time - timeFrom) * scaleX
    var y = height + MARGIN
    points.push(x, y)
    values.forEach(v => {
        x = (v.time - timeFrom) * scaleX
        y = height - (v.value * scaleY)
        points.push(x, y)
    })
    points.push(x, height + MARGIN)
    return <Line points={points} closed={true} fill={fill} strokeWidth={3} stroke={stroke}/>
}

function VertLines({timeFrom, timeTo, scaleX=1, everyMs=5000, height=100}) {
    const xs = []
    const firstLineT = Math.floor(timeFrom / everyMs) * everyMs
    for (var t = firstLineT; t < timeTo; t += everyMs) {
        xs.push((t - timeFrom) * scaleX)
    }
    return <Group>
    {
        xs.map(x => <Line
            key={x}
            points={[x, 0, x, height]}
            stroke="white"
            strokeWidth={1}
        />)
    }
    </Group>
}

function HorizLines({everyPx=20, width=100, height=100}) {
    const ys = []
    for (var y = height; y > 0; y -= everyPx) {
        ys.push(y)
    }
    return <Group>
    {
        ys.map(y => <Line
            key={y}
            points={[0, y, width, y]}
            stroke="white"
            strokeWidth={1}
        />)
    }
    </Group>
}

function ReactorHistory({subsystem, height}) {
    const MS_MARGIN = 200

    const histPowerProd = subsystem.historyPowerProduction
    const histPowerCon = subsystem.historyPowerConsumption

    const timeFrom = subsystem.historyFrom
    const timeTo = subsystem.historyTo
    const timeLength = timeTo - timeFrom

    const valToY = height / subsystem.maxOutput

    const myRef = useRef(null)
    const [mySize, setMySize] = useState({width: 0, height: 0})
    useEffect(() => {
        if (myRef.current) {
            setMySize({width: myRef.current.offsetWidth, height: myRef.current.offsetHeight})
        }

    }, [myRef, setMySize])

    const msToX = (mySize.width + 2) / (timeLength + MS_MARGIN )

    return <div className='history' ref={myRef}
        style={{height: height}}>
        {subsystem.on &&
            <Stage width={mySize.width - 4} height={height - 2} opacity={0.7}>
                <Layer>
                    <Rect x={0} y={0} width={mySize.width} height={height} fill="black"/>
                    <HorizLines width={mySize.width} height={height} everyPx={50}/>
                    <VertLines timeFrom={timeFrom} timeTo={timeTo} scaleX={msToX} height={height}/>
                    <StatLine
                        values={histPowerProd}
                        height={height}
                        scaleX={msToX}
                        scaleY={valToY}
                        timeFrom={timeFrom + MS_MARGIN}
                        stroke="#a5d000"
                        fill="rgba(0,255,0,0.5)"
                    />
                    <StatLine
                        values={histPowerCon}
                        height={height}
                        scaleX={msToX}
                        scaleY={valToY}
                        timeFrom={timeFrom + MS_MARGIN}
                        stroke="red"
                        fill="rgba(255,0,0,0.5)"
                    />
                    <Rect x={0} y={0} width={mySize.width} height={height} stroke="#a5d000"/>
                </Layer>
            </Stage>
        }
    </div>
}

function ReactorHeat({heatPercent, overheating}) {
    return <SegmentProgress className={"heat " + (overheating ? "overheating ":"")} reverse={true} segments={10} value={heatPercent} vertical={true}/>
}

function ReactorFuel({subsystem}) {
    return <div className="reactorFuel infoRow">
        <div>
            Fuel:
        </div>
        <SegmentProgress
            className={"fuel " + ((subsystem.fuel === 0) ? "empty " : "")}
            segments={10}
            value={Math.floor(100 * subsystem.fuel)}/>
    </div>
}

function ReactorPowerSlider({id, enabled}) {
    return <VertSlider
        id={id + "_control"}
        enabled={enabled}
        icon="fa-solid fa-atom"
    />
}

function _Reactor({subsystem}) {
    const HIST_HEIGHT = 180

    return <div className='reactor'>
        <div className="topRow">
            <div className='controls'>
                <ReactorPowerSlider id={subsystem.id} enabled={subsystem.on}/>
            </div>
            <ReactorHistory subsystem={subsystem} height={HIST_HEIGHT}/>
            <ReactorHeat overheating={subsystem.overheating} heatPercent={subsystem.heatPercent}/>
        </div>
        <ReactorFuel subsystem={subsystem}/>
        <div className="actions">
            <ActionButton action={subsystem.scramAction}/>
            <ActionButton action={subsystem.refuelAction}/>
        </div>
    </div>
}

export const Reactor = memo(_Reactor)
