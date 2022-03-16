import React, { useState } from "react";
import Sonar from "./sonar.js";
import { ActionButton} from "../widgets"
import { Weapon } from "./weapons"
import { SubStatus, Tracking, Cheatbox } from "./others";
import { WithTooltip } from "../tooltip";
import { Engine } from "./engine";
import { Reactor } from "./reactor";
import { Pumps } from "./pumps";
import { Storage } from "./storage";
import { SubsystemPowerButton } from "./power.js";

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
                subsystem.isCheatbox && <Cheatbox subsystem={subsystem}/>
            }
            {
                subsystem.isReactor && <Reactor subsystem={subsystem} actionController={actionController}/>
            }
            {
                subsystem.isPumps && <Pumps subsystem={subsystem}/>
            }
            {
                subsystem.isStorage && <Storage subsystem={subsystem}/>
            }
            {
                subsystem.isEngine && <Engine subsystem={subsystem}/>
            }
        </div>
    </div>
}

function StatusEffect({effect}) {
    return <div
        className={"effect "
            + effect.category + " "
            + "damage" + effect.damageCategory + " "
    }>
        <div className="body">
            <div className="name">
                <WithTooltip tooltip={<div>{effect.description}</div>}>
                {
                    (effect.leak > 0) && <i className="icon fa-solid fa-droplet"/>
                }
                {effect.name}
                </WithTooltip>
            </div>
        </div>
        <div className="actions">
            { effect.actions.map(a =>
                <ActionButton className="slim" action={a} key={a.id}/>
            )}
        </div>
    </div>
}

const SWITCH_TO_MAIN_AFTER = 5000

function StatusTab({subsystem, setActiveTab}) {
    const effects = subsystem.statusEffects

    const [activatedAt, setActivatedAt] = useState(Date.now())
    const [noEffectsAt, setNoEffectsAt] = useState(null)
    var backToMainIn = 0

    if (effects.length === 0) {
        if (noEffectsAt === null && activatedAt != null) {
            setNoEffectsAt(Date.now())
        } else {
            if (activatedAt && noEffectsAt) {
                backToMainIn = SWITCH_TO_MAIN_AFTER - (Date.now() - Math.max(activatedAt, noEffectsAt))
                if (backToMainIn <= 0) {
                    setActivatedAt(null)
                    setNoEffectsAt(null)
                    setTimeout(() => {setActiveTab(TABS.MAIN)})
                }
            }
        }
    } else if (noEffectsAt != null) {
        setNoEffectsAt(null)
    }

    return <div className="tab statusTab" onDragStart={e => false}>
            {(effects.length > 0 ?
                <div className="statusEffects">
                    {
                        effects.map(e => <StatusEffect key={e.id} effect={e}/>)
                    }
                </div> : <div className="noStatusEffects">
                    <div>No active effects</div>
                    <div><a onClick={() => {setActiveTab(TABS.MAIN)}}>Back to main view in {Math.floor(backToMainIn / 1000) + 1}s</a></div>


                </div>
            )}
        </div>
}

function StatusTabMark({effect}) {
    const tooltip = <div className="tabMarkTooltip">
        <div className={"effect damage" + effect.damageCategory}>
            {effect.name}
        </div>
        <div>{effect.description}</div>
    </div>
    return <div className={"tabMark damage" + effect.damageCategory}>
        <WithTooltip tooltip={tooltip}>
        {
            (effect.leak > 0) && <i className="leak fa-solid fa-droplet"/>
        }
        </WithTooltip>
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
            <SubsystemPowerButton subsystem={subsystem} actionController={actionController}/>
        </div>
        {
            (activeTab === TABS.MAIN) && <SubsystemMainTab subsystem={subsystem} actionController={actionController}/>
        }
        {
            (activeTab === TABS.STATUS) && <StatusTab subsystem={subsystem} setActiveTab={setActiveTab}/>
        }


    </div>
}
