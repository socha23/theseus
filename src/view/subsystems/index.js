import React, { useState } from "react";
import { ACTION_CATEGORY } from "../../model/action.js";
import Sonar from "./sonar.js";
import { ActionButton} from "../widgets"
import { Weapon } from "./weapons"
import { SubStatus, Tracking, Reactor, Steering, Cheatbox } from "./others";

import '../../css/subsystemBox.css';
import '../../css/subsystemStatus.css';


///////////////////////////////////


const TABS = {
    MAIN: "tabMain",
    STATUS: "tabStatus",
}


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
                subsystem.isCheatbox && <Cheatbox subsystem={subsystem} actionController={actionController}/>
            }
            {
                subsystem.isReactor && <Reactor subsystem={subsystem} actionController={actionController}/>
            }
            {
                subsystem.isSteering && <Steering subsystem={subsystem} actionController={actionController}/>
            }
        </div>
        {
            (throttleActions.length > 0) && <ThrottleActions actions={throttleActions} actionController={actionController}/>
        }
    </div>
}

function StatusEffect({subsystem, effect}) {
    return <div className="effect">
        <div className="name">
            {effect.name}
        </div>
    </div>
}

function StatusTab({subsystem}) {
    const effects = subsystem.statusEffects

    return <div className="tab">
            {(effects.length > 0 ?
                <div className="statusEffects">
                    {
                        effects.map(e => <StatusEffect key={e.id} effect={e} subsystem={subsystem}/>)
                    }
                </div> : <div>
                    No active effects
                </div>
            )}
        </div>
}

function StatusTabIcon({subsystem, active, onClick}) {
    return <span className={"statusTabIcon "
        + (active ? "active " : "inactive ")
        + ((subsystem.statusEffects.length > 0) ? "hasEffects " : "noEffects ")
        }>
        <span className="icon" onClick={onClick}>
            <i className="fa-solid fa-screwdriver-wrench" />
        </span>
        {(subsystem.statusEffects.length > 0) &&
            <span className="effectCount">
                {subsystem.statusEffects.length}
            </span>
        }
    </span>
}

export function Subsystem({subsystem, actionController}) {

    var [activeTab, setActiveTab] = useState(TABS.MAIN)

    let effectsClassName = ""
    subsystem.effects.forEach(e => {effectsClassName += (e.type + " ")})

    return <div draggable
            className={'subsystem '
                + activeTab + " "
                + (subsystem.on ? 'powered ' : 'unpowered ')
                + effectsClassName
                }
            onMouseOver={()=>{actionController.onMouseOver(subsystem)}}
            onMouseOut={()=>{actionController.onMouseOut(subsystem)}}
            >
        <div className="titleBar">
            <span className={'name ' + (activeTab === TABS.MAIN ? "active " : "inactive ") }
                onClick={e => {setActiveTab(TABS.MAIN)}}
            ><span className="label">
                    {subsystem.name}
            </span></span>
            <StatusTabIcon subsystem={subsystem} active={activeTab === TABS.STATUS} onClick={e=> {setActiveTab(TABS.STATUS)}}/>
            <div className='powerButton'>
                <ActionButton action={subsystem.actionOn} actionController={actionController}/>
            </div>
        </div>
        {
            (activeTab === TABS.MAIN) && <SubsystemMainTab subsystem={subsystem} actionController={actionController}/>
        }
        {
            (activeTab === TABS.STATUS) && <StatusTab subsystem={subsystem} actionController={actionController}/>
        }


    </div>
}

function ThrottleActions({actions, actionController}) {
    return <div className='throttleActions'>
        {
            actions.map(a => <ActionButton key={a.id} action={a} actionController={actionController}/>)
        }
    </div>
}
