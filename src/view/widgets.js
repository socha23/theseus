import React, { memo, useContext, useEffect, useState } from "react";
import ReactSlider from "react-slider";
import { WithTooltip } from "./tooltip";
import { MarkRequiredMaterialsOnHover, Materials, RequiredInventory } from "./materials";
import { ActionControllerCtx } from "../actionController";
import { jsonCompare } from "../utils";


export function VertSlider({id, actionController, children, enabled=true}) {
    return <div className="vertSliderContainer">
    <ReactSlider
    className={"vertSlider " + (enabled ? "enabled " : "disabled ")}
    thumbClassName="sliderThumb"
    trackClassName="sliderTrack"
    min={0}
    max={100}
    disabled={!enabled}
    orientation="vertical"
    onChange={(v, i) => actionController.setValue(id, 1-(v / 100))}
    value={100 - (100 * actionController.getValue(id, 0))}
    />
    <div>{children}</div>
    </div>
}


function ActionTooltip({action, additionalContent=null}) {
    return <div>
    <div className="topRow">
        <div className="longName">{action.longName}</div>
        {(action.progressMax > 0) &&
            <div className="progressNeeded">
                <i className="icon fa-solid fa-clock"/>
                {(action.progressMax / 1000).toFixed(0)}s
            </div>
        }
    </div>
    {
        (Object.keys(action.requiredMaterials).length > 0) &&
        <Materials materials={action.requiredMaterials} filterOnes={false}/>
    }
    <div className="errorConditions">
    {
        action.errorConditions.map(c => <div className="condition" key={c}>{c}</div>)
    }
    </div>
    {
        (additionalContent) && <div className="additionalContent">{additionalContent()}</div>
    }
</div>
}

function _ActionButton({action, className="default", additionalTooltip=null}) {
    const actionController = useContext(ActionControllerCtx)

    var tooltip = null
    if (action.showTooltip) {
        tooltip = <ActionTooltip action={action} additionalContent={additionalTooltip}/>
    }

    return <div
        className={'button '
            + (action.enabled ? "enabled " : 'disabled ')
            + (action.selected ? "selected " : "deselected ")
            + (action.active ? "active " : " ")
            + className
        }
        onClick={e => actionController.onClick(action)}
        >
            <WithTooltip tooltip={tooltip}>
                <MarkRequiredMaterialsOnHover materials={action.requiredMaterials}>
                    <div className='container'>
                        <i className={'icon ' + action.iconClass}/>
                        <div className={'nameAndProgress'}>
                            <div className={'name'}>
                                {action.name}
                            </div>
                            {
                                (action.progressMax > 0) && <div className='progressContainer'>
                                    <div className='progress' style={{
                                        width: action.progressPercent + "%"
                                    }}/>
                                </div>
                            }
                            <Materials materials={action.requiredMaterials}/>
                        </div>
                    </div>
                </MarkRequiredMaterialsOnHover>
            </WithTooltip>
        </div>

}

export const ActionButton = memo(_ActionButton, jsonCompare)
