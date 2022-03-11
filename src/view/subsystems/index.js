import React from "react";
import { ACTION_CATEGORY } from "../../model/action.js";
import Sonar from "./sonar.js";
import { ActionButton} from "../widgets"
import { Weapon } from "./weapons"
import { SubStatus, Tracking, Reactor, Steering } from "./others";


///////////////////////////////////


function SubsystemMainTab({subsystem, actionController}) {
    const standardActions = subsystem.actions.filter(a => a.category === ACTION_CATEGORY.STANDARD)
    const throttleActions = subsystem.actions.filter(a => a.category === ACTION_CATEGORY.THROTTLE)
    return <div className="tab">
        <div className='body'
            onMouseDown={e => {e.preventDefault(); return false}} /* disable drag & drop */
        >
            {
                subsystem.isWeapon && <Weapon subsystem={subsystem} actionController={actionController}/>
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
}

export function Subsystem({subsystem, actionController}) {


    let effectsClassName = ""
    subsystem.effects.forEach(e => {effectsClassName += (e.type + " ")})

    return <div draggable
            className={'subsystem '
                + (subsystem.on ? 'powered ' : 'unpowered ')
                + effectsClassName
                }
            onMouseOver={()=>{actionController.onMouseOver(subsystem)}}
            onMouseOut={()=>{actionController.onMouseOut(subsystem)}}
            >
        <div className="titleBar">
            <span className='name'>{subsystem.name}</span>

            <div className='powerButton'>
                <ActionButton action={subsystem.actionOn} actionController={actionController}/>
            </div>
        </div>

        <SubsystemMainTab subsystem={subsystem} actionController={actionController}/>

    </div>
}

function ThrottleActions({actions, actionController}) {
    return <div className='throttleActions'>
        {
            actions.map(a => <ActionButton key={a.id} action={a} actionController={actionController}/>)
        }
    </div>
}
