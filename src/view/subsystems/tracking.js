import React, {memo} from "react";

import "../../css/subsystems/tracking.css"
///////////////////////////////////


function Effect({effect}) {
    return <div className={"effect " + effect.type + " "}>
        <div className="name">
            {effect.name}
        </div>
    </div>
}

function TrackedEntity({id, alive, bloodPercent, effects, planDescription}) {
    return <div className="trackedEntity">
        <div>
            {id} {alive ? "" : " (dead)"}
        </div>
        <div className="bloodBarContainer">

            <div className="bloodBar">
                <div className="bloodBarInner" style={{width: bloodPercent + "%"}}/>
            </div>
        </div>
        {
            (effects.length > 0) && <div className="effects">
            {
                effects.filter(e => e.visible).map(e => <Effect key={e.id} effect={e}/>)
            }
            </div>
        }
        {planDescription && <div>
            {
                planDescription.map(d => <div key={d}>{d}</div>)
            }
        </div>
        }
    </div>
}

function _Tracking({subsystem}) {
    const e = subsystem.tracking
    return <div className='tracking'>

        {subsystem.on && <div>
            { e ? <TrackedEntity
                id={e.id}
                alive={e.alive}
                bloodPercent={e.bloodPercent}
                effects={e.effects}
                planDescription={e.planDescription}
                /> : "Nothing tracked"}
        </div>}
    </div>
}

export const Tracking = memo(_Tracking)
