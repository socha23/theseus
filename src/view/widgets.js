import React, { useContext, useEffect, useState } from "react";
import ReactSlider from "react-slider";
import { TooltipContext } from "./tooltip";



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



export function ActionButton({action, actionController}) {
    const [recentlyCompleted, setRecentlyCompleted] = useState(false)

    useEffect(()=> {
        if (action.recentlyCompleted && !recentlyCompleted) {
            setRecentlyCompleted(true)
            const timeout = setTimeout(() => {
                setRecentlyCompleted(false)
            }, 500)
            return () => {clearTimeout(timeout)}
        }
    })


    function getProgressWidth(action) {
        return action.progress * 100 / action.progressMax
    }

    const tooltipCtx = useContext(TooltipContext)

    var tooltip = null
    if (action.showTooltip) {
        tooltip = <div>
            <div className="topRow">
                <div className="longName">{action.longName}</div>
                {(action.progressMax > 0) &&
                    <div className="progressNeeded">
                        <i className="icon fa-solid fa-clock"/>
                        {(action.progressMax / 1000).toFixed(0)}s
                    </div>
                }
            </div>
            <div className="errorConditions">
            {
                action.errorConditions.map(c => <div className="condition" key={c}>{c}</div>)
            }
            </div>
        </div>
    }

    return <div
        className={'button '
            + (action.enabled ? "enabled " : 'disabled ')
            + (action.selected ? "selected " : "deselected ")
            + (action.active ? "active " : " ")
        }
        onClick={e => actionController.onClick(action)}
        onMouseDown={e => actionController.onMouseDown(action)}

        onMouseOver ={e => {tooltipCtx.tooltip = tooltip}}
        onMouseOut ={e => {tooltipCtx.tooltip = null}}
    >
        <div className='container'>
            <i className={'icon ' + action.iconClass}/>
            <div className={'nameAndProgress'}>
                <div className={'name'}>
                    {action.name}
                </div>
                {
                    (action.progressMax > 0) && <div className='progressContainer'>
                        <div className='progress' style={{width: getProgressWidth(action) + "%"}}/>
                    </div>
                }
            </div>
        </div>
    </div>
}

