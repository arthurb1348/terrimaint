const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

function deploymentArgs({ channel, projectId, sha }) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId))
    throw new Error("FIREBASE_PROJECT_ID invalide.");
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("SHA invalide.");
  if (!/^(live|pr-[1-9]\d*)$/.test(channel)) throw new Error("Canal invalide.");
  return [
    ...(channel === "live"
      ? ["deploy", "--only", "hosting"]
      : [
          "hosting:channel:deploy",
          channel,
          "--expires",
          "7d",
          "--no-authorized-domains",
        ]),
    "--project",
    projectId,
    ...(channel === "live"
      ? ["--message", `TerriMaint ${channel} ${sha}`]
      : []),
    "--non-interactive",
    "--json",
  ];
}

function deploy() {
  const {
    FIREBASE_PROJECT_ID: projectId,
    SOURCE_SHA: sha,
    CHANNEL_ID: channel,
  } = process.env;
  const args = deploymentArgs({ channel, projectId, sha });
  let account;
  try {
    account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "null");
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT doit contenir un JSON valide ; vérifier le secret sur GitHub.",
    );
  }
  if (
    !account ||
    account.type !== "service_account" ||
    account.project_id !== projectId
  ) {
    throw new Error(
      "Le secret FIREBASE_SERVICE_ACCOUNT doit appartenir au projet FIREBASE_PROJECT_ID.",
    );
  }
  const config = JSON.parse(fs.readFileSync("firebase.json", "utf8"));
  const hosting = config.hosting;
  // Une configuration de PR ne doit pas ajouter de hook, de backend ou un autre site.
  if (
    Object.keys(config).some((key) => key !== "hosting") ||
    !hosting ||
    Array.isArray(hosting) ||
    Object.keys(hosting).some(
      (key) => !["public", "ignore", "headers", "rewrites"].includes(key),
    ) ||
    hosting.public !== "frontend/dist/terrimaint/browser" ||
    JSON.stringify(hosting.rewrites) !==
      JSON.stringify([{ source: "**", destination: "/index.html" }])
  ) {
    throw new Error("Configuration limitée au Hosting statique attendue.");
  }
  const metadata = {
    version: `TerriMaint ${channel} ${sha}`,
    commit: sha,
    channel,
    pullRequest: process.env.PR_NUMBER || null,
    run: process.env.RUN_URL,
  };
  fs.writeFileSync(
    path.join(hosting.public, "deployment.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  const credentialDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "terrimaint-firebase-"),
  );
  const credentialPath = path.join(credentialDirectory, "account.json");
  try {
    fs.writeFileSync(credentialPath, JSON.stringify(account), { mode: 0o600 });
    const env = {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
    };
    delete env.FIREBASE_SERVICE_ACCOUNT;
    const result = spawnSync(process.env.FIREBASE_CLI, args, {
      env,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.stderr.write(
        result.stderr || "Firebase a refusé le déploiement.\n",
      );
      throw new Error(
        "Échec Firebase ; vérifier le projet, la liaison, les droits Hosting et les quotas.",
      );
    }
    const response = JSON.parse(result.stdout);
    if (response.status !== "success")
      throw new Error("Firebase ne confirme pas le succès.");
    const sites =
      channel === "live"
        ? [{ url: `https://${projectId}.web.app` }]
        : Object.values(response.result);
    if (!sites.length || sites.some((site) => !/^https:\/\//.test(site.url)))
      throw new Error("URL HTTPS absente.");
    const lines = [
      "## Firebase Hosting",
      "",
      `Canal : \`${channel}\``,
      `Commit publié : \`${sha}\``,
      `Version : \`${metadata.version}\``,
      `Source : ${metadata.run}`,
      "",
      ...sites.map(
        (site) =>
          `- ${site.url}${site.version ? ` — version Firebase : ${site.version}` : ""}${site.expireTime ? ` — expiration : ${site.expireTime}` : ""}`,
      ),
      "",
      "Provenance consultable sur le site : `/deployment.json`.",
      "",
    ];
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
  } finally {
    fs.rmSync(credentialDirectory, { recursive: true, force: true });
  }
}

module.exports = { deploymentArgs };
if (require.main === module) deploy();
