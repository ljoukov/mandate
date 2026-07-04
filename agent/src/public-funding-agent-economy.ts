import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createActionHeaders, encodeURL } from '@solana/actions';
import { buildPublicFundingAgentEconomyWorkflow } from '../../slack/src/lib/server/publicFundingWorkflows.ts';

const require = createRequire(import.meta.url);
const { SchemaEncoder } = require('@ethereum-attestation-service/eas-sdk') as {
  SchemaEncoder: new (schema: string) => {
    encodeData: (
      data: Array<{ name: string; value: string | number | bigint; type: string }>
    ) => string;
  };
};

type PublicFundingAgentEconomyOutput = ReturnType<typeof buildPublicFundingAgentEconomyWorkflow> & {
  gccAttestation: {
    sdk: '@ethereum-attestation-service/eas-sdk';
    schema: string;
    encodedData: string;
    fields: Record<string, string | number>;
  };
  solanaAction: {
    sdk: '@solana/actions';
    actionUrl: string;
    headers: Record<string, string>;
    metadata: {
      title: string;
      label: string;
      description: string;
      escrowReference: string;
      amountLamports: number;
    };
  };
  mandatePolicyCheck: {
    allocationCapability: string;
    paymentCapability: string;
    secretExposedToModel: false;
    finalDecisionPath: 'deterministic';
  };
};

function sha256Hex(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function bytes32(value: unknown) {
  return `0x${sha256Hex(value)}`;
}

function buildOutput(): PublicFundingAgentEconomyOutput {
  const workflow = buildPublicFundingAgentEconomyWorkflow();
  const fundedCount = workflow.gcc.decisions.filter((decision) => decision.status === 'fund').length;
  const schema =
    'bytes32 rubricHash,bytes32 allocationHash,string publicBody,uint64 budgetGbp,uint64 fundedCount,string decision';
  const encoder = new SchemaEncoder(schema);
  const fields = {
    rubricHash: bytes32(workflow.gcc.rubric.map(({ id, weight }) => ({ id, weight }))),
    allocationHash: workflow.gcc.allocationHash.replace('sha256:', '0x'),
    publicBody: workflow.publicBody,
    budgetGbp: workflow.budgetGbp,
    fundedCount,
    decision: 'fund_top_ranked_with_milestone_gates'
  };
  const encodedData = encoder.encodeData([
    { name: 'rubricHash', type: 'bytes32', value: fields.rubricHash },
    { name: 'allocationHash', type: 'bytes32', value: fields.allocationHash },
    { name: 'publicBody', type: 'string', value: fields.publicBody },
    { name: 'budgetGbp', type: 'uint64', value: BigInt(fields.budgetGbp) },
    { name: 'fundedCount', type: 'uint64', value: BigInt(fields.fundedCount) },
    { name: 'decision', type: 'string', value: fields.decision }
  ]);
  const actionEndpoint = 'http://127.0.0.1:5173/api/solana/action/public-funding-release';
  const actionUrl = encodeURL({ link: new URL(actionEndpoint) }).toString();

  return {
    ...workflow,
    gccAttestation: {
      sdk: '@ethereum-attestation-service/eas-sdk',
      schema,
      encodedData,
      fields
    },
    solanaAction: {
      sdk: '@solana/actions',
      actionUrl,
      headers: createActionHeaders({ chainId: 'solana:devnet', actionVersion: '2.4' }),
      metadata: {
        title: 'Mandate public funding verifier release',
        label: 'Sign funding release',
        description:
          'Hash-only Solana devnet receipt for a paid verifier-agent release after Mandate policy passes.',
        escrowReference: workflow.coralStuk.escrow.reference,
        amountLamports: workflow.coralStuk.escrow.amountLamports
      }
    },
    mandatePolicyCheck: {
      allocationCapability: 'allocate.public_funding',
      paymentCapability: workflow.coralStuk.escrow.releaseCapability,
      secretExposedToModel: false,
      finalDecisionPath: 'deterministic'
    }
  };
}

function main(): void {
  const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const outputPath = path.join(agentRoot, 'output', 'public-funding-agent-economy.json');
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(buildOutput(), null, 2)}\n`);
  console.log(`Public funding agent economy artifact written: ${outputPath}`);
}

main();
