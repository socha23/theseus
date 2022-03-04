function AmmoBullet({spent}) {
    return <span className='bullet'>
        <i className={"fa-circle " + (spent ? "fa-regular": "fa-solid")}></i>
    </span>
}

function AmmoBar({subsystem}) {
    return <div className='ammo'>
        <span>Ammo: </span>
        {
            new Array(subsystem.ammoMax).fill(0).map((key, idx) =>
                 <AmmoBullet key={subsystem.i + "_ammo_" + idx} spent={idx >= subsystem.ammo}/>
            )
        }
    </div>
}

function AimBar({aim}) {
    return <div className="aimBar">
        <div
            className="crosshairs"
            style={{
                left: ((aim.progress / aim.progressMax) * 100) + "%",
                width: ((aim.crosshairsSize / aim.progressMax) * 100) + "%",


            }}
        />
        {
            aim.targets.map(t => <div
                key={t.id}
                className="target"
                style={{
                    left: ((t.position / aim.progressMax) * 100) + "%",
                    width: ((t.size / aim.progressMax) * 100) + "%",
                }}
            />)
        }
        {
            aim.shootMarks.map(t => <div
                key={t.id}
                className={"shootMark " + (t.hit ? "hit " : "miss ")}
                style={{
                    left: ((t.position / aim.progressMax) * 100) + "%",
                    width: ((t.size / aim.progressMax) * 100) + "%",
                }}
            />)
        }
    </div>
}


export function Weapon({subsystem}) {
    return <div className="weapon">
        <AmmoBar subsystem={subsystem}/>
        {subsystem.aim && <AimBar aim={subsystem.aim}/>}
    </div>
}
