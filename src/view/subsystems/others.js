import React from "react";
import { toDegrees } from '../../units.js'
import { ActionButton} from "../widgets"
import { STATISTICS } from "../../stats.js";

///////////////////////////////////

export function SubStatus({subsystem}) {
    return <div className='subStatus'>
        {subsystem.on && <div>
            {
                Object.values(STATISTICS).map(s =>

                    <div key={s.name} className="infoRow">
                        <span>{s.name}:</span>
                        <span>{s.avgString}</span>
                    </div>
                )
            }
        <hr/>



        <div className="infoRow">
            <span>Pos:</span>
            <span>{subsystem.position.x.toFixed(1)}, {subsystem.position.y.toFixed(1)}</span>
        </div>
        <div className="infoRow">
            <span>Speed:</span>
            <span>{subsystem.speed.toFixed(2)} m/s</span>
        </div>
        <hr/>
        <div className="infoRow">
            <span>Heading:</span>
            <span>{toDegrees(subsystem.orientation).toFixed(2)}'</span>
        </div>
        <div className="infoRow">
            <span>Rot. speed:</span>
            <span>{subsystem.rotationSpeed.toFixed(2)} m/s</span>
        </div>

        </div>}
    </div>
}


///////////////////////////////////

export function Cheatbox({subsystem}) {
    return <div className="cheatbox">
        {
            subsystem.cheats.map(c => <ActionButton key={c.id} action={c}/>)
        }
    </div>
}

///////////////////////////////////

export function Tracking({subsystem}) {
    const tracking = subsystem.tracking
    return <div className='tracking'>

        {subsystem.on && <div className="trackedEntity">
            { tracking ? <div>
                <div className="infoRow">
                    <span className="label">Id:</span>
                    <span>{tracking.entityId}</span>
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

