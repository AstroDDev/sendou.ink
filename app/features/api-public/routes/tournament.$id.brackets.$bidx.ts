import type { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
import { tournamentFromDB } from "~/features/tournament-bracket/core/Tournament.server";
import { notFoundIfFalsy, parseParams } from "~/utils/remix";
import { id } from "~/utils/zod";
import { requireBearerAuth } from "../api-public-utils.server";
import type { GetTournamentBracketResponse } from "../schema";

const paramsSchema = z.object({
  id,
  bidx: z.coerce.number().int(),
});

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  requireBearerAuth(request);

  const { id, bidx } = parseParams({ params, schema: paramsSchema });

  const tournament = await tournamentFromDB({
    user: undefined,
    tournamentId: id,
  });

  const bracket = notFoundIfFalsy(tournament.bracketByIdx(bidx));

  const result: GetTournamentBracketResponse = {
    data: bracket.data,
    meta: {
      teamsPerGroup:
        bracket.type === "round_robin"
          ? tournament.ctx.settings.teamsPerGroup
          : undefined,
      groupCount:
        bracket.type === "swiss"
          ? tournament.ctx.settings.swiss?.groupCount
          : undefined,
      roundCount:
        bracket.type === "swiss"
          ? tournament.ctx.settings.swiss?.roundCount
          : undefined,
    },
  };

  return result;
};