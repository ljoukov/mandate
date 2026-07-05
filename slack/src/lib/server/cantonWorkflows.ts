import { createHash } from 'node:crypto';

export type CantonLedgerStep = {
  state: string;
  actor: string;
  action: string;
  api: 'Validator Admin API' | 'Ledger API JSON' | 'Ledger API ACS';
  receiptHash: string;
};

export type CantonLowLevelWorkflow = {
  generatedAt: string;
  network: {
    synchronizer: string;
    validator: string;
    custody: 'internal';
  };
  party: {
    partyIdHint: string;
    allocatedPartyId: string;
    participantId: string;
    capability: 'canton.party.allocate';
  };
  preApproval: {
    templateId: string;
    contractId: string;
    providerPartyId: string;
    receiverPartyId: string;
    capability: 'canton.preapproval.create';
  };
  coinBalance: {
    ownerPartyId: string;
    tokenSymbol: 'CC';
    amount: string;
    acsQueryHash: string;
    capability: 'canton.coin.balance.read';
  };
  tokenTransfer: {
    senderPartyId: string;
    receiverPartyId: string;
    amount: string;
    commandId: string;
    deduplicationOffset: string;
    capability: 'canton.token.transfer';
  };
  lowLevelRequests: {
    allocateParty: Record<string, unknown>;
    createPreApproval: Record<string, unknown>;
    queryCoinAcs: Record<string, unknown>;
    tokenStandardTransfer: Record<string, unknown>;
  };
  ledger: CantonLedgerStep[];
};

export type CantonWorkflowOptions = {
  partyIdHint?: string;
  receiverPartyId?: string;
  transferAmount?: string;
};

function hashJson(value: unknown) {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function partyFromHint(hint: string) {
  return `${hint}::1220mandatec8devnetvalidator`;
}

function contractIdFor(...values: string[]) {
  return `00${createHash('sha256').update(values.join(':')).digest('hex').slice(0, 62)}`;
}

export function buildCantonLowLevelWorkflow(options: CantonWorkflowOptions = {}): CantonLowLevelWorkflow {
  const partyIdHint = options.partyIdHint ?? 'mandate-verifier-treasury';
  const allocatedPartyId = partyFromHint(partyIdHint);
  const receiverPartyId =
    options.receiverPartyId ?? 'civic-milestone-verifier::1220receiverdevnetvalidator';
  const transferAmount = options.transferAmount ?? '12.5000000000';
  const participantId = 'c8-devnet-participant';
  const validator = 'c8-devnet-validator';
  const synchronizer = 'canton-devnet';
  const providerPartyId = 'c8-transfer-preapproval-provider::1220c8devnet';
  const preApprovalContractId = contractIdFor(allocatedPartyId, providerPartyId, receiverPartyId);
  const commandId = `mandate-canton-transfer-${createHash('sha256')
    .update(`${allocatedPartyId}:${receiverPartyId}:${transferAmount}`)
    .digest('hex')
    .slice(0, 12)}`;

  const allocateParty = {
    service: 'com.digitalasset.canton.admin.party.v30.PartyManagementService',
    method: 'AllocateParty',
    validator,
    payload: {
      partyIdHint,
      participantId,
      localMetadata: {
        annotations: {
          'mandate.authority.layer': 'permissioned_ledger.party_management',
          'mandate.custody': 'internal',
          'mandate.request': 'public-funding-verifier-payment'
        }
      }
    }
  };

  const createPreApproval = {
    service: 'com.daml.ledger.api.v2.CommandService',
    method: 'SubmitAndWait',
    api: 'JSON Ledger API command envelope',
    payload: {
      actAs: [allocatedPartyId],
      commandId: `mandate-preapproval-${preApprovalContractId.slice(2, 14)}`,
      commands: [
        {
          CreateCommand: {
            templateId: 'Splice.Wallet.TransferPreapproval:TransferPreapproval',
            createArguments: {
              provider: providerPartyId,
              receiver: allocatedPartyId,
              synchronizerId: synchronizer,
              expiresAt: '2026-07-12T00:00:00Z'
            }
          }
        }
      ]
    }
  };

  const queryCoinAcs = {
    service: 'com.daml.ledger.api.v2.StateService',
    method: 'GetActiveContracts',
    api: 'Ledger API ACS stream',
    payload: {
      filter: {
        filtersByParty: {
          [allocatedPartyId]: {
            cumulative: [
              {
                identifierFilter: {
                  TemplateFilter: {
                    templateId: 'Splice.Amulet:Amulet'
                  }
                }
              }
            ]
          }
        }
      },
      verbose: true
    }
  };

  const tokenStandardTransfer = {
    service: 'com.daml.ledger.api.v2.CommandService',
    method: 'SubmitAndWait',
    api: 'Token Standard transfer command envelope',
    payload: {
      actAs: [allocatedPartyId],
      commandId,
      deduplicationDuration: 'PT120S',
      commands: [
        {
          ExerciseCommand: {
            templateId: 'Splice.TokenStandard.TransferInstruction:TransferFactory',
            contractId: preApprovalContractId,
            choice: 'Transfer',
            choiceArgument: {
              sender: allocatedPartyId,
              receiver: receiverPartyId,
              amount: transferAmount,
              unit: 'CC',
              memo: 'Mandate verifier milestone payment'
            }
          }
        }
      ]
    }
  };

  const acsQueryHash = hashJson(queryCoinAcs.payload);
  const ledger: CantonLedgerStep[] = [
    {
      state: 'Party allocated',
      actor: validator,
      action: `Allocated internal party ${allocatedPartyId}`,
      api: 'Validator Admin API',
      receiptHash: hashJson(allocateParty)
    },
    {
      state: 'Pre-approval created',
      actor: providerPartyId,
      action: 'Created transfer pre-approval contract before any coin movement',
      api: 'Ledger API JSON',
      receiptHash: hashJson(createPreApproval)
    },
    {
      state: 'Balance indexed',
      actor: allocatedPartyId,
      action: 'Indexed active contracts for Canton Coin balance',
      api: 'Ledger API ACS',
      receiptHash: acsQueryHash
    },
    {
      state: 'Transfer prepared',
      actor: allocatedPartyId,
      action: `Prepared ${transferAmount} CC transfer to ${receiverPartyId}`,
      api: 'Ledger API JSON',
      receiptHash: hashJson(tokenStandardTransfer)
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    network: {
      synchronizer,
      validator,
      custody: 'internal'
    },
    party: {
      partyIdHint,
      allocatedPartyId,
      participantId,
      capability: 'canton.party.allocate'
    },
    preApproval: {
      templateId: 'Splice.Wallet.TransferPreapproval:TransferPreapproval',
      contractId: preApprovalContractId,
      providerPartyId,
      receiverPartyId: allocatedPartyId,
      capability: 'canton.preapproval.create'
    },
    coinBalance: {
      ownerPartyId: allocatedPartyId,
      tokenSymbol: 'CC',
      amount: '125.0000000000',
      acsQueryHash,
      capability: 'canton.coin.balance.read'
    },
    tokenTransfer: {
      senderPartyId: allocatedPartyId,
      receiverPartyId,
      amount: transferAmount,
      commandId,
      deduplicationOffset: 'PT120S',
      capability: 'canton.token.transfer'
    },
    lowLevelRequests: {
      allocateParty,
      createPreApproval,
      queryCoinAcs,
      tokenStandardTransfer
    },
    ledger
  };
}
