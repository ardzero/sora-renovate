// Global (self-hosted) Renovate settings for the Sora runner.
// Repo-level behaviour lives in each repo's renovate config, which extends the
// presets in this repo (default.json, weekly.json).
module.exports = {
  platform: "github",
  // Every repo the Sora app is installed on. Repos without a renovate config
  // are skipped (requireConfig), so installing the app alone changes nothing.
  autodiscover: true,
  onboarding: false,
  requireConfig: "required",
  // Commit through the GitHub API so commits are signed/verified as the app.
  platformCommit: "enabled",
};
