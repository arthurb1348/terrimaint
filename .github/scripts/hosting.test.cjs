const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveTarget, isCurrent } = require("./hosting-target.cjs");
const { deploymentArgs } = require("./deploy-hosting.cjs");

const sha = "a".repeat(40);
const context = {
  repo: { owner: "arthurb1348", repo: "terrimaint" },
  sha,
  ref: "refs/heads/main",
  eventName: "push",
  payload: {},
};
const pr = {
  number: 60,
  state: "open",
  base: { ref: "main" },
  head: { sha, repo: { full_name: "arthurb1348/terrimaint" } },
};
function harness(event, pull = pr, main = sha) {
  const outputs = {};
  return {
    context: { ...context, ...event },
    core: {
      setOutput: (key, value) => {
        outputs[key] = value;
      },
    },
    outputs,
    github: {
      rest: {
        pulls: { get: async () => ({ data: pull }) },
        git: { getRef: async () => ({ data: { object: { sha: main } } }) },
      },
    },
  };
}

test("main et PR interne choisissent le SHA exact et autorisent la publication", async () => {
  for (const event of [
    {},
    { eventName: "pull_request", payload: { pull_request: pr } },
  ]) {
    const h = harness(event);
    await resolveTarget(h);
    assert.equal(h.outputs.sha, sha);
    assert.equal(h.outputs.deploy, "true");
  }
});
test("une PR de fork reste contrôlée sans publication", async () => {
  const fork = {
    ...pr,
    head: { ...pr.head, repo: { full_name: "external/fork" } },
  };
  const h = harness({
    eventName: "pull_request",
    payload: { pull_request: fork },
  });
  await resolveTarget(h);
  assert.equal(h.outputs.deploy, "false");
  assert.equal(
    await isCurrent({
      ...h,
      sha,
      prNumber: "60",
      github: harness({}, fork).github,
    }),
    false,
  );
});
test("le lancement manuel résout la PR demandée et refuse les cibles non autorisées", async () => {
  const event = {
    eventName: "workflow_dispatch",
    payload: { inputs: { pr_number: "60" } },
  };
  const h = harness(event);
  await resolveTarget(h);
  assert.equal(h.outputs.pr_number, "60");
  for (const invalid of ["0", "060", "60; echo unsafe", "-1"]) {
    await assert.rejects(
      resolveTarget(
        harness({ ...event, payload: { inputs: { pr_number: invalid } } }),
      ),
    );
  }
  await assert.rejects(
    resolveTarget(harness({ ...event, ref: "refs/heads/feature" })),
  );
  for (const pull of [
    { ...pr, state: "closed" },
    { ...pr, base: { ref: "other" } },
    { ...pr, head: { ...pr.head, repo: null } },
  ]) {
    await assert.rejects(resolveTarget(harness(event, pull)));
  }
});
test("une branche manuelle hors main ne publie pas en live", async () => {
  const h = harness({
    eventName: "workflow_dispatch",
    ref: "refs/heads/feature",
  });
  await resolveTarget(h);
  assert.equal(h.outputs.deploy, "false");
});
test("un ancien main ou head de PR et une PR fermée sont ignorés avant envoi", async () => {
  assert.equal(await isCurrent({ ...harness({}), sha, prNumber: "" }), true);
  assert.equal(
    await isCurrent({ ...harness({}, pr, "b".repeat(40)), sha, prNumber: "" }),
    false,
  );
  assert.equal(await isCurrent({ ...harness({}), sha, prNumber: "60" }), true);
  assert.equal(
    await isCurrent({
      ...harness({}, { ...pr, head: { ...pr.head, sha: "b".repeat(40) } }),
      sha,
      prNumber: "60",
    }),
    false,
  );
  assert.equal(
    await isCurrent({
      ...harness({}, { ...pr, state: "closed" }),
      sha,
      prNumber: "60",
    }),
    false,
  );
});
test("la CLI vise seulement Hosting, avec canal stable, expiration et SHA dans le nom", () => {
  const input = { channel: "pr-60", projectId: "demo-terrimaint", sha };
  const preview = deploymentArgs(input);
  assert.deepEqual(preview.slice(0, 4), [
    "hosting:channel:deploy",
    "pr-60",
    "--expires",
    "7d",
  ]);
  assert.ok(preview.includes("--no-authorized-domains"));
  assert.ok(!preview.includes("--message"));
  assert.ok(
    deploymentArgs({ ...input, channel: "live" }).includes(
      `TerriMaint live ${sha}`,
    ),
  );
  assert.deepEqual(deploymentArgs({ ...input, channel: "live" }).slice(0, 3), [
    "deploy",
    "--only",
    "hosting",
  ]);
  for (const invalid of [
    { channel: "other" },
    { channel: "pr-60;echo unsafe" },
    { sha: "main" },
    { projectId: "--bad" },
  ]) {
    assert.throws(() => deploymentArgs({ ...input, ...invalid }));
  }
});

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const deployScript = path.join(__dirname, "deploy-hosting.cjs");

test("la publication refuse un secret mal formé, un autre projet et les hooks sans exposer la clé", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hosting-refusal-"));
  try {
    fs.writeFileSync(
      path.join(directory, "firebase.json"),
      JSON.stringify({
        hosting: {
          public: "frontend/dist/terrimaint/browser",
          predeploy: ["echo forbidden"],
          rewrites: [{ source: "**", destination: "/index.html" }],
        },
      }),
    );
    for (const secret of [
      "PRIVATE_MARKER invalid json",
      JSON.stringify({
        type: "service_account",
        project_id: "other-project",
        private_key: "PRIVATE_MARKER",
      }),
      JSON.stringify({
        type: "service_account",
        project_id: "demo-terrimaint",
        private_key: "PRIVATE_MARKER",
      }),
    ]) {
      const result = spawnSync(process.execPath, [deployScript], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          FIREBASE_PROJECT_ID: "demo-terrimaint",
          SOURCE_SHA: sha,
          CHANNEL_ID: "pr-60",
          FIREBASE_SERVICE_ACCOUNT: secret,
        },
      });
      assert.notEqual(result.status, 0);
      assert.ok(!result.stderr.includes("PRIVATE_MARKER"));
      assert.ok(!fs.existsSync(path.join(directory, "deployment.json")));
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("avec une CLI factice, écrit URL/SHA seulement au succès et efface les identifiants aussi en échec", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hosting-fake-cli-"));
  try {
    const output = path.join(directory, "frontend/dist/terrimaint/browser");
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(
      path.join(directory, "firebase.json"),
      fs.readFileSync(path.join(__dirname, "../../firebase.json")),
    );
    const cli = path.join(directory, "fake-cli");
    const summary = path.join(directory, "summary.md");
    fs.writeFileSync(
      cli,
      `#!${process.execPath}
const fs = require('node:fs');
if (process.env.FIREBASE_SERVICE_ACCOUNT) process.exit(2);
if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) process.exit(3);
if (process.env.FAKE_FAILURE) process.exit(1);
console.log(JSON.stringify({ status: 'success', result: { site: { url: 'https://example.web.app', expireTime: '2026-11-08T12:00:00Z' } } }));
`,
      { mode: 0o700 },
    );
    for (const fail of ["", "yes"]) {
      fs.rmSync(summary, { force: true });
      const result = spawnSync(process.execPath, [deployScript], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          TMPDIR: directory,
          FIREBASE_PROJECT_ID: "demo-terrimaint",
          SOURCE_SHA: sha,
          CHANNEL_ID: "pr-60",
          PR_NUMBER: "60",
          RUN_URL: "https://github.com/example/run",
          FIREBASE_CLI: cli,
          GITHUB_STEP_SUMMARY: summary,
          FAKE_FAILURE: fail,
          FIREBASE_SERVICE_ACCOUNT: JSON.stringify({
            type: "service_account",
            project_id: "demo-terrimaint",
          }),
        },
      });
      assert.equal(result.status, fail ? 1 : 0, result.stderr);
      assert.equal(fs.existsSync(summary), !fail);
      assert.ok(
        !fs
          .readdirSync(directory)
          .some((name) => name.startsWith("terrimaint-firebase-")),
      );
      if (!fail) {
        assert.ok(fs.readFileSync(summary, "utf8").includes(sha));
        assert.ok(
          fs.readFileSync(summary, "utf8").includes("https://example.web.app"),
        );
        assert.equal(
          JSON.parse(fs.readFileSync(path.join(output, "deployment.json")))
            .commit,
          sha,
        );
      }
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
