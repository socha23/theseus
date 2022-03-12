import { SubsystemPowerInfo } from "./power";



export function Pumps({subsystem, actionController}) {
    return <div className="pumps">
        <SubsystemPowerInfo subsystem={subsystem}/>
        {(subsystem.pumping) &&
            <div>
                Active
            </div>
        }


    </div>
}

