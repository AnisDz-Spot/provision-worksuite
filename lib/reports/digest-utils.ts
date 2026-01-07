import {
  DigestData,
  DigestProject,
  DigestBlocker,
  DigestMilestone,
} from "@/components/reports/digest/types";

/**
 * Build Slack Blocks payload for the digest
 */
export const buildSlackPayload = (digestData: DigestData) => {
  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Weekly Project Digest" },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Range:* ${digestData.weekRange}` },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Completed*\n${digestData.summary.tasksCompleted}`,
        },
        {
          type: "mrkdwn",
          text: `*Progress*\n${digestData.summary.progressPercent}%`,
        },
        {
          type: "mrkdwn",
          text: `*Velocity Change*\n${digestData.summary.velocityChange}`,
        },
        {
          type: "mrkdwn",
          text: `*Team Use*\n${digestData.summary.teamUtilization}%`,
        },
      ],
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: "*Project Status*" } },
    ...digestData.projects.map((p: DigestProject) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${p.name}* — ${p.status}\nProgress: ${p.progress}% • Completed: ${p.tasksCompleted} • Due: ${p.upcomingDeadline}`,
      },
    })),
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: "*Achievements*" } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: digestData.achievements.map((a: string) => `• ${a}`).join("\n"),
      },
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: "*Blockers*" } },
    ...digestData.blockers.map((b: DigestBlocker) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `• *${b.title}* (${b.severity.toUpperCase()}) — ${b.project}`,
      },
    })),
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: "*Upcoming Milestones*" },
    },
    ...digestData.upcomingMilestones.map((m: DigestMilestone) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `• ${m.title} — ${m.date} (${m.project})`,
      },
    })),
  ];
  return { blocks };
};

/**
 * Build Microsoft Teams Adaptive Card payload for the digest
 */
export const buildTeamsCard = (digestData: DigestData) => {
  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "Weekly Project Digest",
        weight: "Bolder",
        size: "Large",
      },
      {
        type: "TextBlock",
        text: `Range: ${digestData.weekRange}`,
        isSubtle: true,
        wrap: true,
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Completed",
                weight: "Bolder",
                size: "Small",
              },
              {
                type: "TextBlock",
                text: String(digestData.summary.tasksCompleted),
              },
            ],
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Progress",
                weight: "Bolder",
                size: "Small",
              },
              {
                type: "TextBlock",
                text: `${digestData.summary.progressPercent}%`,
              },
            ],
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Velocity",
                weight: "Bolder",
                size: "Small",
              },
              { type: "TextBlock", text: digestData.summary.velocityChange },
            ],
          },
          {
            type: "Column",
            items: [
              {
                type: "TextBlock",
                text: "Team Use",
                weight: "Bolder",
                size: "Small",
              },
              {
                type: "TextBlock",
                text: `${digestData.summary.teamUtilization}%`,
              },
            ],
          },
        ],
      },
      {
        type: "TextBlock",
        text: "Project Status",
        weight: "Bolder",
        spacing: "Medium",
      },
      ...digestData.projects.map((p: DigestProject) => ({
        type: "Container",
        items: [
          {
            type: "TextBlock",
            text: `${p.name} — ${p.status}`,
            weight: "Bolder",
          },
          {
            type: "TextBlock",
            text: `Progress: ${p.progress}% • Completed: ${p.tasksCompleted} • Due: ${p.upcomingDeadline}`,
            wrap: true,
          },
        ],
        style: "default",
        spacing: "Small",
      })),
      {
        type: "TextBlock",
        text: "Achievements",
        weight: "Bolder",
        spacing: "Medium",
      },
      {
        type: "TextBlock",
        wrap: true,
        text: digestData.achievements.map((a: string) => `• ${a}`).join("\n"),
      },
      {
        type: "TextBlock",
        text: "Blockers",
        weight: "Bolder",
        spacing: "Medium",
      },
      {
        type: "TextBlock",
        wrap: true,
        text: digestData.blockers
          .map(
            (b: DigestBlocker) =>
              `• ${b.title} (${b.severity.toUpperCase()}) — ${b.project}`
          )
          .join("\n"),
      },
      {
        type: "TextBlock",
        text: "Upcoming Milestones",
        weight: "Bolder",
        spacing: "Medium",
      },
      {
        type: "TextBlock",
        wrap: true,
        text: digestData.upcomingMilestones
          .map(
            (m: DigestMilestone) => `• ${m.title} — ${m.date} (${m.project})`
          )
          .join("\n"),
      },
    ],
  };
};

/**
 * Generate HTML Digest for email export
 */
export const generateHTMLDigest = (digestData: DigestData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weekly Project Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #1e293b; font-size: 28px; }
    .header p { margin: 5px 0 0; color: #64748b; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #1e293b; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 12px; }
    .project-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 12px; }
    .project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .progress-bar { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { background: #3b82f6; height: 100%; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .blocker { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin-bottom: 10px; border-radius: 4px; }
    .achievement { padding: 10px; background: #f0fdf4; border-left: 3px solid #22c55e; margin-bottom: 8px; border-radius: 4px; }
    ul { margin: 0; padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Project Digest</h1>
      <p>${digestData.weekRange}</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Tasks Completed</div>
        <div class="stat-value">${digestData.summary.tasksCompleted}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Progress</div>
        <div class="stat-value">${digestData.summary.progressPercent}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Velocity Change</div>
        <div class="stat-value">${digestData.summary.velocityChange}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Team Utilization</div>
        <div class="stat-value">${digestData.summary.teamUtilization}%</div>
      </div>
    </div>

    <div class="section">
      <h2>🚀 Project Status</h2>
      ${digestData.projects
        .map(
          (p: DigestProject) => `
        <div class="project-card">
          <div class="project-header">
            <strong>${p.name}</strong>
            <span class="badge badge-${p.risk === "low" ? "success" : "danger"}">${p.status}</span>
          </div>
          <div>✅ ${p.tasksCompleted} tasks completed • 📅 Due ${p.upcomingDeadline}</div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${p.progress}%"></div></div>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="section">
      <h2>🎉 Achievements This Week</h2>
      ${digestData.achievements.map((a: string) => `<div class="achievement">✓ ${a}</div>`).join("")}
    </div>

    <div class="section">
      <h2>⚠️ Active Blockers</h2>
      ${digestData.blockers
        .map(
          (b: DigestBlocker) => `
        <div class="blocker">
          <strong>${b.title}</strong><br>
          <small>Project: ${b.project} • Severity: ${b.severity.toUpperCase()}</small>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="section">
      <h2>📅 Upcoming Milestones</h2>
      <ul>
        ${digestData.upcomingMilestones.map((m: DigestMilestone) => `<li><strong>${m.title}</strong> - ${m.date} (${m.project})</li>`).join("")}
      </ul>
    </div>
  </div>
</body>
</html>`;
};
