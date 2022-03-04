import React, { useState } from "react";
import { ACTION_CATEGORY } from "../model/action.js";
import Sonar from "./sonar.js";
import { toDegrees } from '../units.js'
import { CartesianGrid, Area, AreaChart, Line, LineChart, XAxis, YAxis } from "recharts";
import {VertSlider, ActionButton} from "./widgets"
import {Weapon} from "./subsystems/weapons"

///////////////////////////////////

function SubStatus({subsystem}) {
    return <div className='subStatus boxWithScroll'>
        {subsystem.on && <div>
        <div className="infoRow">
            <span>Pos:</span>
            <span>{subsystem.position.x.toFixed(1)}, {subsystem.position.y.toFixed(1)}</span>
        </div>
        <div className="infoRow">
            <span>Speed:</span>
            <span>{subsystem.speed.toFixed(2)} m/s</span>
        </div>
        <hr/>
        <div className="infoRow">
            <span>Heading:</span>
            <span>{toDegrees(subsystem.orientation).toFixed(2)}'</span>
        </div>
        <div className="infoRow">
            <span>Rot. speed:</span>
            <span>{subsystem.rotationSpeed.toFixed(2)} m/s</span>
        </div>

        </div>}
    </div>
}

///////////////////////////////////

function Tracking({subsystem}) {
    const tracking = subsystem.tracking
    return <div className='tracking infoBox'>

        {subsystem.on && <div className="trackedEntity">
            { tracking ? <div>
                <div className="infoRow">
                    <span className="label">Id:</span>
                    <span>{tracking.entityId}</span>
                </div>
                <hr/>
                <div className="infoRow">
                    <span className="label">Pos:</span>
                    <span>{tracking.position.x.toFixed(2)}, {tracking.position.y.toFixed(2)}</span>
                </div>
                <div className="infoRow">
                    <span className="label">Speed:</span>
                    <span>{tracking.speed.toFixed(2)} m/s</span>
                </div>
                <hr/>
                {tracking.planDescription && <div>
                    <span>{tracking.planDescription}</span>
                </div>
                }
            </div> : "Nothing tracked"}
        </div>}
    </div>
}
///////////////////////////////////

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


function Reactor({subsystem, actionController}) {
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

///////////////////////////////////

function Steering({subsystem, actionController}) {
    return <div className="steering">
        <div className="directions">
            <div className="row topRow">
                <div/>
                <ActionButton action={subsystem.forward} actionController={actionController}/>
                <div/>
            </div>
            <div className="row bottomRow">
                <ActionButton action={subsystem.left} actionController={actionController}/>
                <ActionButton action={subsystem.backward} actionController={actionController}/>
                <ActionButton action={subsystem.right} actionController={actionController}/>
            </div>
        </div>
    </div>
}

function ThrottleActions({actions, actionController}) {
    return <div className='throttleActions'>
        {
            actions.map(a => <ActionButton key={a.id} action={a} actionController={actionController}/>)
        }
    </div>
}
///////////////////////////////////

export function Subsystem({subsystem, actionController}) {

    const [power, setPower] = useState(false)
    const [animation, setAnimation] = useState("")

    if (subsystem.shutdown && power) {
        setPower(false)
        setAnimation("shutdown")
        setTimeout(() => {
            setAnimation("")
        }, 500)
    }

    if (subsystem.on && !power) {
        setPower(true)
        setAnimation("poweringUp")
        setTimeout(() => {
            setAnimation("")
        }, 500)
    }

    if (!subsystem.on && !subsystem.shutdown && power) {
        setPower(false)
        setAnimation("poweringDown")
        setTimeout(() => {
            setAnimation("")
        }, 500)
    }

    const standardActions = subsystem.actions.filter(a => a.category == ACTION_CATEGORY.STANDARD)
    const throttleActions = subsystem.actions.filter(a => a.category == ACTION_CATEGORY.THROTTLE)


    return <div draggable className={'subsystem '
                + (subsystem.on ? 'powered ' : 'unpowered ')
                + (animation + " ")
                }>
        <div className="titleBar">
            <span className='name'>{subsystem.name}</span>

            <div className='powerButton'>
                <ActionButton action={subsystem.actionOn} actionController={actionController}/>
            </div>
        </div>
        <div className='body'
            onMouseDown={e => {e.preventDefault(); return false}} /* disable drag & drop */
        >
            <div className='contents'>
            {
                subsystem.isWeapon && <Weapon subsystem={subsystem}/>
            }
            {
                subsystem.showsSubStatus && <SubStatus subsystem={subsystem}/>
            }
            {
                subsystem.showsTracking && <Tracking subsystem={subsystem}/>
            }
            {
                subsystem.showsSonar && <Sonar subsystem={subsystem} actionController={actionController}/>
            }
            {
                subsystem.isReactor && <Reactor subsystem={subsystem} actionController={actionController}/>
            }
            {
                subsystem.isSteering && <Steering subsystem={subsystem} actionController={actionController}/>
            }
            </div>
            <div className='standardActions'>
                {
                    standardActions
                        .filter(a => a.visible)
                        .map(a => <ActionButton key={a.id} action={a} actionController={actionController}/>)
                }
            </div>
            {
                (throttleActions.length > 0) && <ThrottleActions actions={throttleActions} actionController={actionController}/>
            }
        </div>
    </div>
}





