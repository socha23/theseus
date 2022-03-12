import { SubsystemPowerInfo } from "./power";

import "../../css/subsystems/pumps.css"

export function Pumps({subsystem, actionController}) {
    return <div className={"pumps " +  (subsystem.pumping ? "active " : "inactive ") }>
        <div className="mainPane">
            <div className="topRow">
                <i className={"pumpIcon fa-solid fa-water "}/>
                <div className="powerBox">
                    {(subsystem.pumpPower * 100)} q/s
                </div>
                <SubsystemPowerInfo subsystem={subsystem}/>
            </div>
        </div>
        {(subsystem.waterLevel > 0) && <div className="infoBox">
                <div>
                    Water: {(subsystem.waterLevel * 100).toFixed(0)} q ({(subsystem.waterFlow * 100).toFixed(0)} q/s)
                </div>
            </div>}
    </div>
}

