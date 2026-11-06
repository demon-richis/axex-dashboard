import { useEffect, useRef, type PointerEvent } from "react";

export function HeroDiorama() {
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = useRef(true);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = reducedMotion.matches;
    let scope: { revert: () => unknown } | undefined;
    let disposed = false;

    const mountMotion = async () => {
      if (disposed || reducedMotion.matches || scope) return;
      const { animate, createScope, utils } = await import("animejs");
      if (disposed || reducedMotion.matches) return;

      scope = createScope({ root: element }).add(() => {
        utils.set(".hero-instrument", {
          rotateX: "8deg",
          rotateY: "-12deg",
          translateY: "0px",
          translateZ: "0px",
        });
        utils.set(".instrument-orbit--wide", {
          translateX: "-50%",
          translateY: "-50%",
          rotateZ: "-16deg",
        });
        utils.set(".instrument-orbit--thin", {
          translateX: "-50%",
          translateY: "-50%",
          rotateX: "58deg",
          rotateZ: "22deg",
        });
        animate(".hero-instrument", {
          rotateX: [8, 12],
          rotateY: [-12, -5],
          translateY: [0, -5],
          translateZ: [0, 6],
          duration: 6200,
          ease: "inOutSine",
          alternate: true,
          loop: true,
        });
        animate(".instrument-orbit--wide", {
          rotateZ: ["-16deg", "344deg"],
          duration: 38000,
          ease: "linear",
          loop: true,
        });
        animate(".instrument-orbit--thin", {
          rotateZ: ["22deg", "-338deg"],
          duration: 46000,
          ease: "linear",
          loop: true,
        });
        animate(".instrument-marker", {
          scale: [0.82, 1.08],
          opacity: [0.62, 1],
          duration: 1900,
          ease: "inOutSine",
          alternate: true,
          loop: true,
        });
      });
    };

    void mountMotion();
    const onMotionPreferenceChange = () => {
      reduceMotion.current = reducedMotion.matches;
      if (reducedMotion.matches) {
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
        scope?.revert();
        scope = undefined;
      } else {
        void mountMotion();
      }
    };
    reducedMotion.addEventListener("change", onMotionPreferenceChange);

    return () => {
      disposed = true;
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
      scope?.revert();
    };
  }, []);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || reduceMotion.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
  }

  function settle(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      className="hero-diorama"
      ref={root}
      aria-hidden="true"
      onPointerMove={tilt}
      onPointerLeave={settle}
    >
      <div className="diorama-grid" />
      <svg className="diorama-engraving" viewBox="0 0 640 520" fill="none">
        <path d="M45 276C66 119 184 40 329 62c133 20 229 100 251 208" />
        <path d="M80 360c55 79 144 125 250 116 95-8 161-48 212-116" />
        <path d="M84 101h92M462 419h95M507 101h55M77 419h43" />
        <circle cx="320" cy="274" r="176" />
        <circle cx="320" cy="274" r="220" strokeDasharray="2 8" />
      </svg>
      <div className="instrument-orbit instrument-orbit--wide" />
      <div className="instrument-orbit instrument-orbit--thin" />
      <span className="instrument-marker marker-amber" />
      <span className="instrument-marker marker-ember" />
      <div className="diorama-readout readout-top">
        <span className="readout-index">SYS / 01</span>
        <span className="readout-rule" />
        <strong>CONTROL PLANE</strong>
        <span className="readout-status">
          <i /> PRIVATE BY DESIGN
        </span>
      </div>
      <div className="stage-parallax">
        <div className="hero-instrument">
          <div className="instrument-halo" />
          <div className="instrument-shadow" />
          <div className="server-machine">
            <div className="machine-unit unit-back">
              <div className="unit-top" />
              <div className="unit-side" />
              <div className="unit-front">
                <span className="unit-index">AX / 03</span>
                <span className="unit-vent" />
                <i className="unit-light" />
              </div>
            </div>
            <div className="machine-unit unit-mid">
              <div className="unit-top" />
              <div className="unit-side" />
              <div className="unit-front">
                <span className="unit-index">GUILD SYNC</span>
                <span className="unit-vent" />
                <i className="unit-light" />
              </div>
            </div>
            <div className="machine-unit unit-frontmost">
              <div className="unit-top" />
              <div className="unit-side" />
              <div className="unit-front">
                <span className="unit-emblem">AX</span>
                <span className="unit-label">
                  AXEX <small>SERVER CONTROL</small>
                </span>
                <div className="unit-ports">
                  <i />
                  <i />
                  <i />
                  <b />
                </div>
                <i className="unit-light" />
              </div>
            </div>
            <div className="machine-plinth">
              <span>OWNER-DEFINED ACCESS</span>
              <b>●</b>
            </div>
          </div>
        </div>
      </div>
      <div className="diorama-readout readout-bottom">
        <span className="readout-index">AUTH / 02</span>
        <strong>IDENTITY ONLY</strong>
        <span className="readout-sub">No bot token in the dashboard</span>
      </div>
      <span className="diorama-coordinate coordinate-left">40° 42′ 46″ N</span>
      <span className="diorama-coordinate coordinate-right">AX—CONTROL / 001</span>
    </div>
  );
}
