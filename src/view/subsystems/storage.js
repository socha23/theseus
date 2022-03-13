import "../../css/subsystems/storage.css"
import { MATERIAL_DEFINITIONS } from "../../model/materials";

function InventoryItem({item, actionController}) {
    return <div className="inventoryItem">
        <div className="materialName">
            <i className={"icon " + MATERIAL_DEFINITIONS[item.materialId].icon}/>
            <div className="name">
                {MATERIAL_DEFINITIONS[item.materialId].name}
            </div>
        </div>
        <div className="inventoryCount">
            {item.count}
        </div>
    </div>
}

export function Storage({subsystem, actionController}) {
    return <div className={"storage "}>
        {
            subsystem.inventoryCounts.map(c =>
                <InventoryItem key={c.materialId} item={c} actionController={actionController}/>
            )
        }
        </div>
}

