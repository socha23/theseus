import React, { memo, useContext, useCallback } from "react";
import ReactSlider from "react-slider";
import { WithTooltip } from "./tooltip";
import { MarkRequiredMaterialsOnHover, Materials } from "./materials";
import { ActionControllerCtx } from "../actionController";
import { jsonCompare, transpose } from "../utils";


function _VertSliderInner({
        id,
        enabled=true,
        value,
        icon="fa-solid fa-atom"
    }) {

        const ac = useContext(ActionControllerCtx)
        const onChange = useCallback((v, i) => ac.setValue(id, 1-(v / 100)))

    return <div className="vertSliderContainer">
        <ReactSlider
            className={"vertSlider " + (enabled ? "enabled " : "disabled ")}
            renderThumb={(props) => <div {...props}>
                <i className={"icon " + icon}/>
            </div>}
            thumbClassName="sliderThumb"
            trackClassName="sliderTrack"
            min={0}
            max={100}
            disabled={!enabled}
            orientation="vertical"
            onChange={onChange}
            value={value}
        />
    </div>
}
const VertSliderInner = memo(_VertSliderInner)

export function VertSlider({id, enabled, icon}) {
    const ac = useContext(ActionControllerCtx)
    const value = 100 - (100 * ac.getValue(id, 0))
    return <VertSliderInner id={id} enabled={enabled} value={value} icon={icon}/>
}


export function _SegmentProgress({
    from = 0,
    to = 100,
    value = 0,
    segments = 10,
    vertical=false,
    reverse=false,
    className=""}) {
    const segmentElems = []

    var filledI = transpose(value, from, to, 0, segments)
    if (reverse) {
        filledI = segments - filledI - 1
    }
    for (var i = 0; i < segments; i++) {
        const filled = reverse
        ? (filledI < i)
        : (i < filledI)

        segmentElems.push({
            key: "seg" + i,
            className: "segment " + (filled ? "filled " : "unfilled ") + "seg" + i
        })
    }
    return <div className={`segmentProgress ${className} ${vertical ? "vertical" : "horizontal"}`}>
        {
            segmentElems.map(s => <div {...s}/>)
        }
    </div>
}

//export const SegmentProgress = memo(_SegmentProgress)
export const SegmentProgress = _SegmentProgress


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

//export const ActionButton = memo(_ActionButton, jsonCompare)
export const ActionButton = _ActionButton
