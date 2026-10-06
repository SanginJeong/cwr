import { Meta, StoryObj } from "@storybook/nextjs";
import SidebarDropdown from "./SidebarDropdown";

const meta: Meta<typeof SidebarDropdown> = {
  title: "Common/Sidebar/_internal/Tablet/SidebarDropdown",
  component: SidebarDropdown,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[300px] shadow-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockTeams = [
  { id: 101, name: "CodeIt" },
  { id: 102, name: "디자인팀" },
];

export const Default: Story = {
  args: {
    isOpen: true,
    teams: mockTeams,
  },
};
