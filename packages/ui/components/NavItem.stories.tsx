import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Pie } from '@dao-dao/icons'

import { NavItem } from './NavItem'

export default {
  title: '(OLD DAO DAO) / components / NavItem',
  component: NavItem,
} as ComponentMeta<typeof NavItem>

const Template: ComponentStory<typeof NavItem> = (args) => <NavItem {...args} />

export const Default = Template.bind({})
Default.args = {
  item: {
    renderIcon: (mobile) => (
      <Pie height={mobile ? 16 : 14} width={mobile ? 16 : 14} />
    ),
    label: 'Stake',
    href: '/',
    active: false,
    external: false,
  },
}