import React from "react";
import { CartesianGrid, Area, AreaChart, XAxis, YAxis } from "recharts";
import {VertSlider, ActionButton} from "../widgets"
import { STATISTICS } from "../../stats.js";

function ReactorHistory({subsystem, height}) {
    const WIDTH = 184

    const history = subsystem.history
    const histGridTimePoints = []

    const time = subsystem.historyTo - subsystem.historyFrom



    const MS_PER_STEP = 5000
    const PX_PER_STEP = WIDTH * MS_PER_STEP / time

    const phase = 1 - (subsystem.historyFrom % MS_PER_STEP) / MS_PER_STEP
    for (var x = phase * PX_PER_STEP; x <= WIDTH; x += PX_PER_STEP) {
        histGridTimePoints.push(x)
    }
    return <div className='history' style={{width: WIDTH, height: height}}>
        {subsystem.on &&
            <div className="chart">
                <AreaChart margin={{top: 0, left: 0, right: 0, bottom: 0}} width={WIDTH} height={height} data={history}>
                    <CartesianGrid verticalPoints={histGridTimePoints} stroke="#469528"/>
                    <YAxis hide={true} type="number" domain={[0, subsystem.maxOutput]}/>
                    <XAxis hide={true} type="number" domain={[subsystem.historyFrom + 200, subsystem.historyTo - 200]} dataKey="timeMs"/>
                    <Area dataKey="output" stroke="#a5d000" strokeWidth={3} fill="green"/>
                    <Area dataKey="consumption" stroke="red" strokeWidth={3} fill="#6f0000"/>
                </AreaChart>
            </div>}
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
