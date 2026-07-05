import { json } from '@sveltejs/kit';
import { createActionHeaders, createPostResponse, MEMO_PROGRAM_ID } from '@solana/actions';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { buildPublicFundingVerifierProcurementWorkflow } from '$lib/server/publicFundingWorkflows';

const ACTION_HEADERS = createActionHeaders({ chainId: 'solana:devnet', actionVersion: '2.4' });

export const OPTIONS = () => new Response(null, { headers: ACTION_HEADERS });

export const GET = () => {
  const workflow = buildPublicFundingVerifierProcurementWorkflow();

  return json(
    {
      icon: 'https://www.aiagentslab.uk/favicon.ico',
      title: 'Mandate Public Funding Release',
      description:
        'Sign a hash-only Solana devnet settlement receipt for the selected public-funding verifier after Mandate gates pass.',
      label: 'Sign funding release',
      disabled: false,
      links: {
        actions: [
          {
            label: `Release ${workflow.verifierProcurement.escrow.amountLamports} lamports`,
            href: '/api/solana/action/public-funding-release'
          }
        ]
      },
      mandate: {
        publicBody: workflow.publicBody,
        allocationHash: workflow.gcc.allocationHash,
        escrowReference: workflow.verifierProcurement.escrow.reference,
        releaseCapability: workflow.verifierProcurement.escrow.releaseCapability
      }
    },
    { headers: ACTION_HEADERS }
  );
};

export const POST = async ({ request }) => {
  const workflow = buildPublicFundingVerifierProcurementWorkflow();
  const body = await request.json().catch(() => ({}));
  const account = new PublicKey(String(body.account ?? '11111111111111111111111111111111'));
  const transaction = new Transaction();

  transaction.feePayer = account;
  transaction.recentBlockhash = '11111111111111111111111111111111';
  transaction.add(
    new TransactionInstruction({
      keys: [],
      programId: new PublicKey(MEMO_PROGRAM_ID),
      data: Buffer.from(
        JSON.stringify({
          type: 'mandate.public_funding.verifier_release',
          publicBody: workflow.publicBody,
          allocationHash: workflow.gcc.allocationHash,
          escrowReference: workflow.verifierProcurement.escrow.reference,
          amountLamports: workflow.verifierProcurement.escrow.amountLamports,
          capability: workflow.verifierProcurement.escrow.releaseCapability
        })
      )
    })
  );

  const payload = await createPostResponse({
    fields: {
      type: 'transaction',
      transaction,
      message:
        'Mandate controls the public-funding decision. This Solana Action signs only the release receipt hash after verifier gates pass.'
    }
  });

  return json(payload, { headers: ACTION_HEADERS });
};
