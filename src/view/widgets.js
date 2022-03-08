import React, { useEffect, useState } from "react";
import ReactSlider from "react-slider";



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

    return <div
        className={'button '
            + (recentlyCompleted ? "recentlyCompleted " : ' ')
            + (recentlyCompleted ? "recentlyCompleted " : ' ')
            + (action.enabled ? "enabled " : 'disabled ')
            + (action.selected ? "selected " : "deselected ")
            + (action.active ? "active " : " ")
            + action.state + " "
        }
        onClick={e => actionController.onClick(action)}
        onMouseDown={e => actionController.onMouseDown(action)}
    >
        <div className='container'>
            <i className={'icon ' + action.iconClass}/>
            <span className={'name'}>
                {action.name}
            </span>
            <div className='rightSide'/>
        </div>
        {
            (action.progressMax > 0) && <div className='progressContainer'>
                <div className='progress' style={{width: getProgressWidth(action) + "%"}}/>
            </div>
        }
        {
            action.showTooltip && <div className="tooltip">
                <div className="longName">{action.longName}</div>
                <div className="errorConditions">
                    {
                        action.errorConditions.map(c => <div className="condition" key={c}>{c}</div>)
                    }
                </div>
            </div>
        }
    </div>
}


///////////////////
// TOOLTIPS
///////////////////

