export const MATERIALS = {
    SPARE_PARTS: "spareParts",
    LEAK_SEALS: "leakSeals",
}

export const MATERIALS_IN_ORDER = [
    MATERIALS.SPARE_PARTS,
    MATERIALS.LEAK_SEALS,
]

export const MATERIAL_TYPES = {
    AMMO: "ammo",
    REPAIR: "repair",
}

export const MATERIAL_DEFINITIONS = {
    [MATERIALS.SPARE_PARTS]: {
        name: "Spare parts",
        nameSingular: "Spare part",
        icon: "fa-solid fa-gears",
        type: MATERIAL_TYPES.REPAIR,
        storageLimit: 100,
    },
    [MATERIALS.LEAK_SEALS]: {
        name: "Leak seals",
        nameSingular: "Leak seal",
        icon: "fa-solid fa-droplet",
        type: MATERIAL_TYPES.REPAIR,
        storageLimit: 100,
    },
}

