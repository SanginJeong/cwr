import { Meta, StoryObj } from "@storybook/nextjs";
import DeleteTaskModal from "./DeleteTaskModal";

const meta: Meta<typeof DeleteTaskModal> = {
  title: "Features/Task/DeleteTaskModal",
  component: DeleteTaskModal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    isOpen: true,
    taskName: "데일리 스탠드업",
    onClose: () => {},
    onConfirm: () => {},
  },
  decorators: [
    (Story) => (
      <div className="h-[50vh]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PageEmptyStateStory: Story = {};
