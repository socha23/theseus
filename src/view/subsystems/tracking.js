import React from "react";

import "../../css/subsystems/tracking.css"
///////////////////////////////////


function Effect({effect}) {
    return <div className="effect ">
        <div className="name">
            {effect.name}
        </div>
    </div>
}

export function Tracking({subsystem}) {
    const e = subsystem.tracking
    return <div className='tracking'>

        {subsystem.on && <div>
            { e ? <div className="trackedEntity">
                <div>
                    {e.id} {e.alive ? "" : " (dead)"}
                </div>
                <div className="bloodBarContainer">

                    <div className="bloodBar">
                        <div className="bloodBarInner" style={{width: e.bloodPercent + "%"}}/>
                    </div>
                </div>
                {
                    (e.effects.length > 0) && <div className="effects">
                    {
                        e.effects.map(e => <Effect key={e.id} effect={e}/>)
                    }
                    </div>
                }
                {e.planDescription && <div>
                    {
                        e.planDescription.map(d => <div key={d}>{d}</div>)
                    }
                </div>
                }
            </div> : "Nothing tracked"}
        </div>}
    </div>
}

