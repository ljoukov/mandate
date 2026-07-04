import { json } from '@sveltejs/kit';
import { createPostResponse, createActionHeaders, MEMO_PROGRAM_ID } from '@solana/actions';
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

const ACTION_HEADERS = createActionHeaders({ chainId: 'solana:devnet', actionVersion: '2.4' });
const RECEIPT_HASH = 'receipt:kaspa:testnet:mandate-run-42';

export const OPTIONS = () => new Response(null, { headers: ACTION_HEADERS });

export const GET = () =>
  json(
    {
      icon: 'https://www.aiagentslab.uk/favicon.ico',
      title: 'Mandate Receipt Signer',
      description:
        'Sign a hash-only Mandate receipt after enterprise authority gates have passed. No evidence or secrets are put on-chain.',
      label: 'Sign Mandate receipt',
      links: {
        actions: [
          {
            label: 'Sign receipt hash',
            href: '/api/solana/action/mandate-receipt'
          }
        ]
      }
    },
    { headers: ACTION_HEADERS }
  );

export const POST = async ({ request }) => {
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
          type: 'mandate.receipt.signature',
          runId: 'mandate-run-42',
          capability: 'merge.money.pricing',
          receiptHash: RECEIPT_HASH
        })
      )
    })
  );

  const payload = await createPostResponse({
    fields: {
      type: 'transaction',
      transaction,
      message:
        'Mandate controls the action. This Solana Action signs only the receipt hash after policy passes.'
    }
  });

  return json(payload, { headers: ACTION_HEADERS });
};
