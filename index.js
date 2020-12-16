/**
 * This is the main entrypoint to your Probot app
 * @param { {app: import('probot').Application} } app
 */
module.exports = ({ app }) =>  {
  app.log.info(`Everyone.app has launched in the ${process.env.NODE_ENV } environment`)
  let per_page = 100
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'ci') {
    per_page = 5
  } 

  app.on(['installation.created', 'installation.unsuspend'], async context => {
    const org = context.payload.installation.account.login
    
    context.log.debug({
      event: context.name,
      action: context.payload.action,
      org: org
    })

    return createTeam(context, org, 'everyone').then( ({data: team}) => {
      context.log.debug({
        team: team
      })
      return populateTeam(context, org, team, 1, per_page)
    }).catch(error => {
      context.log.error({
        org: org,
        message: error.message
      })
    })
  })

  app.on('organization.member_added', async context => {
    const org = context.payload.organization.login
    const member = context.payload.membership.user

    context.log.debug({
      event: context.name,
      action: context.payload.action,
      org: org,
      member: member.login
    })

    context.octokit.teams.addOrUpdateMembershipForUserInOrg({
      org: org,
      team_slug: 'everyone',
      username: member.login
    })
  })
}



async function createTeam(context, org, name) {
  return context.octokit.teams.create({
    org: org,
    name: name
  })
}

async function populateTeam(context, org, team, page = 1, per_page = 100) {
  const {data: members} = await context.octokit.orgs.listMembers({
    org: org, 
    per_page: per_page,
    page: page
  })
  
  context.log.debug({
    org: org, 
    team: team, 
    page: page, 
    per_page: per_page,
    members: members
  })

  if (members.length == per_page) {
    populateTeam(context, org, team, page+1, per_page)
  }

  for (const member of members) {
    context.octokit.teams.addOrUpdateMembershipForUserInOrg({
      org: org,
      team_slug: team.slug,
      username: member.login
    })
  } 
}
