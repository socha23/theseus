import React, {memo} from "react";
import { toDegrees } from '../../units.js'
import { ActionButton} from "../widgets"
import { STATISTICS } from "../../stats.js";
import { jsonCompare } from "../../utils.js";

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
function _Cheatbox({cheats}) {
    return <div className="cheatbox">
        {
            cheats.map(c => <ActionButton key={c.id} action={c}/>)
        }
    </div>
}
//export const Cheatbox = memo(_Cheatbox, (a, b) => a.cheats.length != b.cheats.length)
export const Cheatbox = _Cheatbox
