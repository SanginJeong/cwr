import type { Meta, StoryObj } from "@storybook/react";
import TeamSection from "./TeamSection";

const meta: Meta<typeof TeamSection> = {
  title: "Page/Landing/TeamSection",
  component: TeamSection,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
