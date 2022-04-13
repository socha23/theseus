import { memo } from "react";
import "../../css/subsystems/battery.css"
import { SegmentProgress } from "../widgets";

function _Battery({subsystem}) {
    return <div className={"battery "
            +  (subsystem.chargeUp > 0 ? "chargeUp " : "")
            +  (subsystem.chargeDraw > 0 ? "chargeDraw " : "")
        }>
        <div className="mainPane">
            <div className="batteryContainer">
                <div className="batteryTip"/>
                <div className="batteryBody">
                    <SegmentProgress value={subsystem.chargePercent}/>
                </div>
            </div>
            <div className="rates">
                {
                    subsystem.chargeUp > 0 ? <div>
                        +{subsystem.chargeUp.toFixed(1)} kW
                        </div> : <div/>
                }
                {
                    subsystem.drawCharge > 0 ? <div>
                        -{subsystem.drawCharge.toFixed(1)} kW
                        </div> : <div/>
                }
            </div>
        </div>
    </div>
}

export const Battery = memo(_Battery)
