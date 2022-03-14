import "../../css/subsystems/pumps.css"
import { useContext } from "react";
import { TooltipContext } from "../tooltip";


function PumpPowerBoxTooltip({subsystem}) {
    var tooltipText = null;
    if (!subsystem.on) {
        tooltipText = `Req power: ${subsystem.nominalPowerConsumption} kW`
    } else if (subsystem.powerConsumption !== subsystem.nominalPowerConsumption) {
        tooltipText = `Power use: ${subsystem.powerConsumption} / ${subsystem.nominalPowerConsumption} kW`
    } else {
        tooltipText = `Power use: ${subsystem.powerConsumption} kW`
    }
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


export function Pumps({subsystem, actionController}) {
    const tooltipCtx = useContext(TooltipContext)
    const powerBoxTooltip = <PumpPowerBoxTooltip subsystem={subsystem}/>

    return <div className={"pumps " +  (subsystem.pumping ? "active " : "inactive ") }>
        <div className="mainPane">
            <div className="topRow">
                <i className={"pumpIcon fa-solid fa-water "}/>
                <div className="powerBox"
                    onMouseOver ={e => {tooltipCtx.tooltip = powerBoxTooltip}}
                    onMouseOut ={e => {tooltipCtx.tooltip = null}}
                >
                    {(subsystem.pumpPower * 100)} q/s
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

