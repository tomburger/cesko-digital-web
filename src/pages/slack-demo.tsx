import React from 'react'

import { Layout, Section, SectionContent } from 'components/layout'

const SlackDemo: React.FC = () => (
  <Layout seo={{ title: 'Slack Connect Demo' }}>
    <Section>
      <SectionContent>
        <h1>Slack Connect Demo</h1>
        <a href="https://slack.com/openid/connect/authorize?scope=openid%20email%20profile&amp;response_type=code&amp;redirect_uri=http%3A%2F%2Flocalhost%2Fapi%2FslackLogin&amp;client_id=546065518279.2597822541815">
          Sign in with Slack
        </a>
      </SectionContent>
    </Section>
  </Layout>
)

export default SlackDemo
