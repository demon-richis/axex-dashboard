# Axex D1 Dashboard Redesign: Bot Dashboard Benchmark

## Scope and evidence standard

This benchmark compares public evidence from Carl-bot, MEE6, Wick, Dyno, and ProBot for Axex D1’s limited dashboard scope: server overview/health, verification statistics, admins, audit log, and server switching. It distinguishes directly observed public pages from workflows described in official documentation. None of the research authenticated to a product dashboard or bypassed a login gate. Consequently, documented dashboard patterns are not treated as verified live UI, and none of the sources establishes the accessibility quality of an authenticated dashboard.

## Comparative findings

| Dimension | Evidence-led comparison | Axex implication |
|---|---|---|
| **Navigation and server picking** | Carl-bot’s public homepage exposes site-level links and a Login link, but not dashboard navigation; its docs link to the dashboard and define a broad documentation taxonomy. [1] [2] MEE6 support documentation describes selecting a server, a top-right current-server dropdown, and server → plugin → command paths; its dashboard itself was login-gated. [4] [5] Wick docs describe selecting a server before sidebar navigation, and release notes describe a server list and a refreshable no-server state; these are documented patterns, not observed controls. [7] [8] [9] Dyno docs say users select a server from a list, then navigate modules or Logs; its public account page showed a Discord login prompt. [11] [12] [13] ProBot’s public dashboard shell displayed a login prompt; its docs describe a left-side server menu and an Administrator eligibility requirement. [15] [16] [17] | Keep active server identity persistent and unmistakable, with an obvious switcher. Make unavailable-server states explain the actual Axex permission requirement and a useful next step. Treat competitor selector placements as documented or recommended—not as directly observed Axex-ready components. |
| **Operational overview** | Wick’s FAQ documents a per-server Overview with issues to fix and a systems overview; its public Status page is service-wide health, not server-specific dashboard evidence. [6] [10] Dyno docs describe an overview with server counts, announcements, and recent dashboard activity, and its Logs docs specify event metadata. [12] [14] Carl-bot’s public status page directly states a 30-second refresh cadence and presents shard status and an issue count; this is global service status, not a per-server health panel. [3] The other product pages/docs describe capabilities but do not verify equivalent server-health layouts. | Make the Axex landing view a compact server overview: summarize only available health and verification information, and show data freshness or refresh status. Keep global/service health distinct from selected-server state. Put actionable exceptions and recent relevant activity where supported by Axex data; do not invent status measures. |
| **Module organization** | Carl-bot’s public homepage presents named feature areas with short descriptions and documentation links; its docs categorize areas such as Getting Started, Config, Logging, and Moderation. [1] [2] MEE6 documents a Bot Maker-specific separation of Library, My modules, and On this server, while its public product page groups capabilities; neither substantiates the whole dashboard’s layout. [4] [6] Dyno docs group its module catalog by user goal and describe distinct module/settings workflows. [13] [14] Wick documents a guided, step-based Wizard and explanatory links between settings, but only through release notes and guides. [7] [8] | Use a small, stable Axex navigation organized around the actual D1 destinations—Overview, Verification, Admins, and Audit log—with concise labels and brief descriptions where needed. Do not add a generic module catalog or imply broader bot capabilities. |
| **Interaction and accessibility** | Official docs describe useful interaction patterns: contextual help beside settings, paged and categorized logs, staged setup, explicit refresh/sync, and actionable missing-server or failure messages. [8] [9] [14] [16] These are documented behaviors, not independent usability tests. Login-gated pages prevented inspection of authenticated flows across MEE6, Wick, Dyno, and ProBot; Carl-bot’s public pages likewise reveal nothing about authenticated dashboard controls. No source verifies keyboard navigation, screen-reader semantics, focus visibility, contrast, or responsive behavior. [4] [7] [11] [15] | Provide clear loading, empty, permission, stale-data, and error states; explain what happened and how to proceed. In Axex, verify keyboard operation, visible focus, semantic names, contrast, and responsive behavior directly rather than assuming competitors establish a standard. For audit entries, prioritize actor, time, and change when those fields exist. |

## Direct observations vs. documentation and access limits

**Directly observed public evidence:** Carl-bot’s public homepage and global status page were inspectable; the latter displayed a refresh interval, shard identifiers, and an issue count at inspection time. [1] [3] The MEE6 dashboard endpoint displayed a Discord-login requirement. [4] Wick’s canonical dashboard endpoint displayed login options, while its public Status page exposed service-wide component and shard status. [7] [10] Dyno’s account page displayed a Discord login prompt. [11] ProBot’s dashboard public shell displayed a login requirement and limited site navigation. [15]

**Documentation-only evidence:** Server-selection paths, active-server dropdown/menu placement, module hierarchy, overview contents, permissions, logging fields, wizard interactions, and refresh/error behaviors described above come from official support pages, docs, or release notes—not an authenticated live dashboard. [2] [5] [6] [8] [9] [12] [13] [14] [16] [17]

**Login-gated or unverified:** No authenticated server dashboard was inspected for any competitor. No claims are made about the actual visual layout or accessibility of their protected dashboard experiences. Marketing feature descriptions and docs are not evidence that a corresponding dashboard panel exists. [4] [7] [11] [15]

## Ranked patterns for Axex D1

1. **Persistent server context and explicit switching.** Keep the selected server visible across all D1 sections; explain missing access using Axex’s real permission model. This is a strong cross-product navigation lesson, although competitor selector UI is mostly documentation-only. [5] [7] [12] [16]
2. **A concise, actionable server overview.** Put supported health and verification summary information first, separate from any global service status, and make freshness visible. Wick documents an issues-plus-systems Overview; Carl-bot provides a directly observed freshness pattern only on global status. [3] [6]
3. **Four clear, scoped destinations.** Organize only Overview, Verification, Admins, and Audit log, with plain-language labels and succinct help. Competitor documentation supports named categories and explanatory signposting, not a need to copy their breadth. [1] [2] [13]
4. **An attributable, scannable audit log.** Where Axex records the data, show who acted, when, and what changed; use meaningful categories and pagination only if volume warrants. Dyno documents these fields and log navigation, but its UI was not observed. [14]
5. **Helpful states and verified accessibility.** Explain empty, denied, stale, loading, and failed states with a next action; test keyboard, focus, screen-reader, contrast, and mobile behavior in Axex itself. Official docs describe actionable refresh/error patterns, but do not establish accessibility quality. [9] [14]

### Explicit non-goals

- Do **not** imitate competitors’ feature breadth or import their moderation, automod, roles, commands, or security modules.
- Do **not** imply Axex supports anything beyond its stated D1 scope: overview/admins/audit/coming soon (with verification statistics and server switching represented only where Axex’s product scope supports them).
- Do **not** present competitor documentation, marketing pages, global status pages, or login screens as direct evidence of authenticated dashboard UI or accessibility.

## References

[1]: https://carl.gg/ "Carl-bot Dashboard"
[2]: https://docs.carl.gg/ "Carl-bot Docs"
[3]: https://carl.gg/status "Bot status"
[4]: https://mee6.xyz/dashboard/ "MEE6 Dashboard"
[5]: https://help.mee6.xyz/en/articles/847011-how-to-use-mee6-bot-maker "How To Use MEE6 Bot Maker — MEE6 Support Portal"
[6]: https://mee6.xyz/en/plugins/management "The best moderation bot for Discord — MEE6"
[7]: https://dashboard.wickbot.com/ "Wick Dashboard (login page)"
[8]: https://docs.wickbot.com/setup/ "Fast & Smooth Setup (Setup Wizard)"
[9]: https://docs.wickbot.com/changelog/v5.x/5.2.1/ "Wick V5.2.1"
[10]: https://wickbot.com/status "Status"
[11]: https://dyno.gg/account "Dyno account — Login with Discord"
[12]: https://docs.dyno.gg/faq "Frequently Asked Questions (FAQ)"
[13]: https://docs.dyno.gg/modules "Modules"
[14]: https://docs.dyno.gg/dashboard/logs "Logs"
[15]: https://probot.io/dashboard "Dashboard (ProBot official site; login-gated)"
[16]: https://docs.probot.io/docs/getting-started/dashboard "Dashboard Setup | ProBot Docs"
[17]: https://docs.probot.io/docs/modules/self-assignable-roles "Self-Assignable Roles | ProBot Docs"
