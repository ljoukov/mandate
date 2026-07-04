import { json } from '@sveltejs/kit';
import { buildPublicFundingAgentEconomyWorkflow } from '$lib/server/publicFundingWorkflows';

type BountyFlowRequest = {
  budgetGbp?: unknown;
};

function parseBudget(value: unknown) {
  const budget = Number(value);
  return Number.isFinite(budget) && budget > 0 ? Math.round(budget) : undefined;
}

export const GET = () => json(buildPublicFundingAgentEconomyWorkflow());

export async function POST({ request }) {
  const body = (await request.json().catch(() => ({}))) as BountyFlowRequest;
  return json(buildPublicFundingAgentEconomyWorkflow({ budgetGbp: parseBudget(body.budgetGbp) }));
}
