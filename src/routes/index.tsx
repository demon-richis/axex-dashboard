import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { MotionConfig, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  FileClock,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Network,
  Radar,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { LoadingSkeleton } from "../components/loading-skeleton";
import { Button } from "../components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import "../components/dashboard.css";
import "../components/landing.css";

const loadLanding = createServerFn({ method: "GET" }).handler(async () => {
  const [{ getRequest }, { getSession }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("../lib/session.server.ts"),
  ]);
  const request = getRequest();
  const search = new URL(request.url).searchParams;

  return {
    signedIn: Boolean(getSession(request)),
    connected: search.get("connected") === "1",
    error: search.get("error"),
  };
});

export const Route = createFileRoute("/")({
  pendingMs: 80,
  pendingMinMs: 180,
  pendingComponent: () => <LoadingS¶»§q«^