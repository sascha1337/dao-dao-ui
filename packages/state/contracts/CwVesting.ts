import { Coin, StdFee } from '@cosmjs/amino'
import {
  CosmWasmClient,
  ExecuteResult,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate'

import { Binary, Uint128 } from '@dao-dao/types/contracts/common'
import {
  OwnershipForAddr,
  VestingPayment,
} from '@dao-dao/types/contracts/CwVesting'

export interface CwVestingReadOnlyInterface {
  contractAddress: string
  info: () => Promise<VestingPayment>
  ownership: () => Promise<OwnershipForAddr>
  vestedAmount: () => Promise<Uint128>
}
export class CwVestingQueryClient implements CwVestingReadOnlyInterface {
  client: CosmWasmClient
  contractAddress: string

  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client
    this.contractAddress = contractAddress
    this.info = this.info.bind(this)
    this.ownership = this.ownership.bind(this)
    this.vestedAmount = this.vestedAmount.bind(this)
  }

  info = async (): Promise<VestingPayment> => {
    return this.client.queryContractSmart(this.contractAddress, {
      info: {},
    })
  }
  ownership = async (): Promise<OwnershipForAddr> => {
    return this.client.queryContractSmart(this.contractAddress, {
      ownership: {},
    })
  }
  vestedAmount = async (): Promise<Uint128> => {
    return this.client.queryContractSmart(this.contractAddress, {
      vested_amount: {},
    })
  }
}
export interface CwVestingInterface extends CwVestingReadOnlyInterface {
  contractAddress: string
  sender: string
  receive: (
    {
      amount,
      msg,
      sender,
    }: {
      amount: Uint128
      msg: Binary
      sender: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  distribute: (
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  cancel: (
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  delegate: (
    {
      amount,
      validator,
    }: {
      amount: Uint128
      validator: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  redelegate: (
    {
      amount,
      dstValidator,
      srcValidator,
    }: {
      amount: Uint128
      dstValidator: string
      srcValidator: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  undelegate: (
    {
      amount,
      validator,
    }: {
      amount: Uint128
      validator: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  setWithdrawAddress: (
    {
      address,
    }: {
      address: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  withdrawDelegatorReward: (
    {
      validator,
    }: {
      validator: string
    },
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
  // Batch withdraw rewards from multiple validators.
  withdrawDelegatorRewards: (
    {
      validators,
    }: {
      validators: string[]
    },
    fee?: number | StdFee | 'auto',
    memo?: string
  ) => Promise<ExecuteResult>
  updateOwnership: (
    fee?: number | StdFee | 'auto',
    memo?: string,
    funds?: Coin[]
  ) => Promise<ExecuteResult>
}
export class CwVestingClient
  extends CwVestingQueryClient
  implements CwVestingInterface
{
  client: SigningCosmWasmClient
  sender: string
  contractAddress: string

  constructor(
    client: SigningCosmWasmClient,
    sender: string,
    contractAddress: string
  ) {
    super(client, contractAddress)
    this.client = client
    this.sender = sender
    this.contractAddress = contractAddress
    this.receive = this.receive.bind(this)
    this.distribute = this.distribute.bind(this)
    this.cancel = this.cancel.bind(this)
    this.delegate = this.delegate.bind(this)
    this.redelegate = this.redelegate.bind(this)
    this.undelegate = this.undelegate.bind(this)
    this.setWithdrawAddress = this.setWithdrawAddress.bind(this)
    this.withdrawDelegatorReward = this.withdrawDelegatorReward.bind(this)
    this.withdrawDelegatorRewards = this.withdrawDelegatorRewards.bind(this)
    this.updateOwnership = this.updateOwnership.bind(this)
  }

  receive = async (
    {
      amount,
      msg,
      sender,
    }: {
      amount: Uint128
      msg: Binary
      sender: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        receive: {
          amount,
          msg,
          sender,
        },
      },
      fee,
      memo,
      funds
    )
  }
  distribute = async (
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        distribute: {},
      },
      fee,
      memo,
      funds
    )
  }
  cancel = async (
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        cancel: {},
      },
      fee,
      memo,
      funds
    )
  }
  delegate = async (
    {
      amount,
      validator,
    }: {
      amount: Uint128
      validator: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        delegate: {
          amount,
          validator,
        },
      },
      fee,
      memo,
      funds
    )
  }
  redelegate = async (
    {
      amount,
      dstValidator,
      srcValidator,
    }: {
      amount: Uint128
      dstValidator: string
      srcValidator: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        redelegate: {
          amount,
          dst_validator: dstValidator,
          src_validator: srcValidator,
        },
      },
      fee,
      memo,
      funds
    )
  }
  undelegate = async (
    {
      amount,
      validator,
    }: {
      amount: Uint128
      validator: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        undelegate: {
          amount,
          validator,
        },
      },
      fee,
      memo,
      funds
    )
  }
  setWithdrawAddress = async (
    {
      address,
    }: {
      address: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        set_withdraw_address: {
          address,
        },
      },
      fee,
      memo,
      funds
    )
  }
  withdrawDelegatorReward = async (
    {
      validator,
    }: {
      validator: string
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        withdraw_delegator_reward: {
          validator,
        },
      },
      fee,
      memo,
      funds
    )
  }
  // Batch withdraw rewards from multiple validators.
  withdrawDelegatorRewards = async (
    {
      validators,
    }: {
      validators: string[]
    },
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string
  ): Promise<ExecuteResult> => {
    return await this.client.executeMultiple(
      this.sender,
      validators.map((validator) => ({
        contractAddress: this.contractAddress,
        msg: {
          withdraw_delegator_reward: {
            validator,
          },
        },
      })),
      fee,
      memo
    )
  }
  updateOwnership = async (
    fee: number | StdFee | 'auto' = 'auto',
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    return await this.client.execute(
      this.sender,
      this.contractAddress,
      {
        update_ownership: {},
      },
      fee,
      memo,
      funds
    )
  }
}
