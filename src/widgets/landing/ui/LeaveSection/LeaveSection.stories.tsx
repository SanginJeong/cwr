import type { Meta, StoryObj } from "@storybook/react";
import LeaveSection from "./LeaveSection";

const meta: Meta<typeof LeaveSection> = {
  title: "Page/Landing/LeaveSection",
  component: LeaveSection,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
