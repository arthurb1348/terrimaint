const repositoryName = (context) =>
  `${context.repo.owner}/${context.repo.repo}`;

async function resolveTarget({ github, context, core }) {
  let pr = context.payload.pull_request;
  const number = context.payload.inputs?.pr_number || "";
  if (context.eventName === "workflow_dispatch" && number) {
    if (context.ref !== "refs/heads/main" || !/^[1-9]\d*$/.test(number)) {
      throw new Error(
        "Lancer depuis main avec un numéro de PR entier positif.",
      );
    }
    ({ data: pr } = await github.rest.pulls.get({
      ...context.repo,
      pull_number: Number(number),
    }));
    if (
      pr.state !== "open" ||
      pr.base.ref !== "main" ||
      pr.head.repo?.full_name !== repositoryName(context)
    ) {
      throw new Error(
        "La PR doit être ouverte, interne au dépôt et viser main.",
      );
    }
  }
  const sha = pr ? pr.head.sha : context.sha;
  const deploy = pr
    ? pr.state === "open" &&
      pr.base.ref === "main" &&
      pr.head.repo?.full_name === repositoryName(context)
    : context.ref === "refs/heads/main";
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("SHA de source invalide.");
  core.setOutput("sha", sha);
  core.setOutput("pr_number", pr ? String(pr.number) : "");
  core.setOutput("deploy", String(deploy));
}

async function isCurrent({ github, context, sha, prNumber }) {
  if (prNumber) {
    const { data: pr } = await github.rest.pulls.get({
      ...context.repo,
      pull_number: Number(prNumber),
    });
    return (
      pr.state === "open" &&
      pr.base.ref === "main" &&
      pr.head.repo?.full_name === repositoryName(context) &&
      pr.head.sha === sha
    );
  }
  const { data: ref } = await github.rest.git.getRef({
    ...context.repo,
    ref: "heads/main",
  });
  return ref.object.sha === sha;
}

module.exports = { resolveTarget, isCurrent };
