const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require("@octokit/rest");
const { reportError } = require('./lib/common');

const octokit = new github.getOctokit(process.env.GITHUB_TOKEN);

async function run() {
  try {
    let { context } = github;
    let capabilityRepoName = core.getInput('repository_name', {required: true, trimWhitespace: true});
    let adminToken = core.getInput('admin_token', {required: true, trimWhitespace: true});
    let user = core.getInput('user', {required: true, trimWhitespace: true})

    const adminOctokit = new Octokit({
      auth: adminToken
    });

    let org = context.payload.organization.login;

    // Create org repo
    core.debug(`Creating capability repo: ${capabilityRepoName}...`);

    const { data: capabilityRepositoryObj } = await adminOctokit.repos.createInOrg({
      org: org,
      name: capabilityRepoName,
      description: `Capability repository for ${capabilityRepoName}`,
      auto_init: false,
      visibility: 'internal',
      mediaType: {
        previews: ['nebula-preview']
      }
    });

    console.log(`Created capability repo: ${capabilityRepositoryObj.name}`);

    // Assign creator as admin
    core.debug(`Assigning user ${user} as admin to repo: ${capabilityRepoName}...`);
    await adminOctokit.repos.addCollaborator({
      owner: org,
      repo: capabilityRepoName,
      username: user,
      permission: 'admin'
    })
    console.log(`Added user ${user} as admin to repo: ${capabilityRepoName}`);

    // Provide the repository name as output
    core.setOutput('repository_name', capabilityRepoName);

  } catch (error) {
    await reportError(github, core, octokit, error.message);
  }
}

run();
