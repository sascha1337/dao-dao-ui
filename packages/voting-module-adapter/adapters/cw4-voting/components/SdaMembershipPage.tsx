import { useWallet } from '@noahsaso/cosmodal'

import { ConnectWalletButton } from '@dao-dao/common'
import { useVotingModule } from '@dao-dao/state'
import {
  Loader,
  MultisigMemberList,
  MultisigMemberListLoader,
  SuspenseLoader,
} from '@dao-dao/ui'

import { BaseSdaMembershipPageProps } from '../../../types'

export const SdaMembershipPage = ({
  coreAddress,
}: BaseSdaMembershipPageProps) => {
  const { connected, address: walletAddress } = useWallet()
  const { cw4VotingMembers, walletVotingWeight, totalVotingWeight } =
    useVotingModule(coreAddress, {
      fetchCw4VotingMembers: true,
    })

  if (!cw4VotingMembers || totalVotingWeight === undefined) {
    throw new Error('Failed to load page data.')
  }

  return (
    <div className="space-y-8">
      {!connected && <ConnectWalletButton className="!w-auto" />}

      <SuspenseLoader fallback={<MultisigMemberListLoader loader={Loader} />}>
        <MultisigMemberList
          members={cw4VotingMembers}
          totalWeight={totalVotingWeight}
          walletAddress={walletAddress}
          walletWeight={walletVotingWeight}
        />
      </SuspenseLoader>
    </div>
  )
}