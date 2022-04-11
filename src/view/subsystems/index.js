import React, { useContext, useState, memo, useMemo, useCallback } from "react";
import Sonar from "./sonar.js";
import { ActionButton} from "../widgets"
import { Weapon } from "./weapons"
import { SubStatus, Cheatbox } from "./others";
import { Tracking } from "./tracking";
import { WithTooltip } from "../tooltip";
import { Engine } from "./engine";
import { Reactor } from "./reactor";
import { Pumps } from "./pumps";
import { Storage } from "./storage";
import { Minimap } from "./minimap";
import { SubsystemPowerButton } from "./power.js";

import '../../css/subsystemBox.css';
import '../../css/subsystemStatus.css';
import { ActionControllerCtx } from "../../actionController.js";


///////////////////////////////////


const TABS = {
    MAIN: "tabMain",
    STATUS: "tabStatus",
}


function SubsystemMainTab({subsystem}) {
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
                subsystem.isTracking && <Tracking subsystem={subsystem}/>
            }
            {
                subsystem.isSonar && <Sonar subsystem={subsystem}/>
            }
            {
                subsystem.isCheatbox && <Cheatbox cheats={subsystem.cheats}/>
            }
            {
                subsystem.isReactor && <Reactor subsystem={subsystem}/>
            }
            {
                subsystem.isPumps && <Pumps subsystem={subsystem}/>
            }
            {
                subsystem.isStorage && <Storage inventoryCounts={subsystem.inventoryCounts}/>
            }
            {
                subsystem.isEngine && <Engine subsystem={subsystem}/>
            }
            {
                subsystem.isMinimap && <Minimap
                    minX={subsystem.minX}
                    maxX={subsystem.maxX}
                    minY={subsystem.minY}
                    maxY={subsystem.maxY}
                    on={subsystem.on}
                    target={subsystem.target}
                    position={subsystem.position}
                    features={subsystem.features}
                />
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
        <WithTooltip tooltip={<div>{effect.description}</div>}>
            <div className="body">
                    <i className={"icon " + effect.icon}/>
                    <span className="name">{effect.name}</span>
            </div>
        </WithTooltip>
        <div className="actions">
            { effect.actions.map(a =>
                <ActionButton className="slim" action={a} key={a.id}/>
            )}
        </div>
    </div>
}

function StatusTab({subsystem, goToMain}) {
    const effects = subsystem.statusEffects

    const [lastEffectCount, setLastEffectCount] = useState(effects.length)
    if (lastEffectCount > 0 && effects.length === 0) {
        setLastEffectCount(0)
        setTimeout(() => {goToMain()})
    } else if (effects.length !== lastEffectCount) {
        setLastEffectCount(effects.length)
    }

    return <div className="tab statusTab" onDragStart={e => false}>
            {(effects.length > 0 ?
                <div className="statusEffects">
                    {
                        effects.map(e => <StatusEffect key={e.id} effect={e}/>)
                    }
                </div> : <div className="noStatusEffects">
                    <div>No active effects</div>
                </div>
            )}
            <span className="backToMain" onClick={goToMain}>Back to main view</span>
        </div>
}

function _StatusTabMark({effect, onClick}) {
    const tooltip = <div className="tabMarkTooltip">
        <div className={"effect damage" + effect.grade}>
            {effect.name}
        </div>
        <div>{effect.description}</div>
    </div>
    return <WithTooltip tooltip={tooltip}>
            <div onClick={onClick} className={"tabMark damage" + effect.grade}>
                <i className={"icon " + effect.icon}/>
            </div>
        </WithTooltip>
}

const StatusTabMark = memo(_StatusTabMark)

function StatusTabMarks({effects, onClick}) {
    return <div className="statusTabMarks">
        {
            effects.map(e => <StatusTabMark
                effect={e}
                onClick={onClick}
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
            </span>
    </div>

}


function _Subsystem({subsystem}) {
    const actionController = useContext(ActionControllerCtx)
    const [activeTab, setActiveTab] = useState(TABS.MAIN)

    const goToStatus = useCallback(() => {setActiveTab(TABS.STATUS)})
    const goToMain = useCallback(() => {setActiveTab(TABS.MAIN)})

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
            <StatusTabMarks effects={subsystem.statusEffects} onClick={goToStatus}/>
            {
                /*
                    <StatusTabIcon subsystem={subsystem} active={activeTab === TABS.STATUS} onClick={toggleActiveTab}/>
                */
            }
            <SubsystemPowerButton subsystem={subsystem}/>
        </div>
        {
            (activeTab === TABS.MAIN) && <SubsystemMainTab subsystem={subsystem} />
        }
        {
            (activeTab === TABS.STATUS) && <StatusTab subsystem={subsystem} goToMain={goToMain}/>
        }


    </div>
}

export const Subsystem = memo(_Subsystem)
