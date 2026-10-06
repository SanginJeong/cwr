import type { Meta, StoryObj } from "@storybook/nextjs";
import MobileMenuItem from "./MobileMenuItem";

const meta: Meta<typeof MobileMenuItem> = {
  title: "Common/Sidebar/_internal/Mobile/MobileMenuItem",
  component: MobileMenuItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockTeam = { id: 101, name: "CodeIt" };

export const Open: Story = {
  args: {
    team: mockTeam,
    isOpen: true,
  },
  decorators: [
    (Story) => (
      <div className="w-[238px]">
        <Story />
      </div>
    ),
  ],
};

export const Close: Story = {
  args: {
    team: mockTeam,
    isOpen: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[52px]">
        <Story />
      </div>
    ),
  ],
};
