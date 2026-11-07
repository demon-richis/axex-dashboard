import { useCallback, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import type { DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./driver-tour.css";

export function DashboardTour({
  guildId,
  userId,
  role,
  onBeforeStart,
  onAfterEnd,
}: {
  guildId: string;
  userId: string;
  role: "owner" | "admin" | "viewer";
  onBeforeStart?: () => void;
  onAfterEnd?: () => void;
}) {
  const storageKey = "axex-dashboard-tour-v1:" + userId + ":" + guildId;

  const startTour = useCallback(async () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, "started");
    onBeforeStart?.();

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
    });

    const { driver } = await import("driver.js");
    const steps = ([
      {
        element: '[data-tour="server-switcher"]',
        popover: {
          title: "Switch between servers",
          description: "Use this menu to move between the Discord servers you can access.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="overview-nav"]',
        popover: {
          title: "Server overview",
          description:
            "Start here for the bot connection state, verification totals and recent access changes.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="admins-nav"]',
        popover: {
          title: "People and access",
          description:
            role === "owner"
              ? "You control the dashboard roster. Add trusted admins, change roles or remove access here."
              : "Review who has dashboard access. Only the server owner can change this roster.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="audit-nav"]',
        popover: {
          title: "Audit history",
          description: "Filter and review recorded changes to dashboard access.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="role-badge"]',
        popover: {
          title: "Your access level",
          description: "You currently have " + role + " access to this Axex dashboard.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="account-menu"]',
        popover: {
          title: "Your Discord account",
          description: "Your signed-in account and sign-out action live here.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="tour-trigger"]',
        popover: {
          title: "Replay this guide",
          description: "You can restart this walkthrough whenever you need a refresher.",
          side: "right",
          align: "start",
        },
      },
    ] satisfies DriveStep[]).filter((step) => {
      if (typeof step.element !== "string") return true;
      return Boolean(document.querySelector(step.element));
    });

    if (steps.length === 0) {
      onAfterEnd?.();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tour = driver({
      steps,
      animate: !reducedMotion,
      smoothScroll: !reducedMotion,
      allowClose: true,
      allowKeyboardControl: true,
      overlayColor: "#050505",
      overlayOpacity: 0.76,
      stagePadding: 9,
      stageRadius: 12,
      popoverClass: "axex-driver-popover",
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      onDestroyed: () => onAfterEnd?.(),
    });
    tour.drive();
  }, [onAfterEnd, onBeforeStart, role, storageKey]);

  useEffect(() => {
    if (window.localStorage.getItem(storageKey)) return;
    const timeout = window.setTimeout(() => void startTour(), 900);
    return () => window.clearTimeout(timeout);
  }, [startTour, storageKey]);

  return (
    <button
      className="sidebar-tour"
      type="button"
      data-tour="tour-trigger"
      onClick={() => void startTour()}
    >
      <HelpCircle size={17} strokeWidth={1.8} aria-hidden="true" />
      <span>Take a dashboard tour</span>
    </button>
  );
}
