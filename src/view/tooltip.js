import React, { useContext, useState, useLayoutEffect } from "react";

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }

  export default function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useLayoutEffect(() => {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}


class TooltipController {
    constructor() {
        this.tooltip = null
        this.mouseX = 0
        this.mouseY = 0
        this.windowHeight = 0
        this.windowWidth = 0
    }
}

const controller = new TooltipController()
const TooltipContext = React.createContext(controller)


export function TooltipArea({children}) {
    return <TooltipContext.Provider value={controller}>
        <MouseCatcher>
            <div className="tooltipArea" >
                <Tooltip/>
                {children}
            </div>
        </MouseCatcher>
  </TooltipContext.Provider>
}

function MouseCatcher({children}) {
    const {height, width} = useWindowDimensions()
    const c = useContext(TooltipContext)
    return <div onMouseMove={e => {
        c.mouseX = e.clientX
        c.mouseY = e.clientY
        c.windowHeight = height
        c.windowWidth = width
    }}>
        {children}
    </div>
}

export function Tooltip() {
    const c = useContext(TooltipContext)
    const left = Math.min(c.mouseX, c.windowWidth - 300)

    return c.tooltip &&
        <div
            className="tooltip"
            style={{left: left, top: c.mouseY + 10}}
        >
            {c.tooltip}
        </div>
}

export function WithTooltip({
    tooltip,
    children
}) {
    const tooltipCtx = useContext(TooltipContext)

    if (!tooltip) {
        return <div>{children}</div>
    }

    return <div className="mouseOverCtx"
        onMouseOver = {e => {
            tooltipCtx.tooltip = tooltip
        }}
        onMouseOut = {e => {
            tooltipCtx.tooltip = null
        }}
    >
        {children}
    </div>
}
