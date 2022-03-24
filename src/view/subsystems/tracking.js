import React from "react";

///////////////////////////////////


export function Tracking({subsystem}) {
    const tracking = subsystem.tracking
    return <div className='tracking'>

        {subsystem.on && <div className="trackedEntity">
            { tracking ? <div>
                <div className="infoRow">
                    <span className="label">Id:</span>
                    <span>{tracking.id}</span>
                </div>
                <div className="infoRow">
                    {tracking.alive ? <span>Alive</span> : <span>Dead</span>}
                </div>
                <hr/>
                <div className="infoRow">
                    <span className="label">Pos:</span>
                    <span>{tracking.position.x.toFixed(2)}, {tracking.position.y.toFixed(2)}</span>
                </div>
                <div className="infoRow">
                    <span className="label">Speed:</span>
                    <span>{tracking.speed.toFixed(2)} m/s</span>
                </div>
                <hr/>
                {tracking.planDescription && <div>
                    <span>{tracking.planDescription}</span>
                </div>
                }
            </div> : "Nothing tracked"}
        </div>}
    </div>
}

