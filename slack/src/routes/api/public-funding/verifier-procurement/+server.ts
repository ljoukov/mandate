import { json } from '@sveltejs/kit';
import { buildPublicFundingVerifierProcurementWorkflow } from '$lib/server/publicFundingWorkflows';

type VerifierProcurementRequest = {
  budgetGbp?: unknown;
};

function parseBudget(value: unknown) {
  const budget = Number(value);
  return Number.isFinite(budget) && budget > 0 ? Math.round(budget) : undefined;
}

export const GET = () => json(buildPublicFundingVerifierProcurementWorkflow());

export async function POST({ request }) {
  const body = (await request.json().catch(() => ({}))) as VerifierProcurementRequest;
  return json(buildPublicFundingVerifierProcurementWorkflow({ budgetGbp: parseBudget(body.budgetGbp) }));
}
