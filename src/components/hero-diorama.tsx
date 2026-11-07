import { useEffect, useRef, type PointerEvent } from "react";

export function HeroDiorama() {
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = useRef(true);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = motionPreference.matches;
    let scope: { revert: () => unknown } | undefined;
    let disposed = false;

    const mountMotion = async () => {
      if (disposed || motionPreference.matches || scope) return;
      const { animate, createScope, utils } = await import("animejs");
      if (disposed || motionPreference.matches) return;

      scope = createScope({ root: element }).add(() => {
        utils.set(".hero-instrument", {
          rotateX: "5deg",
          rotateY: "-8deg",
          translateY: "0px",
          translateZ: "0px",
        });
        utils.set(".diagram-orbit--wide", {
          translateX: "-50%",
          translateY: "-50%",
          rotateZ: "-18deg",
        });
        utils.set(".diagram-orbit--tall", {
          translateX: "-50%",
          translateY: "-50%",
          rotateZ: "20deg",
        });

        animate(".hero-instrument", {
          rotateX: [5, 8],
          rotateY: [-8, -2],
          translateY: [0, -5],
          translateZ: [0, 8],
          duration: 7200,
          ease: "inOutSine",
          alternate: true,
          loop: true,
        });
        animate(".diagram-orbit--wide", {
          rotateZ: ["-18deg", "342deg"],
          duration: 44000,
          ease: "linear",
          loop: true,
        });
        animate(".diagram-orbit--tall", {
          rotateZ: ["20deg", "-340deg"],
          duration: 52000,
          ease: "linear",
          loop: true,
        });
        animate(".signal-dot", {
          scale: [0.72, 1.12],
          opacity: [0.5, 1],
          duration: 2100,
          ease: "inOutSine",
          alternate: true,
          loop: true,
        });
      });
    };

    void mountMotion();
    const onMotionPreferenceChange = () => {
      reduceMotion.current = motionPreference.matches;
      if (motionPreference.matches) {
        element.style.setProperty("--tilt-x", "0deg");
        element.style.setProperty("--tilt-y", "0deg");
        scope?.revert();
        scope = undefined;
      } else {
        void mountMotion();
      }
    };
    motionPreference.addEventListener("change", onMotionPreferenceChange);

    return () => {
      disposed = true;
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
      scope?.revert();
    };
  }, []);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || reduceMotion.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--tilt-x", `${(-y * 3.5).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
  }

  function settle(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      className="hero-diagram"
      ref={root}
      aria-hidden="true"
      onPointerMove={tilt}
      onPointerLeave={settle}
    >
      <div className="diagram-field" />
      <div className="diagram-orbit diagram-orbit--wide" />
      <div className="diagram-orbit diagram-orbit--tall" />
      <svg className="diagram-wires" viewBox="0 0 640 520" fill="none">
        <path className="wire wire--owner" d="M95 152c54-12 75 6 122 55" />
        <path className="wire wire--server" d="M534 179c-62-5-88 9-126 38" />
        <path className="wire wire--audit" d="M150 392c37-44 64-57 107-72" />
        <circle className="signal-dot signal-dot--one" cx="217" cy="207" r="4" />
        <circle className="signal-dot signal-dot--two" cx="414" cy="218" r="4" />
        <circle className="signal-dot signal-dot--three" cx="257" cy="320" r="4" />
      </svg>

      <div className="diagram-label diagram-label--top">
        <span>ACCESS MODEL</span>
        <b>01 — 03</b>
      </div>

      <div className="flow-node flow-node--owner">
        <span className="flow-node-index">01 / IDENTITY</span>
        <strong>Server owner</strong>
        <small>Discord · identify only</small>
      </div>
      <div className="flow-node flow-node--server">
        <span className="flow-node-index">02 / SCOPE</span>
        <strong>Selected server</strong>
        <small>Access checked per request</small>
      </div>
      <div className="flow-node flow-node--audit">
        <span className="flow-node-index">03 / RECORD</span>
        <strong>Access changes</strong>
        <small>Actor · target · time</small>
      </div>

      <div className="stage-parallax">
        <div className="hero-instrument">
          <div className="core-shadow" />
          <div className="core-plate core-plate--back" />
          <div className="core-plate core-plate--middle">
            <span className="middle-index">GUILD ACCESS</span>
            <span className="middle-rule" />
            <span className="middle-copy">OWNER RULESET</span>
          </div>
          <div className="core-plate core-plate--front">
            <div className="core-heading">
              <span className="core-mark">AX</span>
              <span className="core-wordmark">
                AXEX <small>CONTROL</small>
              </span>
              <span className="core-led" />
            </div>
            <div className="core-separator" />
            <div className="core-row">
              <span>IDENTITY</span>
              <b>DISCORD</b>
            </div>
            <div className="core-row">
              <span>AUTHORITY</span>
              <b>OWNER + ROSTER</b>
            </div>
            <div className="core-row">
              <span>CHANGES</span>
              <b>AUDIT LOG</b>
            </div>
            <div className="core-foot">
              <span>SERVER-SCOPED</span>
              <span className="core-foot-mark">AX / 01</span>
            </div>
          </div>
        </div>
      </div>

      <div className="diagram-label diagram-label--bottom">
        <span>ACCESS IS OWNER-DEFINED</span>
        <span className="diagram-led" />
      </div>
    </div>
  );
}
