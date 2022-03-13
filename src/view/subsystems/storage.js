import { useContext } from "react";
import "../../css/subsystems/storage.css"
import { MATERIAL_DEFINITIONS } from "../../model/materials";
import { RequiredInventory } from "../materials";

function InventoryItem({item, actionController}) {
    const reqItems = useContext(RequiredInventory).values
    var className = "default "
    const requested = reqItems[item.materialId] || 0
    const avaliable = item.count
    if (requested > 0 && requested <= avaliable) {
        className = "provided "
    } else if (requested > avaliable) {
        className = "missing "
    }

    return <div className={"inventoryItem " + className}>
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

