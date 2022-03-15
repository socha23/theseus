import React from "react";
import {VertSlider, ActionButton} from "../widgets"
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
    const WIDTH = 184
    const MS_MARGIN = 200

    const histPowerProd = subsystem.historyPowerProduction
    const histPowerCon = subsystem.historyPowerConsumption

    const timeFrom = subsystem.historyFrom
    const timeTo = subsystem.historyTo
    const timeLength = timeTo - timeFrom

    const msToX = (WIDTH + 2) / (timeLength + MS_MARGIN )
    const valToY = height / subsystem.maxOutput

    return <div className='history' style={{width: WIDTH + 2, height: height + 2}}>
        {subsystem.on &&
            <Stage width={WIDTH} height={height} opacity={0.7}>
                <Layer>
                    <Rect x={0} y={0} width={WIDTH} height={height} fill="black"/>
                    <HorizLines width={WIDTH} height={height} everyPx={50}/>
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


                </Layer>
            </Stage>
        }
    </div>
}


export function Reactor({subsystem, actionController}) {
    const HEIGHT = 200

    return <div className='reactor'>
        <div className='controls'>
            <VertSlider id={subsystem.id + "_control"} actionController={actionController} enabled={subsystem.on} height={HEIGHT}>
                <i className="fa-solid fa-atom"></i>
            </VertSlider>
        </div>
        <div>
            <ReactorHistory subsystem={subsystem} height={HEIGHT}/>
            <div className='fuel'>
            </div>
        </div>
</div>
}
