const nock = require('nock')

// Requiring our app implementation
const myProbotApp = require('..')
const { Probot, ProbotOctokit } = require('probot')

const fs = require('fs')
const path = require('path')

// Requiring our fixtures
const installationUnsuspendPayload = require('./fixtures/installation.unsuspend')
const organizationMemberAddedPayload = require('./fixtures/organization.member_added')
const orgMemberPages = [
  require('./fixtures/org.members.1'),
  require('./fixtures/org.members.2'),
  require('./fixtures/org.members.3')
]
const teamCreation = {
  name: 'everyone'
}
const teamCreated = {
  slug: 'everyone'
}

const privateKey = fs.readFileSync(
  path.join(__dirname, 'fixtures/mock-cert.pem'),
  'utf-8'
)

describe('My Probot app', () => {
  let probot

  beforeEach(() => {
    nock.disableNetConnect()
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    })
    // Load our app into probot
    probot.load(myProbotApp)
  })

  test('creates a team when the app is installed', async () => {
    nock('https://api.github.com')
      // Test that we correctly return a test token
      .post('/app/installations/2/access_tokens')
      .reply(200, {
        token: 'test',
        permissions: {
          members: 'write'
        },
      })

    // Test that a team is created
    const createTeamMock = nock('https://api.github.com')
      .post('/orgs/myorg/teams', (body) => {
        expect(body).toMatchObject(teamCreation)
        return true
      })
      .reply(200, teamCreated)

    // Test that org members are retrieved
    let listOrgMembersMock = nock('https://api.github.com')
    for (let orgMemberPageCount = 0; orgMemberPageCount < orgMemberPages.length; orgMemberPageCount++) {
      listOrgMembersMock
        .get(`/orgs/myorg/members?per_page=5&page=${orgMemberPageCount+1}`)
        .reply(200, orgMemberPages[orgMemberPageCount])
    }
    
    // Test that members are being added to the team
    let addMembersToTeamMock = nock('https://api.github.com')
    for (let userCount = 0; userCount < 12; userCount++) {
      addMembersToTeamMock.put(`/orgs/myorg/teams/everyone/memberships/user${userCount}`)
        .reply(200, {
          'url': `https://api.github.com/teams/1/memberships/user${userCount}`,
          'role': 'member',
          'state': 'active'
        })
    }
      
    await probot.receive({ name: 'installation', payload: installationUnsuspendPayload })
    
    // The team is created
    expect(createTeamMock.pendingMocks()).toStrictEqual([])
    // We got all the members - need to wait a bit for all the promises to be completed
    setTimeout(() => {
      expect(listOrgMembersMock.pendingMocks()).toStrictEqual([])
      expect(addMembersToTeamMock.pendingMocks()).toStrictEqual([])
    }, 5000)
  })

  test('add a new org member to the team', async () => {
    nock('https://api.github.com')
      // Test that we correctly return a test token
      .post('/app/installations/2/access_tokens')
      .reply(200, {
        token: 'test',
        permissions: {
          members: 'write'
        },
      })
    
    // Test members are being added to the team
    const addMemberToTeamMock = nock('https://api.github.com')
      .put(`/orgs/myorg/teams/everyone/memberships/user12`)
      .reply(200, {
        'url': `https://api.github.com/teams/1/memberships/user12`,
        'role': 'member',
        'state': 'active'
      })

    await probot.receive({ name: 'organization', payload: organizationMemberAddedPayload })
    
    setTimeout(() => {
      expect(addMemberToTeamMock.pendingMocks()).toStrictEqual([])
    }, 5000)
    
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})
