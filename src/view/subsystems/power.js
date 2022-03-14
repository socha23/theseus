import { ActionButton } from "../widgets"

import "../../css/subsystems/power.css"

export function SubsystemPowerButton({subsystem, actionController}) {
    const availablePower = subsystem.subPowerBalance
    const nominalConsumption = subsystem.nominalPowerConsumption
    const extraPowerConsumption = (subsystem.powerConsumptionMultiplier > 1)
    var tooltip = null
    if (!subsystem.on) {
        tooltip = <div className={(nominalConsumption > availablePower) ? "insufficientPower " : "sufficientPower"}>
            Req power: {subsystem.nominalPowerConsumption} kW
        </div>
    } else {
        const currentUse = subsystem.powerConsumption
        const usageText = (currentUse === nominalConsumption)
            ? `Power use: ${currentUse} kW`
            : `Power use: ${currentUse} / ${nominalConsumption} kW`

        tooltip = <div className={extraPowerConsumption ? "extraPowerConsumption" : " "}>
            {usageText}
        </div>
    }


    tooltip = <div className="powerButtonTooltip">
        <hr/>
        {tooltip}
        {extraPowerConsumption &&
            <div className="extraPowerConsumption">
                Extra power consumption
            </div>
        }
    </div>


    return <div className='powerButton'>
        <ActionButton
            action={subsystem.actionOn}
            actionController={actionController}
            additionalTooltip={tooltip}
        />
    </div>
}
