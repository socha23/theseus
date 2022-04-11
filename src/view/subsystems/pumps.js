import { memo } from "react";
import "../../css/subsystems/pumps.css"
import { WithTooltip } from "../tooltip";


function PumpPowerBoxTooltip({subsystem}) {
    return <div className="pumpPowerTooltip">
        <div>
            Pumping power: {subsystem.pumpPower * 100} q/s
        </div>
        {
        (subsystem.pumpPowerMultiplier < 1) && <div className="reducedPumpPower">
            Reduced pump power
            </div>
        }
    </div>
}


function _Pumps({subsystem}) {
    return <div className={"pumps " +  (subsystem.pumping ? "active " : "inactive ") }>
        <div className="mainPane">
            <div className="topRow">
                <i className={"pumpIcon fa-solid fa-water "}/>
                <div className="powerBox">
                    <WithTooltip tooltip={<PumpPowerBoxTooltip subsystem={subsystem}/>}>
                        {(subsystem.pumpPower * 100).toFixed(2)} q/s
                    </WithTooltip>
                </div>
            </div>
        </div>
        {(subsystem.waterLevel > 0) && <div className="infoBox">
                <div>
                    Water: {(subsystem.waterLevel * 100).toFixed(0)} q ({(subsystem.waterFlow * 100).toFixed(0)} q/s)
                </div>
            </div>}
    </div>
}

export const Pumps = memo(_Pumps)
