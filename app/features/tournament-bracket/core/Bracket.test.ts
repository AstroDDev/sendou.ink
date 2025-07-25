import * as R from "remeda";
import { describe, expect, it } from "vitest";
import invariant from "../../../utils/invariant";
import * as Swiss from "../core/Swiss";
import { Tournament } from "./Tournament";
import { PADDLING_POOL_255 } from "./tests/mocks";
import { LOW_INK_DECEMBER_2024 } from "./tests/mocks-li";
import { testTournament } from "./tests/test-utils";

const TEAM_ERROR_404_ID = 17354;
const TEAM_THIS_IS_FINE_ID = 17513;

describe("swiss standings - losses against tied", () => {
	it("should calculate losses against tied", () => {
		const tournament = new Tournament({
			...LOW_INK_DECEMBER_2024(),
			simulateBrackets: false,
		});

		const standing = tournament
			.bracketByIdx(0)
			?.currentStandings(false)
			.find((standing) => standing.team.id === TEAM_THIS_IS_FINE_ID);

		invariant(standing, "Standing not found");

		expect(standing.stats?.lossesAgainstTied).toBe(1);
	});

	it("should ignore early dropped out teams for standings (losses against tied)", () => {
		const tournament = new Tournament({
			...LOW_INK_DECEMBER_2024(),
			simulateBrackets: false,
		});

		const standing = tournament
			.bracketByIdx(0)
			?.currentStandings(false)
			.find((standing) => standing.team.id === TEAM_ERROR_404_ID);
		invariant(standing, "Standing not found");

		expect(standing.stats?.lossesAgainstTied).toBe(0); // they lost against "Tidy Tidings" but that team dropped out before final round
	});

	const inProgressSwissTestTournament = () => {
		const data = Swiss.create({
			tournamentId: 1,
			name: "Swiss",
			seeding: [1, 2, 3],
			settings: {
				swiss: {
					groupCount: 1,
					roundCount: 5,
				},
			},
		});

		// needed to make it "not preview"
		data.round = data.round.map((r) => ({
			...r,
			maps: { count: 3, type: "BEST_OF" },
		}));

		return testTournament({
			ctx: {
				settings: {
					bracketProgression: [
						{
							type: "swiss",
							name: "Swiss",
							requiresCheckIn: false,
							settings: {},
							sources: [],
						},
					],
				},
			},
			data,
		});
	};

	it("should handle a team with only one bye", () => {
		const tournament = inProgressSwissTestTournament();

		const standings = tournament.bracketByIdx(0)!.currentStandings(true);

		const teamWithBye = standings.find((standing) => standing.team.id === 3);

		expect(teamWithBye?.stats?.opponentMapWinPercentage).toBe(0);
		expect(teamWithBye?.stats?.opponentSetWinPercentage).toBe(0);
		expect(teamWithBye?.stats?.setWins).toBe(1);
		expect(teamWithBye?.stats?.setLosses).toBe(0);
		expect(teamWithBye?.stats?.mapWins).toBe(2);
		expect(teamWithBye?.stats?.setLosses).toBe(0);
	});

	it("team with only unfinished matches should not be in the current standings", () => {
		const tournament = inProgressSwissTestTournament();

		const standings = tournament.bracketByIdx(0)!.currentStandings(true);

		const playingTeam = standings.find((standing) => standing.team.id === 1);

		expect(playingTeam).toBe(undefined);
	});
});

describe("round robin standings", () => {
	it("should sort teams primarily by set wins (per group) in paddling pool 255", () => {
		const tournamentPP255 = new Tournament(PADDLING_POOL_255());

		const standings = tournamentPP255.bracketByIdx(0)!.standings;

		const groupIds = R.unique(standings.map((standing) => standing.groupId));
		expect(
			groupIds.length,
			"Paddling Pool 255 should have groups from Group A to Group I",
		).toBe(9);

		for (const groupId of groupIds) {
			const groupStandings = standings.filter(
				(standing) => standing.groupId === groupId,
			);

			for (let i = 0; i < groupStandings.length; i++) {
				const current = groupStandings[i];
				const next = groupStandings[i + 1];

				if (!next) {
					break;
				}

				expect(
					current.stats!.setWins,
					`Team with ID ${current.team.id} in wrong spot relative to ${next.team.id}`,
				).toBeGreaterThanOrEqual(next.stats!.setWins);
			}
		}
	});

	it("has ascending order from lower group id to higher group id for same placements", () => {
		const tournamentPP255 = new Tournament(PADDLING_POOL_255());

		const standings = tournamentPP255.bracketByIdx(0)!.standings;

		const placements = R.unique(
			standings.map((standing) => standing.placement),
		).sort((a, b) => a - b);

		for (const placement of placements) {
			const placementStandings = standings.filter(
				(standing) => standing.placement === placement,
			);

			for (let i = 0; i < placementStandings.length; i++) {
				const current = placementStandings[i];
				const next = placementStandings[i + 1];

				if (!next) {
					break;
				}

				expect(
					current.groupId,
					`Team with ID ${current.team.id} in wrong spot relative to ${next.team.id}`,
				).toBeLessThan(next.groupId!);
			}
		}
	});
});
