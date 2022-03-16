export const MATERIALS = {
    SPARE_PARTS: "spareParts",
    LEAK_SEALS: "leakSeals",
    KINETIC_AMMO: "kineticAmmo",
    FUEL_RODS: "fuelRods",
}

export const MATERIALS_IN_ORDER = [
    MATERIALS.SPARE_PARTS,
    MATERIALS.LEAK_SEALS,
    MATERIALS.KINETIC_AMMO,
    MATERIALS.FUEL_RODS,

]

export const MATERIAL_TYPES = {
    AMMO: "ammo",
    REPAIR: "repair",
    FUEL: "fuel",
}

export const MATERIAL_DEFINITIONS = {
    [MATERIALS.SPARE_PARTS]: {
        name: "Spare parts",
        nameSingular: "Spare part",
        icon: "fa-solid fa-gears",
        type: MATERIAL_TYPES.REPAIR,
        storageLimit: 50,
    },
    [MATERIALS.LEAK_SEALS]: {
        name: "Leak seals",
        nameSingular: "Leak seal",
        icon: "fa-solid fa-droplet",
        type: MATERIAL_TYPES.REPAIR,
        storageLimit: 50,
    },
    [MATERIALS.KINETIC_AMMO]: {
        name: "Kinetic ammo",
        nameSingular: "Kinetic ammo",
        icon: "fa-solid fa-align-justify",
        type: MATERIAL_TYPES.AMMO,
        storageLimit: 50,
    },
    [MATERIALS.FUEL_RODS]: {
        name: "Fuel rods",
        nameSingular: "Fuel rod",
        icon: "fa-solid fa-radiation",
        type: MATERIAL_TYPES.FUEL,
        storageLimit: 50,
    },
}

