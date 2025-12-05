// Re-export everything from all utility modules for backward compatibility

export * from "./cn";
export * from "./projects";
export * from "./project-events";
export * from "./project-comments";
export * from "./project-dependencies";
export * from "./tasks";
export * from "./time-tracking";
export * from "./milestones";
export * from "./project-files";
export * from "./saved-views";
export * from "./health-scoring";
export * from "./templates";
export * from "./analytics";
export * from "./team-utilities";
export * from "./dashboard-utilities";

// All functions successfully migrated to focused modules!
// The original lib/utils.ts can now be safely removed.
