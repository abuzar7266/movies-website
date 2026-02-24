import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import LoginRequiredDialog from "@components/auth/LoginRequiredDialog";
import React from "react";

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + (loc.search || "")}</div>;
}

describe("LoginRequiredDialog redirect", () => {
  it("navigates to login with redirect to current page", async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <LoginRequiredDialog open={open} onOpenChange={setOpen} message="Please log in to continue." />
          <LocationProbe />
        </>
      );
    }
    render(
      <MemoryRouter initialEntries={["/movie/abc?x=1"]}>
        <Wrapper />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /go to login/i }));

    expect(screen.getByTestId("loc").textContent).toMatch(/^\/login\?redirect=/i);
    expect(decodeURIComponent(screen.getByTestId("loc").textContent || "")).toContain("/movie/abc?x=1");
  });
});

