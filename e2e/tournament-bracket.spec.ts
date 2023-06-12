import { type Page, test, expect } from "@playwright/test";
import { NZAP_TEST_ID } from "~/db/seed/constants";
import { impersonate, navigate, seed, submit } from "~/utils/playwright";
import { tournamentBracketsPage } from "~/utils/urls";

const startBracket = async (page: Page, tournamentId = 2) => {
  await seed(page);
  await impersonate(page);

  await navigate({
    page,
    url: tournamentBracketsPage(tournamentId),
  });

  await page.getByTestId("finalize-bracket-button").click();
};

const reportResult = async (
  page: Page,
  amountOfMapsToReport: 1 | 2,
  sidesWithMoreThanFourPlayers: ("first" | "last")[] = ["last"],
  winner: 1 | 2 = 1
) => {
  if (sidesWithMoreThanFourPlayers.includes("first")) {
    await page.getByTestId("player-checkbox-0").first().click();
    await page.getByTestId("player-checkbox-1").first().click();
    await page.getByTestId("player-checkbox-2").first().click();
    await page.getByTestId("player-checkbox-3").first().click();
  }
  if (sidesWithMoreThanFourPlayers.includes("last")) {
    await page.getByTestId("player-checkbox-0").last().click();
    await page.getByTestId("player-checkbox-1").last().click();
    await page.getByTestId("player-checkbox-2").last().click();
    await page.getByTestId("player-checkbox-3").last().click();
  }

  await page.getByTestId(`winner-radio-${winner}`).click();
  await page.getByTestId("report-score-button").click();
  await expect(page.getByText(winner === 1 ? "1-0" : "0-1")).toBeVisible();

  if (amountOfMapsToReport === 2) {
    await page.getByTestId(`winner-radio-${winner}`).click();
    await page.getByTestId("report-score-button").click();

    await expect(page.getByTestId("report-timestamp")).toBeVisible();
  }
};

const backToBracket = (page: Page) =>
  page.getByTestId("back-to-bracket-button").click();

const expectScore = (page: Page, score: [number, number]) =>
  expect(page.getByText(score.join("-"))).toBeVisible();

// 1) Report winner of N-ZAP's first match
// 2) Report winner of the adjacent match by using admin powers
// 3) Report one match on the only losers side match available
// 4) Try to reopen N-ZAP's first match and fail
// 5) Undo score of first losers match
// 6) Try to reopen N-ZAP's first match and succeed
// 7) As N-ZAP, undo all scores and switch to different team sweeping
test.describe("Tournament bracket", () => {
  test("reports score and sees bracket update", async ({ page }) => {
    const tournamentId = 2;
    await startBracket(page);

    await impersonate(page, NZAP_TEST_ID);
    await navigate({
      page,
      url: tournamentBracketsPage(tournamentId),
    });

    // 1)
    await page.locator('[data-match-id="5"]').click();
    await reportResult(page, tournamentId);
    await backToBracket(page);

    // 2)
    await impersonate(page);
    await navigate({
      page,
      url: tournamentBracketsPage(tournamentId),
    });
    await page.locator('[data-match-id="6"]').click();
    await reportResult(page, 2);
    await backToBracket(page);

    // 3)
    await page.locator('[data-match-id="18"]').click();
    await reportResult(page, 1, ["first", "last"]);
    await backToBracket(page);

    // 4)
    await page.locator('[data-match-id="5"]').click();
    await page.getByTestId("reopen-match-button").click();
    await expect(page.getByTestId("match-is-locked-button")).toBeVisible();
    await backToBracket(page);

    // 5)
    await page.locator('[data-match-id="18"]').click();
    await page.getByTestId("undo-score-button").click();
    await expectScore(page, [0, 0]);
    await backToBracket(page);

    // 6)
    await page.locator('[data-match-id="5"]').click();
    await page.getByTestId("reopen-match-button").click();
    await expectScore(page, [1, 0]);

    // 7)
    await impersonate(page, 2);
    await navigate({
      page,
      url: tournamentBracketsPage(tournamentId),
    });
    await page.locator('[data-match-id="5"]').click();
    await page.getByTestId("undo-score-button").click();
    await expectScore(page, [0, 0]);
    await reportResult(page, 2, ["last"], 2);
    await backToBracket(page);
    await expect(
      page.locator("[data-round-id='5'] [data-participant-id='102']")
    ).toBeVisible();
  });

  test("adds a sub mid tournament (from non checked in team)", async ({
    page,
  }) => {
    const tournamentId = 1;
    await startBracket(page, tournamentId);

    // captain of the first team
    await impersonate(page, 5);
    await navigate({
      page,
      url: tournamentBracketsPage(tournamentId),
    });

    await page.getByTestId("add-sub-button").click();
    await page.getByTestId("copy-invite-link-button").click();

    const inviteLinkProd: string = await page.evaluate(
      "navigator.clipboard.readText()"
    );
    const inviteLink = inviteLinkProd.replace(
      "https://sendou.ink",
      "http://localhost:5800"
    );

    await impersonate(page, NZAP_TEST_ID);
    await navigate({
      page,
      url: inviteLink,
    });

    await submit(page);
    await expect(page).toHaveURL(/brackets/);
  });
});