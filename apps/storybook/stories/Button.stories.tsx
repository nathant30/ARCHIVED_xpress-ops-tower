import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@xpress-ops/ui';
import { Plus, Download, Settings } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component supporting various variants, sizes, and states. All styles use CSS variables from the design token system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button',
    },
    density: {
      control: 'select',
      options: ['compact', 'comfortable'],
      description: 'Padding density - affects vertical spacing',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes the button take full width of container',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic button variants
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    children: 'Tertiary Button',
  },
};

// Semantic variants
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete Item',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Confirm Action',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Proceed with Caution',
  },
};

// Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button leftIcon={<Plus className="h-4 w-4" />}>Add Item</Button>
        <Button variant="secondary" rightIcon={<Download className="h-4 w-4" />}>
          Download
        </Button>
      </div>
      <div className="flex gap-4">
        <Button variant="tertiary" leftIcon={<Settings className="h-4 w-4" />}>
          Settings
        </Button>
      </div>
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button>Default</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex gap-4">
        <Button variant="secondary">Hover me</Button>
        <Button variant="secondary" className="focus:ring-2">Focus me (Tab)</Button>
        <Button variant="secondary" className="active:bg-opacity-80">Press me</Button>
      </div>
    </div>
  ),
};

// Density variants
export const Density: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button density="compact">Compact</Button>
      <Button density="comfortable">Comfortable</Button>
    </div>
  ),
};

// Full width
export const FullWidth: Story = {
  render: () => (
    <div className="w-64">
      <Button fullWidth>Full Width Button</Button>
    </div>
  ),
};

// Interactive example
export const Interactive: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Click Me',
    onClick: () => alert('Button clicked!'),
  },
};