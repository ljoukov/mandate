import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCantonLowLevelWorkflow } from '../../slack/src/lib/server/cantonWorkflows.ts';

type CantonLowLevelArtifact = ReturnType<typeof buildCantonLowLevelWorkflow> & {
  mandatePolicyCheck: {
    partyAllocationCapability: string;
    preApprovalCapability: string;
    balanceReadCapability: string;
    transferCapability: string;
    finalDecisionPath: 'deterministic';
    modelVisiblePrivateKeys: false;
  };
};

function buildOutput(): CantonLowLevelArtifact {
  const workflow = buildCantonLowLevelWorkflow();
  return {
    ...workflow,
    mandatePolicyCheck: {
      partyAllocationCapability: workflow.party.capability,
      preApprovalCapability: workflow.preApproval.capability,
      balanceReadCapability: workflow.coinBalance.capability,
      transferCapability: workflow.tokenTransfer.capability,
      finalDecisionPath: 'deterministic',
      modelVisiblePrivateKeys: false
    }
  };
}

function main(): void {
  const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const outputPath = path.join(agentRoot, 'output', 'canton-low-level-lab.json');
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(buildOutput(), null, 2)}\n`);
  console.log(`Canton low-level lab artifact written: ${outputPath}`);
}

main();
