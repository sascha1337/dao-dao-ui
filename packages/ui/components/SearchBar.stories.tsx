import { ComponentMeta, ComponentStory } from '@storybook/react'

import { SearchBar } from './SearchBar'

export default {
  title: 'DAO DAO / packages / ui / components / SearchBar',
  component: SearchBar,
} as ComponentMeta<typeof SearchBar>

const Template: ComponentStory<typeof SearchBar> = (args) => (
  <SearchBar {...args} />
)

export const Default = Template.bind({})
Default.args = {}

export const Ghost = Template.bind({})
Ghost.args = {
  ghost: true,
}