export function Pumps({subsystem, actionController}) {
    return <div className="pumps">
        <div className="infoRow">
            <span>Power usage:</span>
            <span>{subsystem.powerConsumption} Kw</span>
        </div>
        {(subsystem.pumping) &&
            <div>
                Active
            </div>
        }


    </div>
}

