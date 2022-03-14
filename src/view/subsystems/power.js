import { useContext } from "react"
import { TooltipContext } from "../tooltip"

import "../../css/subsystems/power.css"



function SubsystemPowerInfoTooltip({subsystem}) {
    var tooltipText = null;
    if (!subsystem.on) {
        tooltipText = `Req power: ${subsystem.nominalPowerConsumption} kW`
    } else if (subsystem.powerConsumption !== subsystem.nominalPowerConsumption) {
        tooltipText = `Power use: ${subsystem.powerConsumption} / ${subsystem.nominalPowerConsumption} kW`
    } else {
        tooltipText = `Power use: ${subsystem.powerConsumption} kW`
    }
    return <div className="subsystemPowerInfoTooltip">
        <div>{tooltipText}</div>
        {
        (subsystem.powerConsumptionMultiplier > 1) && <div className="extraPowerConsumption">
            Extra power consumption
            </div>
        }
    </div>
}

export function SubsystemPowerInfo({subsystem}) {

    const tooltipCtx = useContext(TooltipContext)

    const tooltip = <SubsystemPowerInfoTooltip subsystem={subsystem}/>
    const powerUsageClass = (subsystem.powerConsumptionMultiplier > 1)
        ? "extraConsumption " : " "

    return <div className={"powerInfo " + powerUsageClass}
        onMouseOver ={e => {tooltipCtx.tooltip = tooltip}}
        onMouseOut ={e => {tooltipCtx.tooltip = null}}
    >
        <i className="icon fa-solid fa-bolt"/>
    </div>
}

