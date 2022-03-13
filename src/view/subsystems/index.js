import React, { useState, useContext } from "react";
import Sonar from "./sonar.js";
import { ActionButton} from "../widgets"
import { Weapon } from "./weapons"
import { SubStatus, Tracking, Reactor, Steering, Cheatbox } from "./others";
import { TooltipContext } from "../tooltip";
import { Pumps } from "./pumps";
import { Storage } from "./storage";

import '../../css/subsystemBox.css';
import '../../css/subsystemStatus.css';


///////////////////////////////////


const TABS = {
    MAIN: "tabMain",
    STATUS: "tabStatus",
}


function SubsystemMainTab({subsystem, actionController}) {
    return <div className="tab" onDragStart={e => false}>
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
            {
                subsystem.isPumps && <Pumps subsystem={subsystem} actionController={actionController}/>
            }
            {
                subsystem.isStorage && <Storage subsystem={subsystem} actionController={actionController}/>
            }
        </div>
    </div>
}

function StatusEffect({subsystem, effect, actionController}) {
    const tooltipCtx = useContext(TooltipContext)
    const tooltip = <div>{effect.description}</div>

    return <div
    className={"effect "
    + effect.category + " "
    + "damage" + effect.damageCategory + " "
    }>
        <div className="body">
            <div className="name"
                onMouseOver ={e => {tooltipCtx.tooltip = tooltip}}
                onMouseOut ={e => {tooltipCtx.tooltip = null}}
            >
                {
                    (effect.leak > 0) && <i className="icon fa-solid fa-droplet"/>
                }
                {effect.name}
            </div>
        </div>
        <div className="actions">
            { effect.actions.map(a =>
                <ActionButton className="slim" action={a} actionController={actionController} key={a.id}/>
            )}
        </div>
    </div>
}

function StatusTab({subsystem, actionController, toggleActiveTab}) {
    const effects = subsystem.statusEffects

    return <div className="tab statusTab" onDragStart={e => false}>
            {(effects.length > 0 ?
                <div className="statusEffects">
                    {
                        effects.map(e => <StatusEffect key={e.id} effect={e} subsystem={subsystem} actionController={actionController}/>)
                    }
                </div> : <div className="noStatusEffects">
                    <div>No active effects</div>
                    <div><a onClick={() => {toggleActiveTab()}}>Back to main view</a></div>


                </div>
            )}
        </div>
}

function StatusTabMark({effect}) {
    const tooltipCtx = useContext(TooltipContext)
    return <div
        className={"tabMark "
            + "damage" + effect.damageCategory + " "
        }
        onMouseOver ={_ => {tooltipCtx.tooltip =
            <div className="tabMarkTooltip">
                <div className={"effect damage" + effect.damageCategory}>
                    {effect.name}
                </div>
                <div>{effect.description}</div>
            </div>}
        }
        onMouseOut ={_ => {tooltipCtx.tooltip = null}}
    >
    {
        (effect.leak > 0) && <i className="leak fa-solid fa-droplet"/>
    }
    </div>
}

function StatusTabMarks({effects}) {

    return <div className="statusTabMarks">
        {
            effects.map(e => <StatusTabMark
                effect={e}
                key={e.id}
                />
            )
        }
    </div>
}

function StatusTabIcon({subsystem, active, onClick}) {
    return <div className={"statusTabIconContainer"}>
           <span className={"statusTabIcon "
                + (active ? "active " : "inactive ")
                + ((subsystem.statusEffects.length > 0) ? "hasEffects " : "noEffects ")
                }
                onClick={onClick}
                >
                <span className="icon" >
                    <i className="fa-solid fa-screwdriver-wrench" />
                </span>
                <StatusTabMarks effects={subsystem.statusEffects} />
            </span>
    </div>

}


export function Subsystem({subsystem, actionController}) {

    var [activeTab, setActiveTab] = useState(TABS.MAIN)


    function toggleActiveTab() {
        if (activeTab === TABS.MAIN) {
            setActiveTab(TABS.STATUS)
        } else {
            setActiveTab(TABS.MAIN)
        }
    }

    let effectsClassName = ""
    subsystem.effects.forEach(e => {effectsClassName += (e.type + " ")})

    return <div draggable
            className={'subsystem '
                + activeTab + " "
                + (subsystem.on ? 'powered ' : 'unpowered ')
                + effectsClassName
                }
            onMouseOver={()=>{actionController.onMouseOverSubsystem(subsystem)}}
            onMouseOut={()=>{actionController.onMouseOutSubsystem(subsystem)}}
            >
        <div className="titleBar">
            <span className={'name '}
            ><span className="label">
                    {subsystem.name}
            </span></span>
            <StatusTabIcon subsystem={subsystem} active={activeTab === TABS.STATUS} onClick={e=> {toggleActiveTab()}}/>
            <div className='powerButton'>
                <ActionButton action={subsystem.actionOn} actionController={actionController}/>
            </div>
        </div>
        {
            (activeTab === TABS.MAIN) && <SubsystemMainTab subsystem={subsystem} actionController={actionController}/>
        }
        {
            (activeTab === TABS.STATUS) && <StatusTab subsystem={subsystem} actionController={actionController} toggleActiveTab={toggleActiveTab}/>
        }


    </div>
}
