import type { Meta, StoryObj } from "@storybook/react";
import AttendanceSection from "./AttendanceSection";

const meta: Meta<typeof AttendanceSection> = {
  title: "Page/Landing/AttendanceSection",
  component: AttendanceSection,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
