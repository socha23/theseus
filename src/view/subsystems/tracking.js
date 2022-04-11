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

function TrackedEntity({entity}) {
    return <div className="trackedEntity">
        <div>
            {entity.id} {entity.alive ? "" : " (dead)"}
        </div>
        <div>
            Speed: {entity.speed.toFixed(1)}
        </div>
        <div className="bloodBarContainer">

            <div className="bloodBar">
                <div className="bloodBarInner" style={{width: entity.bloodPercent + "%"}}/>
            </div>
        </div>
        {
            (entity.effects.length > 0) && <div className="effects">
            {
                entity.effects.filter(e => e.visible).map(e => <Effect key={e.id} effect={e}/>)
            }
            </div>
        }
        {entity.planDescription && <div>
            {
                entity.planDescription.map(d => <div key={d}>{d}</div>)
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
                entity={e}
                /> : "Nothing tracked"}
        </div>}
    </div>
}

export const Tracking = memo(_Tracking)
