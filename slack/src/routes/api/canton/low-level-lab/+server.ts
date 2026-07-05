import { json } from '@sveltejs/kit';
import { buildCantonLowLevelWorkflow } from '$lib/server/cantonWorkflows';

type CantonWorkflowRequest = {
  partyIdHint?: unknown;
  receiverPartyId?: unknown;
  transferAmount?: unknown;
};

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export const GET = () => json(buildCantonLowLevelWorkflow());

export async function POST({ request }) {
  const body = (await request.json().catch(() => ({}))) as CantonWorkflowRequest;
  return json(
    buildCantonLowLevelWorkflow({
      partyIdHint: optionalString(body.partyIdHint),
      receiverPartyId: optionalString(body.receiverPartyId),
      transferAmount: optionalString(body.transferAmount)
    })
  );
}
